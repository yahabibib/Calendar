import React, { useRef } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { format } from 'date-fns'
import { useCalendarGrid } from '../../../../hooks/useCalendarGrid'
import { styles } from './styles'
import { COLORS } from '../../../../../../theme'

// 定义坐标类型，供外部使用
export interface LayoutRect {
  x: number
  y: number
  width: number
  height: number
}

interface MiniMonthGridProps {
  date: Date
  // ✨ 回调增加 layout 参数
  onMonthPress: (date: Date, layout: LayoutRect) => void
  cellWidth: number
  gridHeight?: number // 接收固定高度，防止布局跳动
}

export const MiniMonthGridUpdated = React.memo<MiniMonthGridProps>(
  ({ date, onMonthPress, cellWidth, gridHeight }) => {
    const { gridData } = useCalendarGrid(date)

    // 引入 Ref 用于测量
    const containerRef = useRef<TouchableOpacity>(null)

    const PADDING_H = 5
    const DAY_SIZE = (cellWidth - PADDING_H * 2) / 7
    const MONTH_TITLE_HEIGHT = 24
    const MARGIN_BOTTOM = 20

    // 视觉优化：标题颜色改为主题色
    const titleColor = COLORS.primary

    const handlePress = () => {
      // 测量屏幕绝对坐标
      containerRef.current?.measureInWindow((x, y, width, height) => {
        onMonthPress(date, { x, y, width, height })
      })
    }

    return (
      <TouchableOpacity
        ref={containerRef} // 绑定 Ref
        style={[
          styles.container,
          { width: cellWidth, marginBottom: MARGIN_BOTTOM, paddingHorizontal: PADDING_H },
        ]}
        onPress={handlePress}
        activeOpacity={0.6}>
        <Text style={[styles.monthTitle, { color: titleColor, height: MONTH_TITLE_HEIGHT }]}>
          {format(date, 'M月')}
        </Text>

        {/* 强制高度, 确保布局在 FlatList 中稳定 */}
        <View style={[styles.grid, { height: gridHeight || DAY_SIZE * 6 }]}>
          {gridData.map((dayItem, index) => {
            // 渲染逻辑：即使是非本月日期，也要渲染占位 View，保证 Flex 布局对齐
            return (
              <View
                key={index}
                style={[
                  styles.dayCell,
                  { width: DAY_SIZE, height: DAY_SIZE },
                  // 只有本月且是今天才应用样式
                  dayItem.isCurrentMonth && dayItem.isToday && styles.todayCell,
                ]}>
                {dayItem.isCurrentMonth && (
                  <Text style={[styles.dayText, dayItem.isToday && styles.todayText]}>
                    {dayItem.dayNum}
                  </Text>
                )}
              </View>
            )
          })}
        </View>
      </TouchableOpacity>
    )
  },
)

export { MiniMonthGridUpdated as MiniMonthGrid }
