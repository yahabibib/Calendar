import React, { useLayoutEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../types/navigation'
import { useEventStore } from '../store/eventStore'
import { COLORS, SPACING } from '../theme'

// 定义路由和导航类型
type EventDetailsRouteProp = RouteProp<RootStackParamList, 'EventDetails'>
type NavigationProp = NativeStackNavigationProp<RootStackParamList>

export const EventDetailsScreen = () => {
  const route = useRoute<EventDetailsRouteProp>()
  const navigation = useNavigation<NavigationProp>()
  const { eventId } = route.params

  // 从 Store 中查找当前 ID 的事件
  const event = useEventStore(state => state.events.find(e => e.id === eventId))
  const deleteEvent = useEventStore(state => state.deleteEvent)

  // 如果找不到事件（比如被删除了），处理防崩溃
  if (!event) return null

  // --- 配置顶部导航栏按钮 ---
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('AddEvent', { event })} // 跳转去编辑，带上参数
        >
          <Text style={{ color: COLORS.primary, fontSize: 16, fontWeight: '600' }}>编辑</Text>
        </TouchableOpacity>
      ),
    })
  }, [navigation, event])

  // --- 删除逻辑 ---
  const handleDelete = () => {
    Alert.alert('确认删除', '删除后无法恢复，确定要删除吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          deleteEvent(eventId)
          navigation.goBack() // 删完回上一页
        },
      },
    ])
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.time}>{new Date(event.startTime).toLocaleString()}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>地点</Text>
        <Text style={styles.content}>{event.location || '无'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>备注</Text>
        <Text style={styles.content}>{event.description || '无'}</Text>
      </View>

      {/* 底部红色删除按钮 */}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteText}>删除此日程</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
  },
  headerSection: {
    marginBottom: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  time: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  content: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },
  deleteButton: {
    marginTop: 40,
    backgroundColor: '#fff0f0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffccc7',
  },
  deleteText: {
    color: COLORS.danger,
    fontWeight: 'bold',
    fontSize: 16,
  },
})
