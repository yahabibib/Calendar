import React, { useState, useRef, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
  LayoutChangeEvent,
} from 'react-native'
import {
  addMonths,
  format,
  startOfMonth,
  subMonths,
  isSameMonth,
  differenceInCalendarWeeks,
  endOfMonth,
} from 'date-fns'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// ⚠️ 引入抽离的样式
import { styles } from './styles'

// ⚠️ 引入原子组件 MonthGrid
import { MonthGrid, MONTH_TITLE_HEIGHT } from '../../components/MonthGrid'

const PAST_MONTHS = 24
const FUTURE_MONTHS = 24
const TOTAL_MONTHS = PAST_MONTHS + 1 + FUTURE_MONTHS

interface MonthViewProps {
  selectedDate: string
  onDateSelect: (date: string) => void
  // 点击左上角年份的回调
  onHeaderYearPress?: () => void
}

export const MonthView: React.FC<MonthViewProps> = ({
  selectedDate,
  onDateSelect,
  onHeaderYearPress,
}) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const listRef = useRef<FlatList>(null)

  const [containerWidth, setContainerWidth] = useState(windowWidth)

  // 布局计算逻辑
  const safeWidth = containerWidth > 0 ? containerWidth : windowWidth
  const cellWidth = safeWidth / 7
  const rowHeight = Math.max(85, windowHeight / 10)

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width } = event.nativeEvent.layout
      if (Math.abs(width - containerWidth) > 1) {
        setContainerWidth(width)
      }
    },
    [containerWidth],
  )

  const { monthList, layoutCache } = useMemo(() => {
    const today = new Date()
    const start = subMonths(startOfMonth(today), PAST_MONTHS)

    const list = []
    const layouts = []
    let currentOffset = 0

    for (let i = 0; i < TOTAL_MONTHS; i++) {
      const date = addMonths(start, i)
      list.push(date)

      const weeks =
        differenceInCalendarWeeks(endOfMonth(date), startOfMonth(date), { weekStartsOn: 1 }) + 1

      const height = weeks * rowHeight + MONTH_TITLE_HEIGHT

      layouts.push({
        length: height,
        offset: currentOffset,
        index: i,
      })

      currentOffset += height
    }

    return { monthList: list, layoutCache: layouts }
  }, [rowHeight])

  const [headerDate, setHeaderDate] = useState(new Date(selectedDate))

  const initialIndex = useMemo(() => {
    return monthList.findIndex(date => isSameMonth(date, new Date(selectedDate)))
  }, [monthList])

  // --- 滚动联动 ---
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      const firstItem = viewableItems[0]
      if (firstItem && firstItem.item) {
        setHeaderDate(firstItem.item)
      }
    }
  }, [])

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 20,
  }).current

  const scrollToIndex = (index: number) => {
    if (index >= 0 && index < monthList.length) {
      listRef.current?.scrollToIndex({ index, animated: true, viewOffset: 0 })
    }
  }

  const handlePrev = () => {
    const currentIndex = monthList.findIndex(d => isSameMonth(d, headerDate))
    scrollToIndex(currentIndex - 1)
  }

  const handleNext = () => {
    const currentIndex = monthList.findIndex(d => isSameMonth(d, headerDate))
    scrollToIndex(currentIndex + 1)
  }

  const renderItem = useCallback(
    ({ item }: { item: Date }) => {
      return (
        <View>
          {/* 使用重构后的 MonthGrid */}
          <MonthGrid
            currentDate={item}
            selectedDate={new Date(selectedDate)}
            onDateSelect={d => onDateSelect(format(d, 'yyyy-MM-dd'))}
            rowHeight={rowHeight}
            cellWidth={cellWidth}
          />
        </View>
      )
    },
    [selectedDate, onDateSelect, rowHeight, cellWidth],
  )

  const getItemLayout = useCallback(
    (data: any, index: number) => {
      return layoutCache[index]
    },
    [layoutCache],
  )

  return (
    <View style={styles.container} onLayout={onLayout}>
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.yearButton} onPress={onHeaderYearPress}>
            <Text style={styles.yearArrow}>◀</Text>
            <Text style={styles.yearText}>{format(headerDate, 'yyyy年')}</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: 15 }}>
            <TouchableOpacity onPress={handlePrev} hitSlop={15}>
              <Text style={styles.arrowIcon}>▲</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNext} hitSlop={15}>
              <Text style={styles.arrowIcon}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.monthTitle}>{format(headerDate, 'M月')}</Text>
        </View>

        <View style={styles.weekRow}>
          {['一', '二', '三', '四', '五', '六', '日'].map((day, index) => (
            <Text key={index} style={[styles.weekText, { width: '14.2857%' }]}>
              {day}
            </Text>
          ))}
        </View>
      </View>

      <Animated.FlatList
        ref={listRef}
        data={monthList}
        keyExtractor={item => item.toISOString()}
        renderItem={renderItem}
        initialScrollIndex={initialIndex !== -1 ? initialIndex : PAST_MONTHS}
        getItemLayout={getItemLayout}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        windowSize={5}
        maxToRenderPerBatch={3}
      />
    </View>
  )
}
