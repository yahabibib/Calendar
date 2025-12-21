import React, { useMemo, useCallback } from 'react'
import { View, StyleSheet } from 'react-native'
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

    const layoutEvents = useMemo(() => {
      return calculateEventLayout(events, width)
    }, [events, width])

    const handleUpdateEvent = useCallback(
      (id: string, newStart: Date, newEnd: Date) => {
        // ✨✨✨ 核心修复：解析 ID，还原真身 ✨✨✨
        // 如果是影子 ID (如 "1_172000000")，取下划线前面部分
        const realId = id.includes('_') ? id.split('_')[0] : id

        // 从当前视图的 props.events 里找不一定能找到原始对象（因为 props 里可能是影子对象）
        // 最好是去 Store 里找，或者直接用 layoutEvents 里的引用
        // 这里我们在 BodyList 已经传了影子对象进来了，影子对象里有 _originalId

        // 查找逻辑：先在 store 里找 (但这里拿不到 store 引用)，
        // 实际上 zustand 的 updateEvent 会自动处理状态合并，我们只需要构造出正确的对象
        // 但我们需要知道原始的 rrule 等信息，所以需要先找到原始对象

        // 简单方案：利用 store.events (需要 selector) 或者直接更新
        // 为了方便，我们这里做个假设：Store 里的 updateEvent 会遍历查找 ID

        // ⚠️ 修正：我们需要先获取完整的原始对象，因为 updateEvent 是全量替换
        // 但在这个组件里我们只能拿到 props.events（即影子或本体）。

        // 我们通过 props.events 找到当前被拖拽的这个影子对象
        const targetEvent = events.find(e => e.id === id)

        if (targetEvent) {
          // 如果是重复日程的实例，我们修改的是整个系列的基准时间
          // 这会导致所有重复项平移
          // 注意：targetEvent.startDate 是当前实例的时间，不是原始系列的开始时间

          // 🚨 MVP 简化策略：
          // 如果是重复日程，暂时不允许拖拽修改时间，因为逻辑太复杂（涉及修改 RRULE 或生成 EXDATE）
          // 或者：允许修改，但会变成“修改整个系列”

          if (targetEvent._isInstance) {
            // 如果需要支持，逻辑如下：
            // 1. 计算时间差 (delta) = newStart - currentInstanceStart
            // 2. 找到 Store 里的 masterEvent
            // 3. masterEvent.startDate += delta
            // 4. updateEvent(masterEvent)

            // 但这里我们没有 masterEvent 的引用。
            // 建议：V1 版本，如果是重复实例，暂不支持拖拽更新，或者在 DraggableEvent 里禁用拖拽。
            // 如果你想支持，需要引入 useEventStore 获取全量数据来查找 master。

            // 这里演示“仅允许拖拽普通日程”的逻辑，防止数据错乱
            console.warn('暂不支持拖拽修改重复日程实例')
            return
          }

          // 普通日程正常更新
          updateEvent({
            ...targetEvent,
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
