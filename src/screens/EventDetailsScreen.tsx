import React, { useLayoutEffect } from 'react'
import { ScrollView, StyleSheet, TouchableOpacity, Text, View, Alert } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { RootStackParamList } from '../navigation/AppNavigator'
import { useEventStore } from '../store/eventStore'

// 引入积木组件
import { DetailHeader } from '../features/event/details/DetailHeader'
import { DetailTimeCard } from '../features/event/details/DetailTimeCard'
import { LocationMapCard } from '../features/event/details/LocationMapCard'
import { MetaInfoCard } from '../features/event/details/MetaInfoCard'
import { ActionFooter } from '../features/event/details/ActionFooter'

type EventDetailsRouteProp = RouteProp<RootStackParamList, 'EventDetails'>

export const EventDetailsScreen = () => {
  const navigation = useNavigation<any>()
  const route = useRoute<EventDetailsRouteProp>()

  // 获取最新数据
  // 逻辑：优先从 Store 找（保持实时性），找不到（比如是影子实例）则用 params
  const initialEvent = route.params.event
  const event =
    useEventStore(state => state.events.find(e => e.id === initialEvent.id)) || initialEvent

  const removeEvent = useEventStore(state => state.removeEvent)
  const deleteRecurringEvent = useEventStore(state => state.deleteRecurringEvent) // ✨ 新增：获取删除重复日程的方法

  // 1. 配置 Header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('AddEvent', { event })}
          style={styles.headerBtn}>
          <Text style={styles.headerEdit}>编辑</Text>
        </TouchableOpacity>
      ),
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Text style={styles.headerClose}>关闭</Text>
        </TouchableOpacity>
      ),
      title: '', // 详情页通常不需要中间的标题
      headerStyle: { backgroundColor: '#f2f2f6', shadowOpacity: 0, elevation: 0 },
    })
  }, [navigation, event])

  // ✨✨✨ 修复后的删除逻辑 ✨✨✨
  const handleDelete = () => {
    // 场景 A: 重复日程的分身 (影子实例)
    if (event._isInstance && event._originalId) {
      Alert.alert('删除重复日程', '您想仅删除此日程，还是删除该系列将来所有的日程？', [
        { text: '取消', style: 'cancel' },
        {
          text: '仅此日程',
          style: 'destructive', // 红色警示样式
          onPress: () => {
            deleteRecurringEvent(event._originalId!, event.startDate, 'single')
            navigation.goBack()
          },
        },
        {
          text: '将来所有',
          style: 'destructive',
          onPress: () => {
            deleteRecurringEvent(event._originalId!, event.startDate, 'future')
            navigation.goBack()
          },
        },
      ])
    }
    // 场景 B: 普通日程 (或母日程)
    else {
      Alert.alert('删除日程', '确定要删除这个日程吗？', [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            removeEvent(event.id)
            navigation.goBack()
          },
        },
      ])
    }
  }

  return (
    <ScrollView style={styles.container}>
      {/* 1. 头部大标题 */}
      <DetailHeader title={event.title} color={event.color || '#2196F3'} />

      {/* 2. 时间卡片 */}
      {/* ✅ 修复点：恢复传递整个 event 对象，匹配 DetailTimeCard 的定义 */}
      <DetailTimeCard event={event} />

      {/* 3. 地图卡片 */}
      {event.location ? (
        <LocationMapCard location={event.location} coordinates={event.coordinates} />
      ) : null}

      {/* 4. 详细信息卡片 */}
      {/* 假设 MetaInfoCard 也接收 event 对象，保持一致 */}
      <MetaInfoCard event={event} />

      {/* 5. 底部删除 */}
      <ActionFooter onDelete={handleDelete} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f6',
  },
  headerBtn: { padding: 10 },
  headerEdit: { fontSize: 17, color: '#007AFF', fontWeight: '600' },
  headerClose: { fontSize: 17, color: '#007AFF' },
})
