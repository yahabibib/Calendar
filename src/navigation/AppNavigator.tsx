import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// 引入类型和页面
import { RootStackParamList } from '../types/navigation';
import { HomeScreen } from '../screens/HomeScreen';
import { AddEventScreen } from '../screens/AddEventScreen';
import { EventDetailsScreen } from '../screens/EventDetailsScreen';
import { COLORS } from '../theme';

// 创建 Stack 实例
const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          // 全局头部样式配置
          headerStyle: { backgroundColor: COLORS.cardBg },
          headerTintColor: COLORS.primary,
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: '我的日历' }} 
        />
        
        <Stack.Screen 
          name="AddEvent" 
          component={AddEventScreen} 
          options={{ title: '新建日程' }} 
        />

        <Stack.Screen 
          name="EventDetails" 
          component={EventDetailsScreen} 
          options={{ title: '日程详情' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};