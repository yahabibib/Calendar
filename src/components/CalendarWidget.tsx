import React, { useState, useRef, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
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
} from 'date-fns' // ❌ 移除了 getDay
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { MonthView, MONTH_TITLE_HEIGHT } from './CustomCalendar/MonthView'
import { COLORS } from '../theme'

const PAST_MONTHS = 24
const FUTURE_MONTHS = 24
const TOTAL_MONTHS = PAST_MONTHS + 1 + FUTURE_MONTHS

interface CalendarWidgetProps {
  selectedDate: string
  onDateSelect: (date: string) => void
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({ selectedDate, onDateSelect }) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const listRef = useRef<FlatList>(null)

  const [containerWidth, setContainerWidth] = useState(windowWidth)

  const safeWidth = containerWidth > 0 ? containerWidth : windowWidth
  const cellWidth = Math.floor(safeWidth / 7) 
  const remainingWidth = safeWidth - cellWidth * 7
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
  // ❌ 移除了 firstDayIndex 状态

  const initialIndex = useMemo(() => {
    return monthList.findIndex(date => isSameMonth(date, new Date(selectedDate)))
  }, [monthList])

  // --- 滚动联动 ---
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      const firstItem = viewableItems[0]
      if (firstItem && firstItem.item) {
        // ✨ 只需要更新日期，不需要计算偏移量了
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
          <MonthView
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
      {/* 沉浸式 Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.yearButton}>
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

        {/* 标题 */}
        {/* ✨ 恢复为左对齐，去掉了 paddingLeft 计算 */}
        <View style={styles.titleRow}>
          <Text style={styles.monthTitle}>{format(headerDate, 'M月')}</Text>
        </View>

        <View style={styles.weekRow}>
          {['一', '二', '三', '四', '五', '六', '日'].map((day, index) => (
            <Text key={index} style={[styles.weekText, { width: cellWidth }]}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  headerContainer: {
    backgroundColor: 'white',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
    paddingBottom: 10,
  },
  navRow: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  yearButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yearArrow: {
    fontSize: 18,
    color: COLORS.primary,
    marginRight: 4,
    fontWeight: '600',
  },
  yearText: {
    fontSize: 17,
    color: COLORS.primary,
    fontWeight: '600',
  },
  arrowIcon: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  titleRow: {
    marginBottom: 10,
    // ✨ 加回固定的 Padding，让标题不要紧贴左侧屏幕边缘，保持呼吸感
    paddingHorizontal: 20,
  },
  monthTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5,
    // marginLeft: 5, // 之前微调的 margin 也可以去掉了，由 paddingHorizontal 控制
  },
  weekRow: {
    flexDirection: 'row',
    marginTop: 5,
  },
  weekText: {
    textAlign: 'center',
    color: '#3C3C4399',
    fontSize: 13,
    fontWeight: '600',
  },
})
