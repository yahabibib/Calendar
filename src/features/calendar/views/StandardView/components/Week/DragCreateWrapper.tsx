import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import { runOnJS } from 'react-native-reanimated'
import ReactNativeHapticFeedback from 'react-native-haptic-feedback'
import { useWeekViewContext } from './WeekViewContext'
import { HOUR_HEIGHT } from '../../../../../../theme/layout'

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
    // 1：延长触发时间
    .minDuration(600)
    // 2：严格限制位移
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
