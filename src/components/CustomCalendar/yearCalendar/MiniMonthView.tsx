import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { format, isSameDay } from 'date-fns'
import { useCalendarGrid } from '../useCalendarGrid'
import { COLORS } from '../../../theme'

interface MiniMonthViewProps {
  date: Date // 这个月的任意一天
  onMonthPress: (date: Date) => void
  cellWidth: number // 动态计算的宽度
}

export const MiniMonthView: React.FC<MiniMonthViewProps> = ({ date, onMonthPress, cellWidth }) => {
  // 复用之前的逻辑获取网格数据
  const { gridData } = useCalendarGrid(date)

  // 迷你格子的宽度 (一个月占 1/3 屏宽，内部再分 7 列)
  // 稍微减去一点 padding 保证不拥挤
  const daySize = (cellWidth - 10) / 7

  const monthTitle = format(date, 'M月')

  // 判断月份标题颜色 (参照截图：红色)
  // 这里的 COLORS.primary 应该是红色，或者我们可以硬编码一个红色 '#ff3b30' 来对标原生
  const titleColor = '#ff3b30' // iOS Calendar Red

  return (
    <TouchableOpacity
      style={[styles.container, { width: cellWidth }]}
      onPress={() => onMonthPress(date)}
      activeOpacity={0.6}>
      {/* 月份标题 */}
      <Text style={[styles.monthTitle, { color: titleColor }]}>{monthTitle}</Text>

      {/* 迷你网格 */}
      <View style={styles.grid}>
        {gridData.map((dayItem, index) => {
          // 只显示本月日期，非本月留空
          if (!dayItem.isCurrentMonth) {
            return <View key={index} style={{ width: daySize, height: daySize }} />
          }

          const isToday = dayItem.isToday

          return (
            <View
              key={index}
              style={[
                styles.dayCell,
                { width: daySize, height: daySize },
                isToday && styles.todayCell, // 今天显示圆形背景
              ]}>
              <Text style={[styles.dayText, isToday && styles.todayText]}>{dayItem.dayNum}</Text>
            </View>
          )
        })}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 5,
    marginBottom: 20, // 月份之间的垂直间距
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
    marginLeft: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCell: {
    backgroundColor: '#ff3b30',
    borderRadius: 999,
  },
  dayText: {
    fontSize: 10, // 迷你字体
    color: '#333',
    fontWeight: '500',
  },
  todayText: {
    color: 'white',
    fontWeight: 'bold',
  },
})
