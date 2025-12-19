import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableWithoutFeedback,
  GestureResponderEvent,
} from 'react-native'
import { addDays, setHours, setMinutes, isSameDay, startOfDay } from 'date-fns'

import { styles } from './styles'
import { HOUR_HEIGHT } from '../../../../theme/layout'
import { ScheduleEvent } from '../ScheduleEvent'
import { CurrentTimeIndicator } from '../CurrentTimeIndicator'
import { CalendarEvent } from '../../../../types/event'
import { useEventStore } from '../../../../store/eventStore'

interface WeekScheduleProps {
  weekStartDate: Date
  onTimeSlotPress: (date: Date) => void
  onEventPress: (event: CalendarEvent) => void
  numColumns: number // ✨ 接收列数
}

export const WeekSchedule: React.FC<WeekScheduleProps> = ({
  weekStartDate,
  onTimeSlotPress,
  onEventPress,
  numColumns,
}) => {
  const events = useEventStore(state => state.events)
  const scrollViewRef = useRef<ScrollView>(null)

  const hours = Array.from({ length: 24 }).map((_, i) => i)
  // ✨ 动态生成列数
  const days = Array.from({ length: numColumns }).map((_, i) => i)

  // ... useEffect 滚动逻辑保持不变 ...

  const handleLongPress = (evt: GestureResponderEvent, dayIndex: number) => {
    // ... 逻辑保持不变 ...
    const { locationY } = evt.nativeEvent
    const hour = Math.floor(locationY / HOUR_HEIGHT)
    const rawMinutes = ((locationY % HOUR_HEIGHT) / HOUR_HEIGHT) * 60
    const minutes = Math.floor(rawMinutes / 15) * 15

    let targetDate = addDays(weekStartDate, dayIndex)
    targetDate = setHours(targetDate, hour)
    targetDate = setMinutes(targetDate, minutes)

    onTimeSlotPress(targetDate)
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ height: HOUR_HEIGHT * 24 }}>
      <View style={styles.container}>
        {/* 左侧刻度保持不变 */}
        <View style={styles.timeRulerColumn}>
          {hours.map(h => (
            <View key={h} style={styles.timeLabel}>
              <Text style={styles.timeText}>{h === 0 ? '' : `${h}:00`}</Text>
            </View>
          ))}
        </View>

        {/* 右侧网格 */}
        <View style={styles.gridContainer}>
          <View style={styles.gridLinesContainer} pointerEvents="none">
            {hours.map(h => (
              <View key={`line-${h}`} style={styles.hourLine} />
            ))}
          </View>

          <View style={styles.columnsContainer}>
            {days.map(dayIndex => {
              const currentDayDate = addDays(weekStartDate, dayIndex)
              const isTodayColumn = isSameDay(currentDayDate, new Date())
              // const isWeekend = ... (逻辑移除)

              const daysEvents = events.filter(e =>
                isSameDay(new Date(e.startDate), currentDayDate),
              )

              return (
                <TouchableWithoutFeedback
                  key={dayIndex}
                  onLongPress={e => handleLongPress(e, dayIndex)}
                  delayLongPress={300}>
                  <View
                    style={[
                      styles.dayColumn,
                      // ✨ 样式统一，不再区分周末
                      // 仅保留基础边框即可，背景统一为透明或白色
                      { width: `${100 / numColumns}%` }, // 确保宽度平分
                    ]}>
                    {daysEvents.map(event => (
                      <ScheduleEvent key={event.id} event={event} onPress={onEventPress} />
                    ))}

                    {isTodayColumn && <CurrentTimeIndicator />}
                  </View>
                </TouchableWithoutFeedback>
              )
            })}
          </View>
        </View>
      </View>
    </ScrollView>
  )
}
