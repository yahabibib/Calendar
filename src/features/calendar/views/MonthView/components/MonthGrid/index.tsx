import React, { useMemo } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { format, isSameDay, getDay, startOfMonth } from 'date-fns'

import { useCalendarGrid } from '../../../../hooks/useCalendarGrid'
import { styles, MONTH_TITLE_HEIGHT } from './styles'

export { MONTH_TITLE_HEIGHT }

interface MonthGridProps {
  currentDate: Date
  selectedDate: Date
  onDateSelect: (date: Date) => void
  rowHeight: number
  cellWidth: number
}

export const MonthGrid: React.FC<MonthGridProps> = ({
  currentDate,
  onDateSelect,
  selectedDate,
  rowHeight,
  cellWidth,
}) => {
  const { gridData } = useCalendarGrid(currentDate)

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

          // ✨ 修复 1: 隐藏非本月日期（如12月31日后面的1月1日）
          // 渲染一个空的 View 占位，保持 flex 布局对齐，但不显示内容
          if (!dayItem.isCurrentMonth) {
            return (
              <View
                key={dayItem.dateString}
                style={[
                  styles.cell,
                  { height: rowHeight, width: '14.2857%' }, // 保持宽度占位
                  isLastColumn && { borderRightWidth: 0 },
                  isLastRow && { borderBottomWidth: 0 },
                ]}
              />
            )
          }

          return (
            <TouchableOpacity
              key={dayItem.dateString}
              style={[
                styles.cell,
                { height: rowHeight, width: '14.2857%' },
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
