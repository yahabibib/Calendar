import React, { useRef } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { format } from 'date-fns'
import { useCalendarGrid } from '../../../../hooks/useCalendarGrid'
import { styles } from './styles'
import { COLORS } from '../../../../../../theme'
import {
  MINI_MONTH_PADDING_H,
  MINI_MONTH_TITLE_HEIGHT,
  MINI_MONTH_MARGIN_BOTTOM,
} from '../../constants'

export interface LayoutRect {
  x: number
  y: number
  width: number
  height: number
}

interface MiniMonthGridProps {
  date: Date
  onMonthPress: (date: Date, layout: LayoutRect) => void
  cellWidth: number
  daySize: number
  gridHeight: number
}

export const MiniMonthGridUpdated = React.memo<MiniMonthGridProps>(
  ({ date, onMonthPress, cellWidth, daySize, gridHeight }) => {
    const { gridData } = useCalendarGrid(date)
    const containerRef = useRef<TouchableOpacity>(null)

    const titleColor = COLORS.primary

    const handlePress = () => {
      containerRef.current?.measureInWindow((x, y, width, height) => {
        onMonthPress(date, { x, y, width, height })
      })
    }

    return (
      <TouchableOpacity
        ref={containerRef}
        style={[
          styles.container,
          {
            width: cellWidth,
            marginBottom: MINI_MONTH_MARGIN_BOTTOM,
            paddingHorizontal: MINI_MONTH_PADDING_H,
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.6}>
        <Text style={[styles.monthTitle, { color: titleColor, height: MINI_MONTH_TITLE_HEIGHT }]}>
          {format(date, 'M月')}
        </Text>

        {/* 强制高度 */}
        <View style={[styles.grid, { height: gridHeight }]}>
          {gridData.map((dayItem, index) => {
            return (
              <View
                key={index}
                style={[
                  styles.dayCell,
                  { width: daySize, height: daySize },
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
