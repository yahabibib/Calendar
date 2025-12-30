import React, { useCallback } from 'react'
import { View, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Calendar } from '../features/calendar/Calendar'
import { CalendarEvent } from '../types/event'
import { RootStackParamList } from '../navigation/AppNavigator'
import { useEventStore } from '../store/eventStore'

type NavigationProp = NativeStackNavigationProp<RootStackParamList>

export const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>()

  // 获取事件数据
  const events = useEventStore(state => state.events)

  const handleEventPress = useCallback(
    (event: CalendarEvent) => {
      navigation.navigate('EventDetails', { event })
    },
    [navigation],
  )

  const handleAddEvent = useCallback(() => {
    navigation.navigate('AddEvent', {})
  }, [navigation])

  return (
    <View style={styles.container}>
      <Calendar
        mode="week"
        events={events}
        onEventPress={handleEventPress}
        onAddEventPress={handleAddEvent}
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
