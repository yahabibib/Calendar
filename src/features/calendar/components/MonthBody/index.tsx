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
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MonthGrid, MONTH_TITLE_HEIGHT } from '../../components/MonthGrid'

// 预加载范围
const PAST_MONTHS = 24
const FUTURE_MONTHS = 24
const TOTAL_MONTHS = PAST_MONTHS + 1 + FUTURE_MONTHS

interface MonthBodyProps {
  selectedDate: string
  // ✨ 修改接口：增加 visualOffsetY 参数
  onDateSelect: (date: string, visualOffsetY: number) => void
  onPageChange: (currentDate: Date) => void
  rowHeight: number
}

export const MonthBody: React.FC<MonthBodyProps> = ({
  selectedDate,
  onDateSelect,
  onPageChange,
  rowHeight,
}) => {
  const { width: windowWidth } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const listRef = useRef<FlatList>(null)

  // ✨ 新增：记录当前用户正在查看的月份
  // 用于判断 selectedDate 的变化是“我们自己滑到的”还是“外部改的”
  const currentVisibleMonthRef = useRef<Date | null>(null)

  // ✨ 新增：标记是否正在被用户手指拖拽
  const isDraggingRef = useRef(false)

  // ✨ 新增：使用 Ref 记录当前的滚动偏移量，避免状态更新导致重渲染
  const scrollYRef = useRef(0)

  const [containerWidth, setContainerWidth] = useState(windowWidth)

  // 布局计算
  const safeWidth = containerWidth > 0 ? containerWidth : windowWidth
  const cellWidth = safeWidth / 7

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width } = event.nativeEvent.layout
      if (Math.abs(width - containerWidth) > 1) {
        setContainerWidth(width)
      }
    },
    [containerWidth],
  )

  // 生成月份数据 & 布局缓存
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

  const initialIndex = useMemo(() => {
    const targetDate = new Date(selectedDate)
    const index = monthList.findIndex(date => isSameMonth(date, targetDate))
    return index !== -1 ? index : PAST_MONTHS
  }, [monthList])

  // ✨ 新增：滚动监听，更新 Ref
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

  // 外部 selectedDate 变化联动 (保持不变)
  useEffect(() => {
    // const targetDate = new Date(selectedDate)
    // const index = monthList.findIndex(d => isSameMonth(d, targetDate))
    // if (index !== -1) {
    //   listRef.current?.scrollToIndex({ index, animated: true, viewOffset: 0 })
    // }
    const targetDate = new Date(selectedDate)

    // 1. 如果用户正在拖拽，绝对不要打断他，直接返回
    if (isDraggingRef.current) return

    // 2. 如果目标月份已经是当前可见的月份（说明是滑动导致的更新），也不要滚动
    if (currentVisibleMonthRef.current && isSameMonth(currentVisibleMonthRef.current, targetDate)) {
      return
    }

    // 3. 只有当目标月份与当前可见月份不同（比如点击了 Header 的箭头或 MiniMap）时，才滚动
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
            selectedDate={new Date(selectedDate)}
            onDateSelect={d => {
              // ✨ 核心逻辑：计算点击时的视觉偏移
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
    [selectedDate, onDateSelect, rowHeight, cellWidth, layoutCache],
  )

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
        windowSize={5}
        maxToRenderPerBatch={3}
        removeClippedSubviews={true}
        // ✨ 绑定滚动事件
        onScroll={handleScroll}
        // ✨ 绑定新的拖拽事件
        onScrollBeginDrag={handleScrollBeginDrag}
        scrollEventThrottle={16}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
