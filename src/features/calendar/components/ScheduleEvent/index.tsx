import React, { useMemo } from 'react'
import { TouchableOpacity, Text, StyleProp, ViewStyle } from 'react-native'
import { format } from 'date-fns'
import { CalendarEvent } from '../../../../types/event'
import { styles } from './styles'

interface ScheduleEventProps {
  event: CalendarEvent
  onPress?: (event: CalendarEvent) => void
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
