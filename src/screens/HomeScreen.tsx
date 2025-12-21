import React, { useCallback } from 'react'
import { View, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native' // ✨ 引入 hook
import { Calendar } from '../features/calendar/Calendar'
import { CalendarEvent } from '../types/event'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'

// 定义导航类型
type NavigationProp = NativeStackNavigationProp<RootStackParamList>

export const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>() // ✨ 获取 navigation

  // ✨ 定义点击处理函数
  const handleEventPress = useCallback(
    (event: CalendarEvent) => {
      navigation.navigate('EventDetails', { event })
    },
    [navigation],
  )

  return (
    <View style={styles.container}>
      <Calendar
        mode="week"
        onEventPress={handleEventPress} // ✨ 绑定跳转逻辑
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
})
