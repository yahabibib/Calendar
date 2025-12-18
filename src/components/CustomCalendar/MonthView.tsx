import React, { useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { format, isSameDay, getDay, startOfMonth } from 'date-fns'
import { COLORS } from '../../theme'
import { useCalendarGrid } from './useCalendarGrid'

const IS_IPAD = Platform.OS === 'ios' && Platform.isPad
export const MONTH_TITLE_HEIGHT = 50

interface MonthViewProps {
  currentDate: Date
  selectedDate: Date
  onDateSelect: (date: Date) => void
  rowHeight: number
  cellWidth: number // 接收动态宽度
}

export const MonthView: React.FC<MonthViewProps> = ({
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
    // 使用动态宽度计算
    return dayIndex * cellWidth
  }, [currentDate, cellWidth])

  return (
    <View style={styles.container}>
      <View style={[styles.monthHeader, { paddingLeft }]}>
        <Text style={[styles.monthHeaderText, isJanuary && styles.monthHeaderTextYear]}>
          {displayLabel}
        </Text>
      </View>

      <View style={[styles.grid, { width: cellWidth * 7 }]}>
        {gridData.map((dayItem, index) => {
          const isSelected = isSameDay(dayItem.date, selectedDate)
          const isLastColumn = (index + 1) % 7 === 0
          const isLastRow = index >= gridData.length - 7

          return (
            <TouchableOpacity
              key={dayItem.dateString}
              style={[
                styles.cell,
                { height: rowHeight, width: cellWidth },
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

const styles = StyleSheet.create({
  container: {},
  monthHeader: {
    height: MONTH_TITLE_HEIGHT,
    justifyContent: 'flex-end',
    paddingBottom: 10,
  },
  monthHeaderText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'left',
    marginLeft: 5,
  },
  monthHeaderTextYear: {
    color: '#000',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap', // 允许换行
    // ✨ 技巧：如果精度问题导致换行，可以加 width: '100%' 确保容器撑满
    width: '100%',
  },
  cell: {
    // 宽度由 style 属性传入
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
    borderRightWidth: IS_IPAD ? 0.5 : 0,
    borderRightColor: '#E5E5EA',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCircle: { backgroundColor: COLORS.primary },
  todayCircle: { backgroundColor: '#F2F2F7' },
  dayText: { fontSize: 19, color: '#000', fontWeight: '400', letterSpacing: -0.5 },
  selectedText: { color: 'white', fontWeight: '600' },
  todayText: { color: COLORS.primary, fontWeight: '600' },
  dotContainer: { flexDirection: 'row', marginTop: 4 },
})
