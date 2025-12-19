import React, { useMemo } from 'react'
import { View, Text, FlatList, useWindowDimensions } from 'react-native'
import { addMonths, addYears, format, startOfYear, subYears } from 'date-fns'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { styles } from './styles'
import { MiniMonthGrid } from '../../components/MiniMonthGrid'

const PAST_YEARS = 10
const TOTAL_YEARS = 20

interface YearViewProps {
  currentYear: Date
  onMonthSelect: (date: Date) => void
}

export const YearView: React.FC<YearViewProps> = ({ currentYear, onMonthSelect }) => {
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  // --- 📏 布局常量计算 (必须与 MiniMonthGrid 保持一致) ---
  const containerPadding = 10
  const availableWidth = width - containerPadding * 2
  const cellWidth = availableWidth / 3

  const MINI_MONTH_PADDING_H = 5
  const DAY_SIZE = (cellWidth - MINI_MONTH_PADDING_H * 2) / 7

  // 这些数值必须与 MiniMonthGrid/styles.ts 或其渲染逻辑中的高度一致
  const MONTH_TITLE_HEIGHT = 24
  const MONTH_TITLE_MARGIN = 5
  const MONTH_MARGIN_BOTTOM = 20

  // 强制计算一个月的高度：(标题 + 边距 + 6行格子 + 底部边距)
  // 即使有的月份只有5行，我们在 UI 上也会强制撑开到6行，以保证平滑滚动
  const ONE_MONTH_HEIGHT =
    MONTH_TITLE_HEIGHT + MONTH_TITLE_MARGIN + DAY_SIZE * 6 + MONTH_MARGIN_BOTTOM

  // 一年的总高度：(年份标题 + 边距) + (4行月份 * 月高度) + 底部留白
  // YearTitle(34) + marginBottom(15) + marginTop(10) ≈ 60 (根据 styles.ts 微调)
  const YEAR_HEADER_HEIGHT = 60
  const YEAR_ITEM_HEIGHT = YEAR_HEADER_HEIGHT + ONE_MONTH_HEIGHT * 4 + 30

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
              onMonthPress={onMonthSelect}
              // ✨ 传入我们计算好的固定高度，确保子组件严格遵守
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
        // 📍 初始定位
        initialScrollIndex={initialIndex !== -1 ? initialIndex : PAST_YEARS}
        // 📏 精确布局：告诉 FlatList 每一行到底多高，消除偏移误差
        getItemLayout={(data, index) => ({
          length: YEAR_ITEM_HEIGHT,
          offset: YEAR_ITEM_HEIGHT * index,
          index,
        })}
        // 🚀 性能优化关键点
        initialNumToRender={3} // ✨ 改为3：确保 [去年, 今年, 明年] 瞬间可见，消除延迟
        maxToRenderPerBatch={2} // 每次滚动多渲染 2 年
        windowSize={5} // 增加渲染窗口，减少快速滑动时的白屏
        removeClippedSubviews={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      />
    </View>
  )
}
