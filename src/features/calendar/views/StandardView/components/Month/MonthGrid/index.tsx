import React from 'react'
import { View, Text } from 'react-native'
import { format } from 'date-fns'
import { useCalendarGrid } from '@/features/calendar/hooks/useCalendarGrid'
import { useMonthPadding } from '../../Shared/hooks/useMonthPadding'
import { MonthDayCell } from '../../Shared/components/MonthDayCell'
import { MONTH_TITLE_HEIGHT } from '../constants'
import { styles } from './styles'

interface MonthGridProps {
  currentDate: Date
  onDateSelect: (date: Date) => void
  rowHeight: number
  cellWidth: number
}

export const MonthGrid = React.memo<MonthGridProps>(
  ({ currentDate, onDateSelect, rowHeight, cellWidth }) => {
    const { gridData } = useCalendarGrid(currentDate)

    // 标题逻辑
    const monthLabel = format(currentDate, 'M月')
    const isJanuary = monthLabel === '1月'
    const displayLabel = isJanuary ? format(currentDate, 'yyyy年 M月') : monthLabel

    // 首日偏移量
    const paddingLeft = useMonthPadding(currentDate, cellWidth)

    return (
      <View style={styles.container}>
        {/* 标题栏 */}
        <View style={[styles.monthHeader, { height: MONTH_TITLE_HEIGHT, paddingLeft }]}>
          <Text style={[styles.monthHeaderText, isJanuary && styles.monthHeaderTextYear]}>
            {displayLabel}
          </Text>
        </View>
        {/* 日期网格 */}
        <View style={styles.grid}>
          {gridData.map((dayItem, index) => {
            // 去除多余线
            const isLastColumn = (index + 1) % 7 === 0
            // 非本月日期：只占位，不渲染内容 (Invisible)
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
            // 本月日期
            return (
              <MonthDayCell
                key={dayItem.dateString}
                dayNum={dayItem.dayNum}
                isToday={dayItem.isToday}
                width={'14.2857%'} // 或者传具体 pixel 值
                height={rowHeight}
                showBorderRight={!isLastColumn}
                onPress={() => onDateSelect(dayItem.date)} // 这里传 onPress
              />
            )
          })}
        </View>
      </View>
    )
  },
)
