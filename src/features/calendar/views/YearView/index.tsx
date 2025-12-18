import React, { useMemo } from 'react'
import { View, Text, FlatList, useWindowDimensions } from 'react-native'
import { addMonths, addYears, format, startOfYear, subYears } from 'date-fns'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// ⚠️ 引入抽离的样式
import { styles } from './styles'
// ⚠️ 引入原子组件 MiniMonthGrid
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

  // 计算每个月份容器的宽度 (屏幕宽度的 1/3)
  const containerPadding = 10
  const availableWidth = width - containerPadding * 2
  const cellWidth = availableWidth / 3

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
            // 使用重构后的 MiniMonthGrid
            <MiniMonthGrid
              key={monthDate.toISOString()}
              date={monthDate}
              cellWidth={cellWidth}
              onMonthPress={onMonthSelect}
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
          length: 600, // 估算高度
          offset: 600 * index,
          index,
        })}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      />
    </View>
  )
}
