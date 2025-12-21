import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import { runOnJS } from 'react-native-reanimated'
// ✨ 确认使用：react-native-haptic-feedback
import ReactNativeHapticFeedback from 'react-native-haptic-feedback'
import { useWeekViewContext } from '../WeekViewContext'
import { HOUR_HEIGHT } from '../../../../../theme/layout'

// 震动配置
const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
}

interface DragCreateWrapperProps {
  date: Date
  children: React.ReactNode
  onCreateEvent: (timestamp: number, hour: number, minute: number) => void
}

export const DragCreateWrapper: React.FC<DragCreateWrapperProps> = ({
  date,
  children,
  onCreateEvent,
}) => {
  const { editingEventId, setEditingEventId } = useWeekViewContext()

  const baseTimestamp = useMemo(() => date.getTime(), [date])

  const longPressGesture = Gesture.LongPress()
    // ✨✨✨ 防误触核心 1：延长触发时间 ✨✨✨
    // 卡片是 300ms，这里设为 600ms。
    // 如果用户想拖卡片但按偏了，他在 300ms 没反应时会松手或移动，这就能避免误触创建。
    .minDuration(600)
    // ✨✨✨ 防误触核心 2：严格限制位移 ✨✨✨
    // 创建日程时，手指必须定在原地。如果移动超过 5px，说明用户可能想拖拽或滑动，直接取消创建。
    .maxDistance(5)
    .onStart(e => {
      if (editingEventId) return

      runOnJS(ReactNativeHapticFeedback.trigger)('impactMedium', hapticOptions)

      const y = e.y
      const hour = Math.floor(y / HOUR_HEIGHT)
      const minute = Math.floor(((y % HOUR_HEIGHT) / HOUR_HEIGHT) * 60)

      runOnJS(onCreateEvent)(baseTimestamp, hour, minute)
    })

  const tapGesture = Gesture.Tap().onEnd(() => {
    if (editingEventId) {
      runOnJS(setEditingEventId)(null)
      runOnJS(ReactNativeHapticFeedback.trigger)('impactLight', hapticOptions)
    }
  })

  const composedGesture = Gesture.Race(longPressGesture, tapGesture)

  return (
    <GestureDetector gesture={composedGesture}>
      <View style={styles.container}>{children}</View>
    </GestureDetector>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
})
