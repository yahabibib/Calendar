import React, { useState } from 'react'
import { View, StyleSheet, TouchableOpacity, Text, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { format } from 'date-fns'

// 引入两个组件
import { CalendarWidget } from '../components/CalendarWidget'
import { YearCalendarWidget } from '../components/YearCalendarWidget' // 记得导入

import { COLORS } from '../theme'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../types/navigation'

export const HomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // ✨ 新增：视图模式状态
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month')

  // 处理：从年视图选择了一个月份
  const handleMonthSelect = (date: Date) => {
    // 1. 更新选中的日期（通常选中该月1号）
    setSelectedDate(format(date, 'yyyy-MM-dd'))
    // 2. 切回月视图
    setViewMode('month')
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <View style={styles.calendarContainer}>
          {viewMode === 'month' ? (
            // --- 月视图 ---
            <CalendarWidget
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              // ✨ 点击左上角年份，切换到年视图
              onYearHeaderPress={() => setViewMode('year')}
            />
          ) : (
            // --- 年视图 ---
            <YearCalendarWidget
              currentYear={new Date(selectedDate)}
              onMonthSelect={handleMonthSelect}
            />
          )}
        </View>

        {/* FAB 按钮 (仅在月视图或根据需求显示) */}
        {viewMode === 'month' && (
          <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddEvent')}>
            <Text style={styles.fabIcon}>+</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  safeArea: {
    flex: 1,
  },
  calendarContainer: {
    flex: 1,
    // 不需要 marginTop，CalendarWidget 会自动利用 padding 避开刘海
  },
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
