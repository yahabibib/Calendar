import React, { useState } from 'react'
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native'
import { format } from 'date-fns'
import { MonthView } from './views/MonthView'
import { YearView } from './views/YearView'
import { styles } from './Calendar.styles'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import LinearGradient from 'react-native-linear-gradient'
import { WeekView } from './views/WeekView'
import { CalendarEvent } from '../../types/event'

export type CalendarViewMode = 'month' | 'year' | 'week'

interface CalendarProps {
  initialDate?: string
  onAddEventPress?: () => void
  // ✨ 1. 新增：定义点击事件类型
  onEventPress?: (event: CalendarEvent) => void
}

export const Calendar: React.FC<CalendarProps> = ({
  initialDate = new Date().toISOString().split('T')[0],
  onAddEventPress,
  onEventPress, // ✨ 2. 新增：接收这个 prop
}) => {
  const insets = useSafeAreaInsets()

  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month')

  // --- 核心导航逻辑 ---

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr)

    // 在月视图选中日期，自动进入周视图
    if (viewMode === 'month') {
      setViewMode('week')
    }
  }

  // 处理周视图的长按添加
  const handleWeekTimeSlotPress = (date: Date) => {
    console.log('Long pressed at:', date)
    // 这里的逻辑如果需要由外部控制，可以通过 onAddEventPress 传参，
    // 或者直接在这里不做处理，依赖 DragCreateWrapper 的长按逻辑
  }

  // 1. 年视图 -> 月视图
  const handleMonthSelectFromYear = (date: Date) => {
    setSelectedDate(format(date, 'yyyy-MM-dd'))
    setViewMode('month')
  }

  // 2. 月视图 -> 年视图
  const handleHeaderYearPress = (currentVisualDate: Date) => {
    setSelectedDate(format(currentVisualDate, 'yyyy-MM-dd'))
    setViewMode('year')
  }

  // 3. 周视图 -> 月视图
  const handleBackToMonth = (currentVisualDate: Date) => {
    setSelectedDate(format(currentVisualDate, 'yyyy-MM-dd'))
    setViewMode('month')
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {viewMode === 'year' && (
          <YearView
            currentYear={new Date(selectedDate)}
            onMonthSelect={handleMonthSelectFromYear}
          />
        )}

        {viewMode === 'month' && (
          <MonthView
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onHeaderYearPress={handleHeaderYearPress}
          />
        )}

        {viewMode === 'week' && (
          <WeekView
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onHeaderBackPress={handleBackToMonth}
            onAddEvent={handleWeekTimeSlotPress}
            // ✨ 3. 关键修复：透传 onEventPress，而不是写死 console.log
            onEventPress={onEventPress}
          />
        )}
      </View>

      <LinearGradient
        colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 1)']}
        locations={[0, 0.4, 1]}
        style={[styles.bottomGradient, { height: insets.bottom + 30, bottom: 0 }]}
        pointerEvents="none"
      />

      {viewMode !== 'year' && onAddEventPress && (
        <TouchableOpacity style={styles.fab} onPress={onAddEventPress}>
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
