// src/features/event/details/MetaInfoCard.tsx
import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native'
import { CalendarEvent } from '../../../types/event'

interface MetaInfoCardProps {
  event: CalendarEvent
}

export const MetaInfoCard: React.FC<MetaInfoCardProps> = ({ event }) => {
  const hasContent = event.url || event.description || event.calendarId

  if (!hasContent) return null

  return (
    <View style={styles.card}>
      {/* 归属日历 */}
      <View style={styles.row}>
        <Text style={styles.label}>日历</Text>
        <View style={styles.calendarTag}>
          <View style={[styles.dot, { backgroundColor: event.color || '#2196F3' }]} />
          <Text style={styles.value}>{event.calendarId || '默认'}</Text>
        </View>
      </View>

      {/* URL */}
      {event.url ? (
        <>
          <View style={styles.separator} />
          <View style={styles.row}>
            <Text style={styles.label}>链接</Text>
            <TouchableOpacity onPress={() => Linking.openURL(event.url!)}>
              <Text style={styles.linkValue} numberOfLines={1}>
                {event.url}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      ) : null}

      {/* 备注 */}
      {event.description ? (
        <>
          <View style={styles.separator} />
          <View style={styles.column}>
            <Text style={styles.label}>备注</Text>
            <Text style={styles.descText}>{event.description}</Text>
          </View>
        </>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 36,
  },
  column: {
    marginTop: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e5ea',
    marginVertical: 10,
  },
  label: { fontSize: 15, color: '#8e8e93', width: 60 },
  value: { fontSize: 15, color: '#1c1c1e' },
  linkValue: { fontSize: 15, color: '#007AFF' },
  descText: {
    fontSize: 15,
    color: '#1c1c1e',
    marginTop: 4,
    lineHeight: 22,
    textAlign: 'justify',
  },
  calendarTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
})
