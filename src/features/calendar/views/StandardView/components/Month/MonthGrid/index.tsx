import React from 'react'
import { View, Text } from 'react-native'
import { format } from 'date-fns'
import { useCalendarGrid } from '@/features/calendar/hooks/useCalendarGrid'
import { useMonthPadding } from '../../Shared/hooks/useMonthPadding'
import { MonthDayCell } from '../../Shared/components/MonthDayCell'
import { MONTH_TITLE_HEIGHT } from '../constants'
import { styles } from './styles'
import { getEventsForDate } from '@/utils/recurrence'
import { CalendarEvent } from '@/types/event'

interface MonthGridProps {
  currentDate: Date
  onDateSelect: (date: Date) => void
  rowHeight: number
  cellWidth: number
  events: CalendarEvent[]
}

export const MonthGrid = React.memo<MonthGridProps>(
  ({ currentDate, onDateSelect, rowHeight, cellWidth, events }) => {
    const { gridData } = useCalendarGrid(currentDate)

    const monthLabel = format(currentDate, 'M月')
    const isJanuary = monthLabel === '1月'
    const displayLabel = isJanuary ? format(currentDate, 'yyyy年 M月') : monthLabel
    const paddingLeft = useMonthPadding(currentDate, cellWidth)

    return (
      <View style={styles.container}>
        <View style={[styles.monthHeader, { height: MONTH_TITLE_HEIGHT, paddingLeft }]}>
          <Text style={[styles.monthHeaderText, isJanuary && styles.monthHeaderTextYear]}>
            {displayLabel}
          </Text>
        </View>

        <View style={styles.grid}>
          {gridData.map((dayItem, index) => {
            const isLastColumn = (index + 1) % 7 === 0

            if (!dayItem.isCurrentMonth) {
              return (
                <View
                  key={dayItem.dateString}
                  style={[
                    styles.cell,
                    { height: rowHeight, width: '14.2857%' },
                    isLastColumn && { borderRightWidth: 0 },
                  ]}
                />
              )
            }

            // ✨✨✨ 实时计算当前日期的圆点 ✨✨✨
            const dayEvents = getEventsForDate(events, dayItem.date)
            // 提取颜色，并去重（可选），这里简单直接映射
            const dots = dayEvents.map(e => e.color || '#2196F3')

            return (
              <MonthDayCell
                key={dayItem.dateString}
                dayNum={dayItem.dayNum}
                isToday={dayItem.isToday}
                width={'14.2857%'}
                height={rowHeight}
                showBorderRight={!isLastColumn}
                onPress={() => onDateSelect(dayItem.date)}
                dots={dots} // ✨ 传入
              />
            )
          })}
        </View>
      </View>
    )
  },
)
