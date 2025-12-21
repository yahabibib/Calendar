import React, { useMemo, useCallback } from 'react'
import { View, StyleSheet } from 'react-native'
import { CalendarEvent } from '../../../../../types/event'
import { calculateEventLayout } from '../../../utils/eventLayout'
// ✨ 引入新组件
import { DraggableEvent } from './DraggableEvent'
import { useEventStore } from '../../../../../store/eventStore'

interface EventColumnProps {
  events: CalendarEvent[]
  width: number
  onEventPress?: (event: CalendarEvent) => void
  dayDate: Date // ✨ 需要传入当天日期，用于计算绝对时间
}

export const EventColumn: React.FC<EventColumnProps> = React.memo(
  ({ events, width, onEventPress, dayDate }) => {
    const updateEvent = useEventStore(state => state.updateEvent) // 获取 store action

    // 1. 布局计算 (保持不变)
    const layoutEvents = useMemo(() => {
      return calculateEventLayout(events, width)
    }, [events, width])

    // ✨ 处理更新
    const handleUpdateEvent = useCallback(
      (id: string, newStart: Date, newEnd: Date) => {
        // 找到原事件
        const originalEvent = events.find(e => e.id === id)
        if (originalEvent) {
          // 更新时间，保持其他字段不变
          updateEvent({
            ...originalEvent,
            startDate: newStart.toISOString(),
            endDate: newEnd.toISOString(),
          })
        }
      },
      [events, updateEvent],
    )

    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {layoutEvents.map(event => (
          // ✨ 使用 DraggableEvent 替换原来的 View + ScheduleEvent
          <DraggableEvent
            key={event.id}
            event={event}
            layout={event.layout}
            dayDate={dayDate}
            onPress={onEventPress}
            onUpdate={handleUpdateEvent}
          />
        ))}
      </View>
    )
  },
)
