import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { format } from 'date-fns'
// ⚠️ 路径修正
import { useCalendarGrid } from '../../hooks/useCalendarGrid'
import { styles } from './styles'

interface MiniMonthGridProps {
  date: Date
  onMonthPress: (date: Date) => void
  cellWidth: number
}

// ✨ 组件重命名
export const MiniMonthGrid: React.FC<MiniMonthGridProps> = ({ date, onMonthPress, cellWidth }) => {
  const { gridData } = useCalendarGrid(date)
  const daySize = (cellWidth - 10) / 7
  const monthTitle = format(date, 'M月')
  const titleColor = '#ff3b30'

  return (
    <TouchableOpacity
      style={[styles.container, { width: cellWidth }]}
      onPress={() => onMonthPress(date)}
      activeOpacity={0.6}>
      <Text style={[styles.monthTitle, { color: titleColor }]}>{monthTitle}</Text>

      <View style={styles.grid}>
        {gridData.map((dayItem, index) => {
          if (!dayItem.isCurrentMonth) {
            return <View key={index} style={{ width: daySize, height: daySize }} />
          }
          const isToday = dayItem.isToday
          return (
            <View
              key={index}
              style={[
                styles.dayCell,
                { width: daySize, height: daySize },
                isToday && styles.todayCell,
              ]}>
              <Text style={[styles.dayText, isToday && styles.todayText]}>{dayItem.dayNum}</Text>
            </View>
          )
        })}
      </View>
    </TouchableOpacity>
  )
}
