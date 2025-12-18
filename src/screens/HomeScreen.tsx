import React, { useState } from 'react'
import { View, StyleSheet, TouchableOpacity, Text, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CalendarWidget } from '../components/CalendarWidget'
import { COLORS } from '../theme'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../types/navigation'

export const HomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  return (
    <View style={styles.container}>
      {/* ✨ 状态栏核心配置：
         1. translucent: 允许内容钻到状态栏底下
         2. backgroundColor="transparent": 背景透明
         3. barStyle="dark-content": 文字变黑（适应白色背景日历）
      */}
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* 只保护底部 (Home Indicator) 和左右，顶部完全放开 */}
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        {/* 日历区域：flex: 1 撑满全屏 */}
        <View style={styles.calendarContainer}>
          <CalendarWidget selectedDate={selectedDate} onDateSelect={setSelectedDate} />
        </View>

        {/* 悬浮按钮 */}
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddEvent')}>
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
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
