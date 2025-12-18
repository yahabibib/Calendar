import React from 'react'
import { StyleSheet } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AppNavigator } from './src/navigation/AppNavigator'

const styles = StyleSheet.create({
  gestureContainer: {
    flex: 1,
  },
})

const App = () => {
  return (
    <GestureHandlerRootView style={styles.gestureContainer}>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

export default App
