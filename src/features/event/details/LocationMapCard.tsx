import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, Platform } from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import { LatLng } from '../../../types/event'

interface LocationMapCardProps {
  location?: string
  coordinates?: LatLng
}

export const LocationMapCard: React.FC<LocationMapCardProps> = ({ location, coordinates }) => {
  if (!location) return null

  // 跳转系统地图进行导航
  const handleOpenMap = () => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' })
    const latLng = coordinates ? `${coordinates.latitude},${coordinates.longitude}` : ''
    const label = location

    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    })

    if (url) {
      Linking.openURL(url)
    } else {
      Alert.alert('无法打开地图')
    }
  }

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

      {/* 地图区域 */}
      <TouchableOpacity style={styles.mapContainer} onPress={handleOpenMap} activeOpacity={0.9}>
        {coordinates ? (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
              latitudeDelta: 0.01, // 缩放级别：数字越小越精细
              longitudeDelta: 0.01,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
            pointerEvents="none" // 让点击事件穿透给外层的 TouchableOpacity
          >
            <Marker coordinate={coordinates} />
          </MapView>
        ) : (
          // 如果没有坐标，回退到灰色占位符
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapLabel}>暂无定位信息</Text>
            <Text style={styles.mapSubLabel}>{location}</Text>
          </View>
        )}

        {/* 遮罩层：增加点击感，模拟 iOS 地图卡片的质感 */}
        <View style={styles.overlay} />
      </TouchableOpacity>

      {/* 底部操作栏 */}
      <View style={styles.actionRow}>
        <TouchableOpacity onPress={handleOpenMap} style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>导航 / 路线</Text>
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
    backgroundColor: '#E8F5E9',
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

  // 地图容器样式
  mapContainer: {
    height: 150,
    borderRadius: 8,
    overflow: 'hidden', // 确保地图圆角
    marginBottom: 12,
    backgroundColor: '#f2f2f6',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject, // 填满容器
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent', // 可以设为 'rgba(0,0,0,0.02)' 增加质感
  },

  // 占位符样式
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapLabel: { color: '#8e8e93', fontWeight: '600', marginBottom: 4 },
  mapSubLabel: { color: '#8e8e93', fontSize: 12 },

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
