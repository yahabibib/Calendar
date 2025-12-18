import React, { useMemo, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native'
import { addMonths, addYears, format, startOfYear, subYears } from 'date-fns'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { COLORS } from '../theme'
import { MiniMonthView } from './CustomCalendar/yearCalendar/MiniMonthView'

// 生成前后 N 年
const PAST_YEARS = 10
const TOTAL_YEARS = 20

interface YearCalendarWidgetProps {
  currentYear: Date // 当前选中的年份
  onMonthSelect: (date: Date) => void // 点击某个月的回调
}

export const YearCalendarWidget: React.FC<YearCalendarWidgetProps> = ({
  currentYear,
  onMonthSelect,
}) => {
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  // 计算每个月份容器的宽度 (屏幕宽度的 1/3)
  // 还要考虑容器的 padding
  const containerPadding = 10
  const availableWidth = width - containerPadding * 2
  const cellWidth = availableWidth / 3

  // 1. 生成年份数据列表
  const yearList = useMemo(() => {
    const start = subYears(startOfYear(new Date()), PAST_YEARS)
    return Array.from({ length: TOTAL_YEARS }).map((_, i) => {
      return addYears(start, i)
    })
  }, [])

  // 2. 初始定位到当前年
  const initialIndex = useMemo(() => {
    return yearList.findIndex(d => format(d, 'yyyy') === format(currentYear, 'yyyy'))
  }, [yearList, currentYear])

  // 3. 渲染每一“年” (包含12个月的网格)
  const renderYearItem = ({ item: yearDate }: { item: Date }) => {
    // 生成这一年的 12 个月
    const months = Array.from({ length: 12 }).map((_, i) => addMonths(yearDate, i))

    return (
      <View style={styles.yearPage}>
        {/* 年份大标题 */}
        <Text style={styles.yearTitle}>{format(yearDate, 'yyyy年')}</Text>

        {/* 12个月份网格 */}
        <View style={styles.monthsGrid}>
          {months.map(monthDate => (
            <MiniMonthView
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
      {/* 这里其实不需要额外的 Header，因为每一页都有年份大标题 */}
      {/* 如果需要全局搜索栏等，可以加在这里 */}

      <FlatList
        data={yearList}
        keyExtractor={item => item.toISOString()}
        renderItem={renderYearItem}
        initialScrollIndex={initialIndex !== -1 ? initialIndex : PAST_YEARS}
        getItemLayout={(data, index) => ({
          // 预估高度：年份标题高度 + (行高 * 4行) + 间距
          // 这里是一个大概值，为了初始定位准确，建议固定高度或者 accept 偏差
          length: 600, // 假设值，实际需要根据内容撑开
          offset: 600 * index,
          index,
        })}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  yearPage: {
    paddingHorizontal: 10,
    marginBottom: 30,
    // 强制高度占满一屏或更多，保证视觉上的分页感
    minHeight: '100%',
  },
  yearTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
    marginLeft: 5,
    marginTop: 10,
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
})
