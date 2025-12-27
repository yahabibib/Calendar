import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import {
  View,
  FlatList,
  useWindowDimensions,
  LayoutChangeEvent,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
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
import { MonthGrid } from '../MonthGrid'
import { useCalendarLayout } from '@/features/calendar/hooks/useCalendarLayout'
import { PAST_MONTHS_RANGE, TOTAL_MONTHS_COUNT, MONTH_TITLE_HEIGHT } from '../constants'

interface MonthBodyProps {
  selectedDate: string
  onDateSelect: (date: string, visualOffsetY: number) => void
  onPageChange: (currentDate: Date) => void
  rowHeight: number
}

export const MonthBody = React.memo<MonthBodyProps>(
  ({ selectedDate, onDateSelect, onPageChange, rowHeight }) => {
    const { SCREEN_WIDTH: windowWidth, insets } = useCalendarLayout()
    const listRef = useRef<FlatList>(null)

    // 记录当前用户正在查看的月份
    const currentVisibleMonthRef = useRef<Date | null>(null)
    // 标记是否正在被用户手指拖拽
    const isDraggingRef = useRef(false)
    // 记录当前的滚动偏移量，避免状态更新导致重渲染
    const scrollYRef = useRef(0)

    const [containerWidth, setContainerWidth] = useState(windowWidth)

    // 布局计算
    const safeWidth = containerWidth > 0 ? containerWidth : windowWidth
    const cellWidth = safeWidth / 7

    const onLayout = useCallback(
      (event: LayoutChangeEvent) => {
        const { width } = event.nativeEvent.layout
        // 只有宽度发生显著变化时才更新状态，避免无谓渲染
        if (Math.abs(width - containerWidth) > 1) {
          setContainerWidth(width)
        }
      },
      [containerWidth],
    )

    // 生成月份数据 & 布局缓存
    const { monthList, layoutCache } = useMemo(() => {
      const today = new Date()
      const start = subMonths(startOfMonth(today), PAST_MONTHS_RANGE)

      const list = []
      const layouts = []
      let currentOffset = 0

      for (let i = 0; i < TOTAL_MONTHS_COUNT; i++) {
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

    const initialIndex = useMemo(() => {
      const targetDate = new Date(selectedDate)
      const index = monthList.findIndex(date => isSameMonth(date, targetDate))
      return index !== -1 ? index : PAST_MONTHS_RANGE
    }, [monthList])

    // 滚动监听，更新 Ref
    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollYRef.current = event.nativeEvent.contentOffset.y
    }, [])

    const onViewableItemsChanged = useCallback(
      ({ viewableItems }: any) => {
        if (viewableItems && viewableItems.length > 0) {
          const firstItem = viewableItems[0]
          if (firstItem && firstItem.item) {
            onPageChange(firstItem.item)
          }
        }
      },
      [onPageChange],
    )

    const viewabilityConfig = useRef({
      itemVisiblePercentThreshold: 50,
    }).current

    // 记录拖拽状态
    const handleScrollBeginDrag = useCallback(() => {
      isDraggingRef.current = true
    }, [])

    // 滚动联动逻辑
    useEffect(() => {
      const targetDate = new Date(selectedDate)

      // 拖拽锁：用户手指在屏幕上时，禁止代码滚动
      if (isDraggingRef.current) return

      // 视口锁：如果目标月份已经在视口内，禁止回弹
      if (
        currentVisibleMonthRef.current &&
        isSameMonth(currentVisibleMonthRef.current, targetDate)
      ) {
        return
      }

      // 只有明确的外部跳转（点击Header箭头）才执行滚动
      const index = monthList.findIndex(d => isSameMonth(d, targetDate))
      if (index !== -1) {
        listRef.current?.scrollToIndex({ index, animated: true, viewOffset: 0 })
      }
    }, [selectedDate, monthList])

    const renderItem = useCallback(
      ({ item, index }: { item: Date; index: number }) => {
        return (
          <View>
            <MonthGrid
              currentDate={item}
              // selectedDate={new Date(selectedDate)}
              onDateSelect={d => {
                // 视觉偏移 = 该月份在列表中的绝对位置 - 当前列表滚动的距离
                const layoutOffset = layoutCache[index].offset
                const currentScroll = scrollYRef.current
                const visualOffset = layoutOffset - currentScroll
                onDateSelect(format(d, 'yyyy-MM-dd'), visualOffset)
              }}
              rowHeight={rowHeight}
              cellWidth={cellWidth}
            />
          </View>
        )
      },
      [onDateSelect, rowHeight, cellWidth, layoutCache],
    )

    // 读取布局缓存
    const getItemLayout = useCallback(
      (data: any, index: number) => {
        return layoutCache[index]
      },
      [layoutCache],
    )

    return (
      <View style={styles.container} onLayout={onLayout}>
        <FlatList
          ref={listRef}
          data={monthList}
          keyExtractor={item => item.toISOString()}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          initialScrollIndex={initialIndex}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          windowSize={10}
          maxToRenderPerBatch={5}
          removeClippedSubviews={true}
          onScroll={handleScroll}
          onScrollBeginDrag={handleScrollBeginDrag}
          scrollEventThrottle={16}
        />
      </View>
    )
  },
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
