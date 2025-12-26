// src/features/calendar/views/YearView/index.tsx

import React, { useMemo } from 'react'
import { View, Text, FlatList, useWindowDimensions } from 'react-native'
import { addMonths, addYears, format, startOfYear, subYears } from 'date-fns'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { styles } from './styles'
// 引入类型
import { MiniMonthGrid, LayoutRect } from '../../components/MiniMonthGrid'

const PAST_YEARS = 10
const TOTAL_YEARS = 20

interface YearViewProps {
  currentYear: Date
  // ✨ 修改回调定义
  onMonthSelect: (date: Date, layout: LayoutRect) => void
}

export const YearView: React.FC<YearViewProps> = ({ currentYear, onMonthSelect }) => {
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  // ... (布局常量保持不变) ...
  const containerPadding = 10
  const availableWidth = width - containerPadding * 2
  const cellWidth = availableWidth / 3
  const MINI_MONTH_PADDING_H = 5
  const DAY_SIZE = (cellWidth - MINI_MONTH_PADDING_H * 2) / 7
  const MONTH_TITLE_HEIGHT = 24
  const MONTH_TITLE_MARGIN = 5
  const MONTH_MARGIN_BOTTOM = 20
  const ONE_MONTH_HEIGHT =
    MONTH_TITLE_HEIGHT + MONTH_TITLE_MARGIN + DAY_SIZE * 6 + MONTH_MARGIN_BOTTOM
  const YEAR_HEADER_HEIGHT = 60
  const YEAR_ITEM_HEIGHT = YEAR_HEADER_HEIGHT + ONE_MONTH_HEIGHT * 4 + 30

  // ... (useMemo yearList 和 initialIndex 保持不变) ...
  const yearList = useMemo(() => {
    const start = subYears(startOfYear(new Date()), PAST_YEARS)
    return Array.from({ length: TOTAL_YEARS }).map((_, i) => {
      return addYears(start, i)
    })
  }, [])

  const initialIndex = useMemo(() => {
    return yearList.findIndex(d => format(d, 'yyyy') === format(currentYear, 'yyyy'))
  }, [yearList, currentYear])

  const renderYearItem = ({ item: yearDate }: { item: Date }) => {
    const months = Array.from({ length: 12 }).map((_, i) => addMonths(yearDate, i))

    return (
      <View style={styles.yearPage}>
        <Text style={styles.yearTitle}>{format(yearDate, 'yyyy年')}</Text>

        <View style={styles.monthsGrid}>
          {months.map(monthDate => (
            <MiniMonthGrid
              key={monthDate.toISOString()}
              date={monthDate}
              cellWidth={cellWidth}
              onMonthPress={onMonthSelect} // ✨ 直接透传，类型已匹配
              gridHeight={DAY_SIZE * 6}
            />
          ))}
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={yearList}
        keyExtractor={item => item.toISOString()}
        renderItem={renderYearItem}
        initialScrollIndex={initialIndex !== -1 ? initialIndex : PAST_YEARS}
        getItemLayout={(data, index) => ({
          length: YEAR_ITEM_HEIGHT,
          offset: YEAR_ITEM_HEIGHT * index,
          index,
        })}
        initialNumToRender={3}
        maxToRenderPerBatch={2}
        windowSize={5}
        removeClippedSubviews={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      />
    </View>
  )
}
