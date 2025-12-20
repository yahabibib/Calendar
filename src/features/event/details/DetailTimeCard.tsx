// src/features/event/details/DetailTimeCard.tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { CalendarEvent } from '../../../types/event'

interface DetailTimeCardProps {
  event: CalendarEvent
}

export const DetailTimeCard: React.FC<DetailTimeCardProps> = ({ event }) => {
  const start = new Date(event.startDate)
  const end = new Date(event.endDate)

  const dayStr = format(start, 'M月d日 EEEE', { locale: zhCN })
  const timeStr = event.isAllDay ? '全天' : `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`

  // 解析重复规则文案 (简化版，后续可用 rrule.js 库生成更自然的语言)
  const getRepeatText = () => {
    if (!event.rrule) return null
    const freq = typeof event.rrule === 'string' ? 'CUSTOM' : event.rrule.freq
    const map: Record<string, string> = {
      DAILY: '每天',
      WEEKLY: '每周',
      MONTHLY: '每月',
      YEARLY: '每年',
    }
    return map[freq] || '自定义重复'
  }
  const repeatText = getRepeatText()

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>🕒</Text>
        </View>
        <View>
          <Text style={styles.dateText}>{dayStr}</Text>
          <Text style={styles.timeText}>{timeStr}</Text>
          {repeatText && <Text style={styles.repeatText}>🔁 {repeatText}</Text>}
        </View>
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
    // 轻微阴影
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f2f6',
    borderRadius: 8,
    marginRight: 12,
  },
  iconText: { fontSize: 16 },
  dateText: { fontSize: 17, fontWeight: '600', color: '#1c1c1e', marginBottom: 4 },
  timeText: { fontSize: 15, color: '#8e8e93' },
  repeatText: { fontSize: 13, color: '#007AFF', marginTop: 6, fontWeight: '500' },
})
