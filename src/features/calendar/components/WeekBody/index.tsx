import React from 'react'
import { View, StyleSheet, ScrollView, Text } from 'react-native'
import { WeekDateList } from '../../views/WeekView/components/WeekDateList'
import { AllDayList } from '../../views/WeekView/components/AllDayList'
import { BodyList } from '../../views/WeekView/components/BodyList'
import { useWeekViewContext } from '../../views/WeekView/WeekViewContext'
import { HOUR_HEIGHT, TIME_LABEL_WIDTH } from '../../../../theme/layout'

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
