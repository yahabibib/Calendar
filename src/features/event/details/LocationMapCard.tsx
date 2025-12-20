// src/features/event/details/LocationMapCard.tsx
import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native'

interface LocationMapCardProps {
  location?: string
}

export const LocationMapCard: React.FC<LocationMapCardProps> = ({ location }) => {
  if (!location) return null

  return (
    <View style={styles.card}>
      {/* 标题栏 */}
      <View style={styles.headerRow}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>📍</Text>
        </View>
        <Text style={styles.locationText} numberOfLines={2}>
          {location}
        </Text>
      </View>

      {/* 地图容器 (未来替换为 MapKit) */}
      <TouchableOpacity
        style={styles.mapPlaceholder}
        onPress={() => Alert.alert('跳转地图', `导航到：${location}`)}
        activeOpacity={0.9}>
        {/* 这里目前放一个灰色背景，未来放 <MapView /> */}
        <View style={styles.mapInner}>
          <Text style={styles.mapLabel}>地图加载中...</Text>
          <Text style={styles.mapSubLabel}>(此处预留 MapKit 原生组件)</Text>
        </View>
      </TouchableOpacity>

      {/* 底部操作栏 (模拟 Apple Maps) */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          onPress={() => Alert.alert('路线', '规划路线中...')}
          style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>路线</Text>
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
    padding: 12,
    overflow: 'hidden', // 确保地图圆角
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F5E9', // 浅绿底
    borderRadius: 8,
    marginRight: 12,
  },
  iconText: { fontSize: 16 },
  locationText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1c1c1e',
    flex: 1,
  },

  // 地图样式
  mapPlaceholder: {
    height: 150,
    backgroundColor: '#e1e4e8',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  mapInner: { alignItems: 'center' },
  mapLabel: { color: '#8e8e93', fontWeight: '600', marginBottom: 4 },
  mapSubLabel: { color: '#8e8e93', fontSize: 12 },

  // 操作栏
  actionRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e5ea',
    paddingTop: 12,
    alignItems: 'center',
  },
  actionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    backgroundColor: '#f2f2f6',
    borderRadius: 6,
  },
  actionBtnText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 14,
  },
})
