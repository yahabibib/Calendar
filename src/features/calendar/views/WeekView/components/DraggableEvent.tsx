import React, { useEffect } from 'react'
import { StyleSheet, View, Text, TouchableOpacity, Vibration, Dimensions } from 'react-native'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated'
import { addMinutes, setHours, setMinutes, startOfDay, addDays } from 'date-fns'
import { CalendarEvent } from '../../../../../types/event'
import { HOUR_HEIGHT, TIME_AXIS_WIDTH } from '../../../../../theme/layout'
import { ScheduleEvent } from '../../../components/ScheduleEvent'
import { useWeekViewContext } from '../WeekViewContext'
import { useEventStore } from '../../../../../store/eventStore'

const SNAP_MINUTES = 15
const GRID_HEIGHT = (SNAP_MINUTES / 60) * HOUR_HEIGHT
const MIN_HEIGHT = GRID_HEIGHT
const HANDLE_SIZE = 12
const MENU_HEIGHT = 40
const MENU_OFFSET = 60
const EDGE_THRESHOLD = 40 // 边缘感应距离
const SCROLL_COOLDOWN = 1500 // 翻页冷却时间

interface LayoutProps {
  top: number
  height: number
  left: number
  width: number
}

interface DraggableEventProps {
  event: CalendarEvent
  layout: LayoutProps
  dayDate: Date
  onUpdate: (id: string, newStartDate: Date, newEndDate: Date) => void
  onPress: (event: CalendarEvent) => void
}

