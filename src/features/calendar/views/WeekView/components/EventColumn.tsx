import React, { useMemo, useCallback } from 'react'
import { View, StyleSheet, Alert } from 'react-native'
import { CalendarEvent } from '../../../../../types/event'
import { calculateEventLayout } from '../../../utils/eventLayout'
import { DraggableEvent } from './DraggableEvent'
import { useEventStore } from '../../../../../store/eventStore'

interface EventColumnProps {
  events: CalendarEvent[]
  width: number
  onEventPress?: (event: CalendarEvent) => void
  dayDate: Date
}

export const EventColumn: React.FC<EventColumnProps> = React.memo(
  ({ events, width, onEventPress, dayDate }) => {
    const updateEvent = useEventStore(state => state.updateEvent)
    const updateRecurringEvent = useEventStore(state => state.updateRecurringEvent)

    const layoutEvents = useMemo(() => {
      return calculateEventLayout(events, width)
    }, [events, width])

    const handleUpdateEvent = useCallback(
      (id: string, newStart: Date, newEnd: Date) => {
        const targetEvent = events.find(e => e.id === id)
        if (!targetEvent) return

        // 构造更新后的对象
        const updatedInstance = {
          ...targetEvent,
          startDate: newStart.toISOString(),
          endDate: newEnd.toISOString(),
        }

        // 判断是否为重复日程的影子实例
        if (targetEvent._isInstance && targetEvent._originalId) {
          // ✅ 统一交互：弹出询问框
          Alert.alert('修改重复日程', '您想仅修改此日程，还是修改该系列？', [
            {
              text: '取消',
              style: 'cancel',
              // 💡 提示：点击取消后，UI 会自动回弹到原位置，这是符合预期的
            },
            {
              text: '仅此日程',
              onPress: () => {
                updateRecurringEvent(
                  targetEvent._originalId!,
                  targetEvent.startDate,
                  updatedInstance,
                  'single',
                )
              },
            },
            {
              text: '将来所有',
              onPress: () => {
                updateRecurringEvent(
                  targetEvent._originalId!,
                  targetEvent.startDate,
                  updatedInstance,
                  'future',
                )
              },
            },
            {
              text: '所有日程',
              style: 'destructive',
              onPress: () => {
                updateRecurringEvent(
                  targetEvent._originalId!,
                  targetEvent.startDate,
                  updatedInstance,
                  'all',
                )
              },
            },
          ])
        } else {
          // 普通日程：直接更新
          updateEvent(updatedInstance)
        }
      },
      [events, updateEvent, updateRecurringEvent],
    )

    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {layoutEvents.map(event => (
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
