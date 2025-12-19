import React from 'react'
import { View, StyleSheet, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../types/navigation'

import { Calendar } from '../features/calendar/Calendar'

export const HomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ✨ 核心修改：移除 'bottom' */}
      {/* 这样 Calendar 就会延伸到屏幕物理最底端 */}
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        <Calendar onAddEventPress={() => navigation.navigate('AddEvent')} />
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
})
