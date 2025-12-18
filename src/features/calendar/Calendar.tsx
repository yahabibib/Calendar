import React, { useState } from 'react'
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native'
import { format } from 'date-fns'
import { COLORS } from '../../theme'

import { MonthView } from './views/MonthView'
import { YearView } from './views/YearView'

export type CalendarViewMode = 'month' | 'year'

interface CalendarProps {
  // 允许外部传入初始值，或者作为非受控组件
  initialDate?: string
  // 添加按钮的回调
  onAddEventPress?: () => void
}

export const Calendar: React.FC<CalendarProps> = ({
  initialDate = new Date().toISOString().split('T')[0],
  onAddEventPress,
}) => {
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month')

  // 统一处理日期选择
  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr)
  }

  // 从年视图跳转回月视图
  const handleMonthSelectFromYear = (date: Date) => {
    setSelectedDate(format(date, 'yyyy-MM-dd'))
    setViewMode('month')
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {viewMode === 'month' ? (
          <MonthView
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onHeaderYearPress={() => setViewMode('year')}
          />
        ) : (
          <YearView
            currentYear={new Date(selectedDate)}
            onMonthSelect={handleMonthSelectFromYear}
          />
        )}
      </View>

      {/* FAB 按钮：只在月视图显示 */}
      {viewMode === 'month' && onAddEventPress && (
        <TouchableOpacity style={styles.fab} onPress={onAddEventPress}>
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 40,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 999,
  },
  fabIcon: {
    fontSize: 30,
    color: 'white',
    marginTop: -4,
  },
})
