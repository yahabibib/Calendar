import React, { useMemo } from 'react'
import { TouchableOpacity, Text, View, StyleSheet, StyleProp, ViewStyle } from 'react-native'
import { format } from 'date-fns'
import { CalendarEvent } from '../../../../types/event'
import { styles } from './styles'

interface ScheduleEventProps {
  event: CalendarEvent
  onPress?: (event: CalendarEvent) => void
  // ✨ 新增 style 属性，允许外部控制布局
  style?: StyleProp<ViewStyle>
}

export const ScheduleEvent: React.FC<ScheduleEventProps> = React.memo(
  ({ event, onPress, style }) => {
    // 格式化时间显示
    const timeLabel = useMemo(() => {
      const start = new Date(event.startDate)
      const end = new Date(event.endDate)
      return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`
    }, [event.startDate, event.endDate])

    return (
      <TouchableOpacity
        // ✨ 将外部传入的 style 合并进来
        // 注意：这里不再计算 top/height，完全由外部控制
        style={[styles.container, { backgroundColor: event.color || '#2196F3' }, style]}
        onPress={() => onPress?.(event)}
        activeOpacity={0.8}>
        <Text style={styles.title} numberOfLines={1}>
          {event.title}
        </Text>
        <Text style={styles.time} numberOfLines={1}>
          {timeLabel}
        </Text>
      </TouchableOpacity>
    )
  },
)
