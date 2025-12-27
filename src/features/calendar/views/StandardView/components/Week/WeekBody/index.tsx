import React from 'react'
import { View, StyleSheet, ScrollView, Text } from 'react-native'
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated'
import { WeekDateList } from '../WeekDateList'
import { AllDayList } from '../AllDayList'
import { BodyList } from '../BodyList'
import { useWeekViewContext } from '../WeekViewContext'
import { HOUR_HEIGHT, TIME_LABEL_WIDTH } from '../../../../../../../theme/layout'

// ✨ Part 1: 仅日期行 (放在折叠容器内)
export const WeekDateHeader = () => {
  return <WeekDateList />
}

// ✨ Part 2: 仅全天行 (放在折叠容器外，避免被切掉)
export const WeekAllDayRow = () => {
  return (
    <View style={styles.allDayContainer}>
      <View style={styles.allDayLabel}>
        <Text style={styles.labelText}>全天</Text>
      </View>
      <AllDayList />
    </View>
  )
}

interface AnimatedAllDayProps {
  expandProgress: Animated.SharedValue<number>
}

export const AnimatedWeekAllDayRow: React.FC<AnimatedAllDayProps> = ({ expandProgress }) => {
  const { derivedHeaderHeight } = useWeekViewContext()

  // 动画样式：
  // 当 progress 从 0.5 (开始进入Week) 到 0 (完全Week) 时，高度展开
  // 反之，从 0 到 0.5 时，高度收缩
  const animatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      expandProgress.value,
      [0.3, 0], // 在动画的最后阶段展开，避免太早出现遮挡视线
      [0, derivedHeaderHeight],
      Extrapolation.CLAMP,
    )

    return {
      height,
      opacity: interpolate(expandProgress.value, [0.1, 0], [0, 1]), // 快结束时才显示
      overflow: 'hidden',
    }
  })

  return (
    <Animated.View style={[animatedStyle, { width: '100%', zIndex: 9 }]}>
      <View style={styles.allDayContainer}>
        <View style={styles.allDayLabel}>
          <Text style={styles.labelText}>全天</Text>
        </View>
        <AllDayList />
      </View>
    </Animated.View>
  )
}

// ✨ Part 3: 时间轴网格
export const WeekGridPart = () => {
  const hours = Array.from({ length: 24 }).map((_, i) => i)
  const { verticalScrollRef, onVerticalLayout } = useWeekViewContext()

  return (
    <ScrollView
      ref={verticalScrollRef}
      style={{ flex: 1, backgroundColor: 'white' }}
      bounces={false}
      onLayout={onVerticalLayout}
      showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', height: HOUR_HEIGHT * 24, width: '100%' }}>
        <View style={styles.axisColumn}>
          {hours.map(h => (
            <View key={h} style={styles.axisLabel}>
              <Text style={styles.axisText}>{h === 0 ? '' : `${h}:00`}</Text>
            </View>
          ))}
        </View>
        <View style={{ flex: 1 }}>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {hours.map(h => (
              <View key={`line-${h}`} style={styles.gridLine} />
            ))}
          </View>
          <BodyList />
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  allDayContainer: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    width: '100%',
    height: '100%',
    minHeight: 30, // 给全天事件留出空间
    zIndex: 10,
  },
  allDayLabel: {
    width: TIME_LABEL_WIDTH,
    backgroundColor: 'white',
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelText: { fontSize: 10, color: '#999', fontWeight: '500' },
  axisColumn: {
    width: TIME_LABEL_WIDTH,
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
    backgroundColor: 'white',
  },
  axisLabel: { height: HOUR_HEIGHT, alignItems: 'center' },
  axisText: { fontSize: 10, color: '#999', transform: [{ translateY: -6 }] },
  gridLine: { height: HOUR_HEIGHT, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
})
