import React, { useEffect, useMemo } from 'react'
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  useAnimatedReaction,
} from 'react-native-reanimated'
// ✨ 确认使用：react-native-haptic-feedback
import ReactNativeHapticFeedback from 'react-native-haptic-feedback'
import { addMinutes, setHours, setMinutes, startOfDay, addDays } from 'date-fns'
import { CalendarEvent } from '../../../../../../types/event'
import { HOUR_HEIGHT } from '../../../../../../theme/layout'
import { ScheduleEvent } from '../../../../components/ScheduleEvent'
import { useWeekViewContext } from './WeekViewContext'
import { useEventStore } from '../../../../../../store/eventStore'

const SNAP_MINUTES = 15
const GRID_HEIGHT = (SNAP_MINUTES / 60) * HOUR_HEIGHT
const MIN_HEIGHT = GRID_HEIGHT
const MENU_OFFSET = 60
const MENU_HEIGHT = 40
const HANDLE_SIZE = 12

// 震动配置
const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
}

// 布局属性
interface LayoutProps {
  top: number
  height: number
  left: number
  width: number
}

interface DraggableEventProps {
  event: CalendarEvent // 事件数据
  layout: LayoutProps // 事件布局
  dayDate: Date // 当前日期
  onUpdate: (id: string, newStartDate: Date, newEndDate: Date) => void // 事件更新回调
  onPress: (event: CalendarEvent) => void // 事件点击回调
}