export const DraggableEvent: React.FC<DraggableEventProps> = ({
  event,
  layout,
  dayDate,
  onUpdate,
  onPress,
}) => {
  const { editingEventId, setEditingEventId, dayColumnWidth, triggerPageScroll } =
    useWeekViewContext()
  const removeEvent = useEventStore(state => state.removeEvent)

  const isEditing = editingEventId === event.id
  const screenWidth = Dimensions.get('window').width

  const top = useSharedValue(layout.top)
  const height = useSharedValue(layout.height)
  const left = useSharedValue(layout.left)
  const width = useSharedValue(layout.width)

  const startTop = useSharedValue(0)
  const startHeight = useSharedValue(0)
  const startLeft = useSharedValue(0)
  const lastScrollTime = useSharedValue(0)

  const isDraggingBody = useSharedValue(false)
  const isResizingTop = useSharedValue(false)
  const isResizingBottom = useSharedValue(false)

  // --- 布局同步 ---
  // 只有在非编辑、非拖拽时，才响应外部布局变化
  useEffect(() => {
    if (!isEditing && !isDraggingBody.value) {
      top.value = withTiming(layout.top, { duration: 200 })
      height.value = withTiming(layout.height, { duration: 200 })
      left.value = withTiming(layout.left, { duration: 200 })
      width.value = withTiming(layout.width, { duration: 200 })
    }
  }, [layout, isEditing, top, height, left, width, isDraggingBody])

  // --- 手势更新 ---
  const processFinalUpdate = (
    startHour: number,
    startMinute: number,
    durationMinutes: number,
    dayOffset: number,
  ) => {
    let newStart = setHours(startOfDay(dayDate), startHour)
    newStart = setMinutes(newStart, startMinute)
    if (dayOffset !== 0) {
      newStart = addDays(newStart, dayOffset)
    }
    const newEnd = addMinutes(newStart, durationMinutes)
    onUpdate(event.id, newStart, newEnd)
  }

  const handleEdgeTrigger = (direction: -1 | 1) => {
    Vibration.vibrate(10)
    triggerPageScroll(direction)
  }

  const commitUpdate = () => {
    'worklet'
    const finalTop = top.value
    const finalHeight = height.value
    const finalLeft = left.value

    const totalStartMinutes = Math.round((finalTop / HOUR_HEIGHT) * 60)
    const startHour = Math.floor(totalStartMinutes / 60)
    const startMinute = totalStartMinutes % 60
    const durationMinutes = Math.round((finalHeight / HOUR_HEIGHT) * 60)

    const offsetX = finalLeft - layout.left
    const dayOffset = Math.round(offsetX / dayColumnWidth)

    runOnJS(processFinalUpdate)(startHour, startMinute, durationMinutes, dayOffset)
  }

  // --- 手势定义 ---
  const longPressGesture = Gesture.LongPress()
    .minDuration(300)
    .onStart(() => {
      runOnJS(setEditingEventId)(event.id)
      runOnJS(Vibration.vibrate)(50)
    })

  // 设置 activeOffsetX
  // 只有当横向移动超过 10px 时才激活 Pan，或者更激进：
  // 只有在 isEditing 为 true 时，才允许 Pan 抢占
  const dragBodyGesture = Gesture.Pan()
    .enabled(isEditing)
    .onStart(() => {
      isDraggingBody.value = true
      startTop.value = top.value
      startLeft.value = left.value
    })
    .onUpdate(e => {
      // Y 轴吸附
      const rawTop = startTop.value + e.translationY
      const snappedTop = Math.round(rawTop / GRID_HEIGHT) * GRID_HEIGHT
      top.value = Math.max(0, snappedTop)
      // X 轴跟随
      left.value = startLeft.value + e.translationX
      // 边缘触发
      const absoluteX = e.absoluteX
      const now = Date.now()
      if (now - lastScrollTime.value > SCROLL_COOLDOWN) {
        if (absoluteX < TIME_AXIS_WIDTH + EDGE_THRESHOLD) {
          lastScrollTime.value = now
          runOnJS(handleEdgeTrigger)(-1)
        } else if (absoluteX > screenWidth - EDGE_THRESHOLD) {
          lastScrollTime.value = now
          runOnJS(handleEdgeTrigger)(1)
        }
      }
    })
    .onEnd(() => {
      isDraggingBody.value = false
      commitUpdate()
    })

  const resizeTopGesture = Gesture.Pan()
    .enabled(isEditing)
    .hitSlop({ top: 20, bottom: 20, left: 20, right: 20 })
    .onStart(() => {
      isResizingTop.value = true
      startTop.value = top.value
      startHeight.value = height.value
    })
    .onUpdate(e => {
      const deltaY = e.translationY
      let newTop = startTop.value + deltaY
      newTop = Math.round(newTop / GRID_HEIGHT) * GRID_HEIGHT
      const maxTop = startTop.value + startHeight.value - MIN_HEIGHT
      newTop = Math.min(newTop, maxTop)
      newTop = Math.max(0, newTop)
      const newHeight = startHeight.value + (startTop.value - newTop)
      top.value = newTop
      height.value = newHeight
    })
    .onEnd(() => {
      isResizingTop.value = false
      commitUpdate()
    })

  const resizeBottomGesture = Gesture.Pan()
    .enabled(isEditing)
    .hitSlop({ top: 20, bottom: 20, left: 20, right: 20 })
    .onStart(() => {
      isResizingBottom.value = true
      startHeight.value = height.value
    })
    .onUpdate(e => {
      const newHeight = startHeight.value + e.translationY
      const snappedHeight = Math.round(newHeight / GRID_HEIGHT) * GRID_HEIGHT
      height.value = Math.max(MIN_HEIGHT, snappedHeight)
    })
    .onEnd(() => {
      isResizingBottom.value = false
      commitUpdate()
    })

  const tapGesture = Gesture.Tap()
    .enabled(!isEditing)
    .onEnd(() => {
      runOnJS(onPress)(event)
    })

  // 只有在编辑模式下，才让 Pan 手势参与竞争
  const bodyComposedGesture = isEditing
    ? Gesture.Race(dragBodyGesture, longPressGesture)
    : Gesture.Race(longPressGesture, tapGesture) // ✨ 非编辑模式下，根本没有 Pan，FlatList 100% 获得控制权

  // --- 样式 ---
  const containerStyle = useAnimatedStyle(() => ({
    top: top.value,
    left: left.value,
    height: height.value,
    width: width.value,
    position: 'absolute',
    zIndex: isEditing ? 999 : 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: isEditing ? 5 : 0 },
    shadowOpacity: isEditing ? 0.35 : 0,
    shadowRadius: isEditing ? 10 : 0,
    elevation: isEditing ? 10 : 0,
    transform: [{ scale: withSpring(isEditing ? 1.05 : 1) }],
  }))

  const handleStyle = useAnimatedStyle(() => ({
    opacity: isEditing ? 1 : 0,
    transform: [{ scale: isEditing ? 1 : 0 }],
  }))

  const menuStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isEditing ? 1 : 0),
    top: -MENU_OFFSET,
    left: width.value / 2 - 60,
    position: 'absolute',
    zIndex: 1000,
    pointerEvents: isEditing ? 'auto' : 'none',
  }))

  const handleDelete = () => {
    setEditingEventId(null)
    removeEvent(event.id)
  }

  const handleCopy = () => {
    setEditingEventId(null)
    alert('已复制')
  }

  return (
    <Animated.View style={containerStyle}>
      {/* 菜单 */}
      <Animated.View style={[styles.menuContainer, menuStyle]}>
        <TouchableOpacity style={styles.menuItem} onPress={handleCopy}>
          <Text style={styles.menuText}>拷贝</Text>
        </TouchableOpacity>
        <View style={styles.menuDivider} />
        <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
          <Text style={styles.menuText}>删除</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* 顶部手柄 */}
      <GestureDetector gesture={resizeTopGesture}>
        <Animated.View style={[styles.handleContainer, styles.topHandle, handleStyle]}>
          <View style={styles.handleDot} />
        </Animated.View>
      </GestureDetector>

      {/* 主体 */}
      <GestureDetector gesture={bodyComposedGesture}>
        <Animated.View style={{ flex: 1 }}>
          <ScheduleEvent event={event} style={{ flex: 1, borderRadius: isEditing ? 6 : 4 }} />
        </Animated.View>
      </GestureDetector>

      {/* 底部手柄 */}
      <GestureDetector gesture={resizeBottomGesture}>
        <Animated.View style={[styles.handleContainer, styles.bottomHandle, handleStyle]}>
          <View style={styles.handleDot} />
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  handleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  topHandle: { top: -15 },
  bottomHandle: { bottom: -15 },
  handleDot: {
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#2196F3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  menuContainer: {
    width: 120,
    height: MENU_HEIGHT,
    backgroundColor: '#333',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  menuItem: { paddingHorizontal: 10, paddingVertical: 5 },
  menuText: { color: 'white', fontSize: 12, fontWeight: '600' },
  menuDivider: { width: 1, height: 16, backgroundColor: '#555' },
})
