import React, { useLayoutEffect } from 'react'
import { ScrollView, StyleSheet, TouchableOpacity, Text, View } from 'react-native'
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
  const initialEvent = route.params.event
  const event =
    useEventStore(state => state.events.find(e => e.id === initialEvent.id)) || initialEvent
  const removeEvent = useEventStore(state => state.removeEvent)

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
      title: '', // 详情页通常不需要中间的标题，因为 DetailHeader 已经有了大标题
      headerStyle: { backgroundColor: '#f2f2f6', shadowOpacity: 0, elevation: 0 },
    })
  }, [navigation, event])

  const handleDelete = () => {
    removeEvent(event.id)
    navigation.goBack()
  }

  return (
    <ScrollView style={styles.container}>
      {/* 1. 头部大标题 */}
      <DetailHeader title={event.title} color={event.color || '#2196F3'} />

      {/* 2. 时间卡片 */}
      <DetailTimeCard event={event} />

      {/* 3. 地图卡片 (仅当有位置时显示，或者未来 AI 推荐地点时显示) */}
      <LocationMapCard
        location={event.location}
        coordinates={event.coordinates} // ✨ 传入坐标
      />
      {/* 4. 详细信息卡片 (备注/URL/归属) */}
      <MetaInfoCard event={event} />

      {/* 5. 底部删除 */}
      <ActionFooter onDelete={handleDelete} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f6', // 保持统一的灰色背景
  },
  headerBtn: { padding: 10 },
  headerEdit: { fontSize: 17, color: '#007AFF', fontWeight: '600' },
  headerClose: { fontSize: 17, color: '#007AFF' },
})
