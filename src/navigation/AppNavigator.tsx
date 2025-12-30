import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { HomeScreen } from '../screens/HomeScreen'
import { AddEventScreen } from '../screens/AddEventScreen'
import { EventDetailsScreen } from '../screens/EventDetailsScreen'
import { CalendarEvent } from '../types/event'

export type RootStackParamList = {
  Home: undefined
  AddEvent: { initialDate?: string; event?: Partial<CalendarEvent>; aiPrompt?: string }
  EventDetails: { event: CalendarEvent }
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />

        {/* ✨ 关键修复：在这里静态定义 Header 属性 */}
        <Stack.Screen
          name="AddEvent"
          component={AddEventScreen}
          options={{
            presentation: 'modal', // iOS 卡片式弹窗
            headerShown: true,
            title: '新建日程', // 默认标题
            headerBackTitleVisible: false, // 隐藏返回文字
            headerShadowVisible: false, // 去除阴影
            headerStyle: { backgroundColor: '#f2f2f6' }, // 匹配背景色
          }}
        />

        <Stack.Screen
          name="EventDetails"
          component={EventDetailsScreen}
          options={{
            presentation: 'modal',
            headerShown: true,
            title: '日程详情',
            headerBackTitleVisible: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
