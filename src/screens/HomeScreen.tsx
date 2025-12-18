import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarWidget } from '../components/CalendarWidget';
import { EventList } from '../components/EventList';
import { MOCK_EVENTS, CalendarEvent } from '../types/event';
import { COLORS } from '../theme';
import { useEventStore } from '../store/eventStore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

export const HomeScreen = () => {

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  // 状态管理
  const events = useEventStore((state) => state.events);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // 业务逻辑 1: 计算日历标记点
  const markedDates = useMemo(() => {
    const marks: any = {};
    events.forEach(event => {
      const dateKey = event.startTime.split('T')[0];
      marks[dateKey] = { marked: true, dotColor: COLORS.secondary };
    });
    marks[selectedDate] = { 
      ...(marks[selectedDate] || {}), 
      selected: true, 
      selectedColor: COLORS.primary
    };
    return marks;
  }, [events, selectedDate]);

  // 业务逻辑 2: 过滤列表
  const filteredEvents = useMemo(() => {
    return events.filter(event => event.startTime.startsWith(selectedDate));
  }, [events, selectedDate]);

  // 业务逻辑 3: 处理点击
  const handleEventPress = (event: CalendarEvent) => {
    Alert.alert('事件详情', event.description || event.title);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部简单的 Header */}
      <View style={styles.header}>
        {/* 将来这里可以放 汉堡菜单 或 设置按钮 */}
      </View>

      {/* 模块 1: 日历 */}
      <CalendarWidget 
        selectedDate={selectedDate}
        markedDates={markedDates}
        onDateSelect={setSelectedDate}
      />

      {/* 模块 2: 列表 */}
      <EventList 
        date={selectedDate}
        events={filteredEvents}
        onEventPress={handleEventPress}
      />

      <TouchableOpacity 
         style={styles.fab}
         onPress={() => navigation.navigate('AddEvent')}
       >
         <Text style={styles.fabIcon}>+</Text>
       </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    // 暂时留空，以后做导航栏
    height: 10, 
  },
  // 悬浮按钮样式
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30, // 距离底部一点距离
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    // 强烈推荐加上阴影，更有层次感
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 30,
    color: 'white',
    marginTop: -4, // 微调 + 号位置
  }
});