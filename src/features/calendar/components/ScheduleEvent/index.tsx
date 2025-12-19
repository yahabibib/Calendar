import React from 'react'
import { TouchableOpacity, Text, View } from 'react-native'
import { format, differenceInMinutes, startOfDay } from 'date-fns'
import { styles } from './styles'
import { HOUR_HEIGHT } from '../../../../theme/layout'
import { CalendarEvent } from '../../../../types/event' // 假设你有这个类型定义

interface ScheduleEventProps {
  event: CalendarEvent
  onPress: (event: CalendarEvent) => void
}

export const ScheduleEvent = React.memo<ScheduleEventProps>(({ event, onPress }) => {
  const startDate = new Date(event.startDate)
  const endDate = new Date(event.endDate)

  // 1. 计算开始时间的偏移量 (分钟数)
  // 例如 01:30 = 90分钟
  const startOfDayDate = startOfDay(startDate)
  const startMinutes = differenceInMinutes(startDate, startOfDayDate)
  const durationMinutes = differenceInMinutes(endDate, startDate)

  // 2. 转换为像素位置
  // 1小时(60分) = HOUR_HEIGHT
  const top = (startMinutes / 60) * HOUR_HEIGHT
  const height = (durationMinutes / 60) * HOUR_HEIGHT

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          top,
          height: Math.max(height, 15), // 最小高度防止太小点不到
          backgroundColor: event.color + '33', // 增加透明度作为背景
          borderLeftColor: event.color,
        },
      ]}
      onPress={() => onPress(event)}
      activeOpacity={0.8}>
      <Text style={styles.title} numberOfLines={1}>
        {event.title}
      </Text>
      {height > 30 && (
        <Text style={styles.time} numberOfLines={1}>
          {format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}
        </Text>
      )}
    </TouchableOpacity>
  )
})
