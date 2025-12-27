import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { COLORS } from '@/theme'

interface MonthDayCellProps {
  dayNum: number
  isToday: boolean
  // 布局属性
  width: number
  height: number
  // 样式控制
  showBorderRight?: boolean
  // 交互 (TransitionView 中可能不传)
  onPress?: () => void
}

export const MonthDayCell = React.memo<MonthDayCellProps>(
  ({ dayNum, isToday, width, height, showBorderRight = true, onPress }) => {
    // 根据是否传入 onPress 决定是 Touchable 还是 View
    const Container = onPress ? TouchableOpacity : View

    return (
      <Container
        style={[styles.cell, { width, height }, !showBorderRight && { borderRightWidth: 0 }]}
        onPress={onPress}
        activeOpacity={0.7}>
        <View style={[styles.dayCircle, isToday && styles.todayCircle]}>
          <Text style={[styles.dayText, isToday && styles.todayText]}>{dayNum}</Text>
        </View>
        {/* 预留 Dot 位置 */}
        <View style={styles.dotContainer} />
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
    // borderRightWidth: 0.5, // 默认有边框
    borderRightColor: '#E5E5EA',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
    bottom: 6,
  },
})
