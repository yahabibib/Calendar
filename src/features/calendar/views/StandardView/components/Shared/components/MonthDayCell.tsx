import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { COLORS } from '@/theme'

interface MonthDayCellProps {
  dayNum: number
  isToday: boolean
  width: number
  height: number
  showBorderRight?: boolean
  onPress?: () => void
  dots?: string[]
}

export const MonthDayCell = React.memo<MonthDayCellProps>(
  ({ dayNum, isToday, width, height, showBorderRight = true, onPress, dots = [] }) => {
    const Container = onPress ? TouchableOpacity : View

    return (
      <Container
        style={[styles.cell, { width, height }, !showBorderRight && { borderRightWidth: 0 }]}
        onPress={onPress}
        activeOpacity={0.7}>
        <View style={[styles.dayCircle, isToday && styles.todayCircle]}>
          <Text style={[styles.dayText, isToday && styles.todayText]}>{dayNum}</Text>
        </View>

        {/* ✨✨✨ 渲染小圆点 ✨✨✨ */}
        <View style={styles.dotContainer}>
          {dots.slice(0, 3).map((color, index) => (
            <View key={index} style={[styles.dot, { backgroundColor: color }]} />
          ))}
          {/* 如果超过3个，可以用一个灰色小点表示更多，或者只显示3个 */}
          {dots.length > 3 && <View style={[styles.dot, { backgroundColor: '#ccc' }]} />}
        </View>
      </Container>
    )
  },
)

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
    borderRightColor: '#E5E5EA',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  todayCircle: {
    backgroundColor: '#F2F2F7',
  },
  dayText: {
    fontSize: 17,
    color: '#000',
    fontWeight: '400',
  },
  todayText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  dotContainer: {
    position: 'absolute',
    bottom: 6, // 距离底部的位置
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2, // 圆点间距
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
})
