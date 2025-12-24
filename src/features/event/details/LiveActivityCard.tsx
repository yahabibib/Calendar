import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  NativeModules,
  Alert,
  Platform,
} from 'react-native'
import { CalendarEvent } from '../../../types/event'

// 获取原生模块
const { CalendarLiveActivity } = NativeModules

interface LiveActivityCardProps {
  event: CalendarEvent
}

export const LiveActivityCard: React.FC<LiveActivityCardProps> = ({ event }) => {
  // 只在 iOS 上显示此卡片
  if (Platform.OS !== 'ios') return null

  const handleStartActivity = () => {
    if (!CalendarLiveActivity) {
      Alert.alert('错误', '灵动岛模块不可用')
      return
    }

    const now = Date.now()
    const startTime = new Date(event.startDate).getTime()
    const endTime = new Date(event.endDate).getTime()

    // 简单的校验：已经结束的会议就不开启了
    if (endTime < now) {
      Alert.alert('提示', '会议已结束，无法开启灵动岛')
      return
    }

    CalendarLiveActivity.startActivity(
      event.title,
      now,
      endTime,
      event.location || '',
      '导航',
      'map', // 左按钮
      '晚点',
      'delay', // 右按钮
    )
    Alert.alert('成功', '已添加到灵动岛，请切回桌面查看')
  }

  const handleStopActivity = () => {
    if (CalendarLiveActivity) {
      CalendarLiveActivity.endActivity()
      Alert.alert('已关闭', '灵动岛活动已结束')
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>🏝️</Text>
        <Text style={styles.title}>灵动岛 / 实时活动</Text>
      </View>

      <Text style={styles.hint}>将此会议的倒计时固定在锁屏或灵动岛上。</Text>

      <View style={styles.btnRow}>
        <TouchableOpacity style={[styles.btn, styles.startBtn]} onPress={handleStartActivity}>
          <Text style={styles.btnTextStart}>开启展示</Text>
        </TouchableOpacity>

        <View style={{ width: 12 }} />

        <TouchableOpacity style={[styles.btn, styles.stopBtn]} onPress={handleStopActivity}>
          <Text style={styles.btnTextStop}>关闭</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: { fontSize: 18, marginRight: 8 },
  title: { fontSize: 16, fontWeight: '600', color: '#1c1c1e' },
  hint: { fontSize: 14, color: '#8e8e93', marginBottom: 16, lineHeight: 20 },
  btnRow: { flexDirection: 'row' },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startBtn: { backgroundColor: '#f2f2f6' },
  stopBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ff3b30' },
  btnTextStart: { color: '#007AFF', fontWeight: '600', fontSize: 16 },
  btnTextStop: { color: '#ff3b30', fontWeight: '600', fontSize: 16 },
})
