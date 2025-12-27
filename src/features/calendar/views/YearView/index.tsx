import React, { useMemo } from 'react'
import { View, Text, FlatList } from 'react-native'
import { addMonths, addYears, format, startOfYear, subYears } from 'date-fns'
import { styles } from './styles'
import { MiniMonthGrid, LayoutRect } from './components/MiniMonthGrid'
import { useYearLayout } from './useYearLayout'
import { PAST_YEARS, TOTAL_YEARS } from './constants'

interface YearViewProps {
  currentYear: Date
  onMonthSelect: (date: Date, layout: LayoutRect) => void
}

export const YearView: React.FC<YearViewProps> = ({ currentYear, onMonthSelect }) => {
  const { cellWidth, daySize, yearItemHeight, gridHeight, insets } = useYearLayout()

  // 年份列表
  const yearList = useMemo(() => {
    const start = subYears(startOfYear(new Date()), PAST_YEARS)
    return Array.from({ length: TOTAL_YEARS }).map((_, i) => {
      return addYears(start, i)
    })
  }, [])

  // 初始化今年所在索引
  const initialIndex = useMemo(() => {
    return yearList.findIndex(d => format(d, 'yyyy') === format(currentYear, 'yyyy'))
  }, [yearList, currentYear])

  // 单位年
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
              gridHeight={gridHeight}
              daySize={daySize}
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
          length: yearItemHeight,
          offset: yearItemHeight * index,
          index,
        })}
        initialNumToRender={5}
        maxToRenderPerBatch={3}
        windowSize={5}
        removeClippedSubviews={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      />
    </View>
  )
}
