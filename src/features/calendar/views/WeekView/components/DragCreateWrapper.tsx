// src/features/calendar/views/WeekView/components/DragCreateWrapper.tsx
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import { runOnJS } from 'react-native-reanimated'
import { HOUR_HEIGHT } from '../../../../../theme/layout'

interface DragCreateWrapperProps {
  children: React.ReactNode
  date: Date
  // ✨ 修改回调签名：接收时间戳(number)而不是Date对象
  onCreateEvent: (timestamp: number, startHour: number, startMinute: number) => void
}

export const DragCreateWrapper: React.FC<DragCreateWrapperProps> = ({
  children,
  date,
  onCreateEvent,
}) => {
  // ✨ 关键修复：提前转为时间戳 (number)，确保能安全地穿过 UI/JS 线程边界
  const dateTimestamp = date.getTime()

  // 定义长按手势
  const longPressGesture = Gesture.LongPress()
    .minDuration(300)
    .onStart(event => {
      'worklet' // 显式标记 (虽然 Gesture 默认就是)

      const y = event.y
      const totalMinutes = (y / HOUR_HEIGHT) * 60
      const snappedMinutes = Math.floor(totalMinutes / 15) * 15

      const startHour = Math.floor(snappedMinutes / 60)
      const startMinute = snappedMinutes % 60

      // ✨ 关键修复：传递 timestamp (数字)
      runOnJS(onCreateEvent)(dateTimestamp, startHour, startMinute)
    })

  return (
    <GestureDetector gesture={longPressGesture}>
      <View style={styles.container}>{children}</View>
    </GestureDetector>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
})
