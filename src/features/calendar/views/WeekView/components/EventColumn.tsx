import React, { useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import { CalendarEvent } from '../../../../../types/event'
import { ScheduleEvent } from '../../../components/ScheduleEvent'
import { calculateEventLayout } from '../../../utils/eventLayout'

interface EventColumnProps {
  events: CalendarEvent[]
  width: number
  onEventPress?: (event: CalendarEvent) => void
}

export const EventColumn: React.FC<EventColumnProps> = React.memo(
  ({ events, width, onEventPress }) => {
    // 1. 调用布局引擎计算坐标
    // 使用 useMemo 缓存计算结果，只有 events 或 width 变了才重算
    const layoutEvents = useMemo(() => {
      return calculateEventLayout(events, width)
    }, [events, width])

    return (
      // 使用 StyleSheet.absoluteFill 覆盖在 DayBodyItem 上
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {layoutEvents.map(event => (
          <View
            key={event.id}
            style={{
              position: 'absolute',
              top: event.layout.top,
              left: event.layout.left,
              width: event.layout.width,
              height: event.layout.height,
              // 加上一点 padding，防止看起来太挤
              paddingRight: 2,
            }}>
            {/* 复用原本的 ScheduleEvent 组件 */}
            {/* 注意：ScheduleEvent 内部可能需要适配，如果它以前是自己算高度的，现在由外部容器控制 */}
            <ScheduleEvent
              event={event}
              onPress={onEventPress}
              // 强制 ScheduleEvent 填满容器
              style={{ flex: 1 }}
            />
          </View>
        ))}
      </View>
    )
  },
)
