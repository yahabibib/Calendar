import React, { useState } from 'react'
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native'
import { format, isSameMonth, isSameDay } from 'date-fns'
import { MonthView } from './views/MonthView'
import { YearView } from './views/YearView'
import { styles } from './Calendar.styles'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import LinearGradient from 'react-native-linear-gradient'
import { WeekView } from './views/WeekView'

export type CalendarViewMode = 'month' | 'year' | 'week'

interface CalendarProps {
  initialDate?: string
  onAddEventPress?: () => void
}

export const Calendar: React.FC<CalendarProps> = ({
  initialDate = new Date().toISOString().split('T')[0],
  onAddEventPress,
}) => {
  const insets = useSafeAreaInsets()

  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month')

  // --- 核心导航逻辑 ---

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr)

    // ✨ 关键交互：在月视图选中日期，自动进入周视图
    if (viewMode === 'month') {
      setViewMode('week')
    }
  }

  // 处理周视图的长按添加
  const handleWeekTimeSlotPress = (date: Date) => {
    console.log('Long pressed at:', date)
    // 这里可以导航到 AddEventScreen，并带上时间参数
    // navigation.navigate('AddEvent', { startDate: date.toISOString() });

    // 如果你是通过 props 传入的 onAddEventPress，可能需要改一下签名让它接收参数
    // 或者在这里暂存状态
  }

  // 1. 年视图 -> 月视图
  const handleMonthSelectFromYear = (date: Date) => {
    // 逻辑：如果是当前月，尽量保持“今天”选中；否则选中1号
    // (这里保留你之前的逻辑，或者简化为直接跳到该月1号)
    setSelectedDate(format(date, 'yyyy-MM-dd'))
    setViewMode('month')
  }

  // 2. 月视图 -> 年视图 (接收当前月视图停留的日期)
  const handleHeaderYearPress = (currentVisualDate: Date) => {
    // ✨ 关键：先更新全局选中日期为用户刚才看到的月份
    setSelectedDate(format(currentVisualDate, 'yyyy-MM-dd'))
    // 再切换视图，YearView 就会定位到这个年份
    setViewMode('year')
  }

  // 3. 周视图 -> 月视图 (接收当前周视图停留的日期)
  const handleBackToMonth = (currentVisualDate: Date) => {
    // ✨ 关键：先更新全局选中日期
    setSelectedDate(format(currentVisualDate, 'yyyy-MM-dd'))
    // 再切换视图，MonthView 就会定位到这个月份
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
            // ✨ 传入新的回调
            onHeaderYearPress={handleHeaderYearPress}
          />
        )}

        {viewMode === 'week' && (
          <WeekView
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onHeaderBackPress={handleBackToMonth}
            // ✨ 传入回调
            onAddEvent={handleWeekTimeSlotPress}
            onEventPress={event => console.log('Clicked event:', event.title)}
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
