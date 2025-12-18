import React, { useMemo } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { format, isSameDay, getDay, startOfMonth } from 'date-fns'
import { useCalendarGrid } from '../../hooks/useCalendarGrid'
import { styles, MONTH_TITLE_HEIGHT } from './styles'

// 导出常量供 CalendarWidget 使用
export { MONTH_TITLE_HEIGHT }

interface MonthViewProps {
  currentDate: Date
  selectedDate: Date
  onDateSelect: (date: Date) => void
  rowHeight: number
  cellWidth: number
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  onDateSelect,
  selectedDate,
  rowHeight,
  cellWidth,
}) => {
  const { gridData } = useCalendarGrid(currentDate)
  // const isIpad = useUIStore(state => state.isIpad); // 如果需要逻辑判断可用

  const monthLabel = format(currentDate, 'M月')
  const isJanuary = monthLabel === '1月'
  const displayLabel = isJanuary ? format(currentDate, 'yyyy年 M月') : monthLabel

  const paddingLeft = useMemo(() => {
    const firstDayOfMonth = startOfMonth(currentDate)
    let dayIndex = getDay(firstDayOfMonth)
    dayIndex = (dayIndex === 0 ? 7 : dayIndex) - 1
    return dayIndex * cellWidth
  }, [currentDate, cellWidth])

  return (
    <View style={styles.container}>
      <View style={[styles.monthHeader, { paddingLeft }]}>
        <Text style={[styles.monthHeaderText, isJanuary && styles.monthHeaderTextYear]}>
          {displayLabel}
        </Text>
      </View>

      <View style={styles.grid}>
        {gridData.map((dayItem, index) => {
          const isSelected = isSameDay(dayItem.date, selectedDate)
          const isLastColumn = (index + 1) % 7 === 0
          const isLastRow = index >= gridData.length - 7

          return (
            <TouchableOpacity
              key={dayItem.dateString}
              style={[
                styles.cell,
                { height: rowHeight, width: '14.2857%' }, // 动态样式
                isLastColumn && { borderRightWidth: 0 },
                isLastRow && { borderBottomWidth: 0 },
              ]}
              onPress={() => onDateSelect(dayItem.date)}
              activeOpacity={0.7}>
              <View
                style={[
                  styles.dayCircle,
                  isSelected && styles.selectedCircle,
                  !isSelected && dayItem.isToday && styles.todayCircle,
                ]}>
                <Text
                  style={[
                    styles.dayText,
                    isSelected && styles.selectedText,
                    !isSelected && dayItem.isToday && styles.todayText,
                  ]}>
                  {dayItem.dayNum}
                </Text>
              </View>
              <View style={styles.dotContainer} />
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}
