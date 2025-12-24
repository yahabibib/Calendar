import React, { useCallback } from 'react'
import { View, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Calendar } from '../features/calendar/Calendar'
import { CalendarEvent } from '../types/event'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

export const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>()

  const handleEventPress = useCallback(
    (event: CalendarEvent) => {
      navigation.navigate('EventDetails', { event })
    },
    [navigation],
  )

  // 之前的 onAddEventPress 逻辑可以保留或根据需求调整
  const handleAddEvent = useCallback(() => {
    navigation.navigate('AddEvent', {})
  }, [navigation])

  return (
    <View style={styles.container}>
      <Calendar
        mode="week"
        onEventPress={handleEventPress}
        onAddEventPress={handleAddEvent} // 确保加号按钮能用
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
