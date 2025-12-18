import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { HomeScreen } from '../screens/HomeScreen'
import { AddEventScreen } from '../screens/AddEventScreen'
import { EventDetailsScreen } from '../screens/EventDetailsScreen'
import { RootStackParamList } from '../types/navigation'

const Stack = createNativeStackNavigator<RootStackParamList>()

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      {/* ✨ 关键修改：全局禁用默认 Header */}
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="AddEvent"
          component={AddEventScreen}
          // 如果添加页面需要某种模态效果，可以在这里单独配置
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