export const DraggableEvent: React.FC<DraggableEventProps> = ({
  event,
  layout,
  dayDate,
  onUpdate,
  onPress,
}) => {
  const { editingEventId, setEditingEventId, dayColumnWidth } = useWeekViewContext()
  const removeEvent = useEventStore(state => state.removeEvent)

  const isEditing = editingEventId === event.id
  // 交互状态（UI线程驱动）
  const isActive = useSharedValue(false)

  const top = useSharedValue(layout.top)
  const height = useSharedValue(layout.height)
  const left = useSharedValue(layout.left)
  const width = useSharedValue(layout.width)

  const startTop = useSharedValue(0)
  const startHeight = useSharedValue(0)
  const startLeft = useSharedValue(0)

  const isDraggingBody = useSharedValue(false)
  const isResizingTop = useSharedValue(false)
  const isResizingBottom = useSharedValue(false)

  // 布局同步
  useEffect(() => {
    if (!isActive.value) {
      top.value = withTiming(layout.top, { duration: 200 })
      height.value = withTiming(layout.height, { duration: 200 })
      left.value = withTiming(layout.left, { duration: 200 })
      width.value = withTiming(layout.width, { duration: 200 })
    }
  }, [layout, top, height, left, width, isDraggingBody, isActive.value])

  // 震动逻辑
  const triggerTick = () => {
    ReactNativeHapticFeedback.trigger('impactLight', hapticOptions)
  }

  // 震动反馈：每移动到新的时间格时触发
  useAnimatedReaction(
    () => Math.round(top.value / GRID_HEIGHT),
    (current, prev) => {
      if (prev !== null && current !== prev) {
        if (isDraggingBody.value || isResizingTop.value || isResizingBottom.value) {
          runOnJS(triggerTick)()
        }
      }
    },
  )

  // 最终更新处理
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

  // 提交更新
  const commitUpdate = () => {
    'worklet'
    const finalTop = top.value
    const finalHeight = height.value

    // 计算目标列索引
    const safeWidth = !dayColumnWidth || dayColumnWidth === 0 ? 1 : dayColumnWidth
    const colIndex = Math.round(left.value / safeWidth)

    // 计算原始列索引
    const originalColIndex = Math.round(layout.left / safeWidth)

    // 得出天数偏移量
    const dayOffset = colIndex - originalColIndex

    // 时间计算保持不变
    const totalStartMinutes = Math.round((finalTop / HOUR_HEIGHT) * 60)
    const startHour = Math.floor(totalStartMinutes / 60)
    const startMinute = totalStartMinutes % 60
    const durationMinutes = Math.round((finalHeight / HOUR_HEIGHT) * 60)

    runOnJS(processFinalUpdate)(startHour, startMinute, durationMinutes, dayOffset)
  }

  // 公共逻辑：公共的开始、更新、结束逻辑
  const onPanStartCommon = (x: number, y: number) => {
    'worklet'
    isActive.value = true
    startTop.value = top.value
    startLeft.value = left.value
  }

  const onPanUpdateCommon = (translationX: number, translationY: number) => {
    'worklet'
    // Y轴：吸附
    const rawTop = startTop.value + translationY
    const snappedTop = Math.round(rawTop / GRID_HEIGHT) * GRID_HEIGHT
    top.value = Math.max(0, snappedTop)

    // X轴：平滑
    left.value = startLeft.value + translationX
  }

  const onPanEndCommon = () => {
    'worklet'
    const safeWidth = !dayColumnWidth || dayColumnWidth === 0 ? 1 : dayColumnWidth
    const targetColIndex = Math.round(left.value / safeWidth)
    const targetLeft = targetColIndex * safeWidth

    left.value = withSpring(targetLeft, { mass: 0.5, damping: 12, stiffness: 100 })
    commitUpdate()
    isActive.value = false
  }

  // 防止 React Re-render (由 setEditingEventId 触发) 导致手势重置
  const gesture = useMemo(() => {
    // A. 瞬时拖拽 (编辑态专用)
    // 逻辑：如果 isEditing 为 true，这个手势会生效。
    const instantPan = Gesture.Pan()
      .enabled(isEditing) // 这个属性可以动态变，只要不把手势从 Race 中移除即可
      .onStart(e => {
        onPanStartCommon(e.x, e.y)
      })
      .onUpdate(e => {
        onPanUpdateCommon(e.translationX, e.translationY)
      })
      .onEnd(onPanEndCommon)

    // B. 延时拖拽 (非编辑态/冷启动专用)
    // ✨ 关键修复：永远不要 disable 它！
    // 即使 isEditing 变成了 true，如果这个手势正在运行，必须让它跑完！
    // Race 机制会保证：如果你已经是编辑态，手指放上去瞬间 instantPan 会赢，delayedPan 根本没机会跑，所以不 disable 也没事。
    const delayedPan = Gesture.Pan()
      .activateAfterLongPress(250)
      .onStart(e => {
        // 激活瞬间
        runOnJS(ReactNativeHapticFeedback.trigger)('impactMedium', hapticOptions)
        runOnJS(setEditingEventId)(event.id) // 触发重绘，但因为 useMemo，手势不会断
        onPanStartCommon(e.x, e.y)
      })
      .onUpdate(e => {
        onPanUpdateCommon(e.translationX, e.translationY)
      })
      .onEnd(onPanEndCommon)

    // C. 点击手势
    // 逻辑：如果 instantPan 没触发（比如只是轻点没移动），或者 delayedPan 还在等，Tap 会生效
    const tap = Gesture.Tap()
      .maxDuration(250)
      .onEnd(() => {
        if (isEditing) {
          runOnJS(setEditingEventId)(null)
        } else {
          runOnJS(onPress)(event)
        }
      })

    // D. 组合
    // 永远返回同一个 Race 结构，不要用三元表达式切换结构！
    return Gesture.Race(instantPan, delayedPan, tap)
  }, [isEditing, event.id, dayColumnWidth, layout]) // 依赖项：只有这些变了才重建

  // 调整大小事件：只在编辑模式下生效，调整对齐到网格顶部，结束时提交更新
  const resizeTopGesture = Gesture.Pan()
    .enabled(isEditing)
    .hitSlop({ top: 20, bottom: 20, left: 20, right: 20 })
    .onStart(() => {
      isResizingTop.value = true
      startTop.value = top.value
      startHeight.value = height.value
      runOnJS(ReactNativeHapticFeedback.trigger)('selection', hapticOptions)
    })
    .onUpdate(e => {
      // 对齐到网格顶部
      const deltaY = e.translationY
      if (isNaN(deltaY)) return
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

  // 调整大小事件：只在编辑模式下生效，调整对齐到网格顶部，结束时提交更新
  const resizeBottomGesture = Gesture.Pan()
    .enabled(isEditing)
    .hitSlop({ top: 20, bottom: 20, left: 20, right: 20 })
    .onStart(() => {
      isResizingBottom.value = true
      startHeight.value = height.value
      runOnJS(ReactNativeHapticFeedback.trigger)('selection', hapticOptions)
    })
    .onUpdate(e => {
      const newHeight = startHeight.value + e.translationY
      if (isNaN(newHeight)) return
      const snappedHeight = Math.round(newHeight / GRID_HEIGHT) * GRID_HEIGHT
      height.value = Math.max(MIN_HEIGHT, snappedHeight)
    })
    .onEnd(() => {
      isResizingBottom.value = false
      commitUpdate()
    })

  // 容器样式：根据编辑状态调整位置、大小和层级
  const containerStyle = useAnimatedStyle(() => {
    // 视觉状态由两者共同决定：只要按住(isActive) 或者 处于编辑态(isEditing) 都浮起
    const showLifted = isEditing || isActive.value

    return {
      top: top.value,
      left: left.value,
      height: height.value,
      width: width.value,
      position: 'absolute',
      zIndex: showLifted ? 999 : 1, // 浮起时层级最高

      // 阴影与缩放：isActive 时(拖拽中)反馈更强
      shadowColor: '#000',
      shadowOffset: { width: 0, height: showLifted ? 5 : 1 },
      shadowOpacity: showLifted ? 0.3 : 0,
      shadowRadius: showLifted ? 8 : 0,
      elevation: showLifted ? 5 : 0,

      // 拖拽时放大 1.05倍，仅编辑态时放大 1.02倍
      transform: [{ scale: withSpring(isActive.value ? 1.05 : isEditing ? 1.02 : 1) }],
    }
  })

  // 句柄样式：根据编辑状态调整透明度和缩放
  const handleStyle = useAnimatedStyle(() => ({
    opacity: isEditing ? 1 : 0,
    transform: [{ scale: isEditing ? 1 : 0 }],
  }))

  // 菜单样式：根据编辑状态调整透明度和位置
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
    runOnJS(ReactNativeHapticFeedback.trigger)('notificationSuccess', hapticOptions)
    removeEvent(event.id)
  }

  const handleCopy = () => {
    setEditingEventId(null)
    runOnJS(ReactNativeHapticFeedback.trigger)('notificationSuccess', hapticOptions)
    alert('已复制')
  }

  return (
    <Animated.View style={containerStyle} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
      <Animated.View style={[styles.menuContainer, menuStyle]}>
        <TouchableOpacity style={styles.menuItem} onPress={handleCopy}>
          <Text style={styles.menuText}>拷贝</Text>
        </TouchableOpacity>
        <View style={styles.menuDivider} />
        <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
          <Text style={styles.menuText}>删除</Text>
        </TouchableOpacity>
      </Animated.View>

      <GestureDetector gesture={resizeTopGesture}>
        <Animated.View style={[styles.handleContainer, styles.topHandle, handleStyle]}>
          <View style={styles.handleDot} />
        </Animated.View>
      </GestureDetector>

      <GestureDetector gesture={gesture}>
        <Animated.View style={{ flex: 1 }}>
          <ScheduleEvent event={event} style={{ flex: 1, borderRadius: isEditing ? 6 : 4 }} />
        </Animated.View>
      </GestureDetector>

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
