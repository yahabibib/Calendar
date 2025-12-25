import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import { View, FlatList, useWindowDimensions, LayoutChangeEvent, StyleSheet } from 'react-native'
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
  onDateSelect: (date: string) => void
  onPageChange: (currentDate: Date) => void // ✨ 关键：通知父组件更新公共 Header
  rowHeight: number // ✨ 关键：接收统一的行高
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

      // 计算该月有几周
      const weeks =
        differenceInCalendarWeeks(endOfMonth(date), startOfMonth(date), { weekStartsOn: 1 }) + 1

      // 总高度 = (周数 * 行高) + 月份标题高度
      const height = weeks * rowHeight + MONTH_TITLE_HEIGHT

      layouts.push({
        length: height,
        offset: currentOffset,
        index: i,
      })

      currentOffset += height
    }

    return { monthList: list, layoutCache: layouts }
  }, [rowHeight]) // 依赖 rowHeight，如果行高变了重新计算

  // 初始定位索引
  const initialIndex = useMemo(() => {
    // 默认定位到 selectedDate 所在的月份，如果没有则定位到中间(今天)
    const targetDate = new Date(selectedDate)
    const index = monthList.findIndex(date => isSameMonth(date, targetDate))
    return index !== -1 ? index : PAST_MONTHS
  }, [monthList]) // 只在挂载时计算一次即可，后续靠 scrollToIndex

  // ✨ 监听滚动，更新父组件 Header
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: any) => {
      if (viewableItems && viewableItems.length > 0) {
        const firstItem = viewableItems[0]
        if (firstItem && firstItem.item) {
          // 通知外部：我现在翻到了这个月
          onPageChange(firstItem.item)
        }
      }
    },
    [onPageChange],
  )

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50, // 也就是显示了一半以上才算翻页
  }).current

  // 外部 selectedDate 变化时，如果跨月了，自动滚动
  useEffect(() => {
    const targetDate = new Date(selectedDate)
    // 这里需要防抖或者判断是否正在手动滚动中，简单起见先直接跳
    const index = monthList.findIndex(d => isSameMonth(d, targetDate))
    if (index !== -1) {
      // 检查当前可视区域是否已经是这个月？如果是就不动。
      // 这里简单处理：直接调用 scrollToIndex，FlatList 内部会优化
      listRef.current?.scrollToIndex({ index, animated: true, viewOffset: 0 })
    }
  }, [selectedDate, monthList])

  const renderItem = useCallback(
    ({ item }: { item: Date }) => {
      return (
        <View>
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
      <FlatList
        ref={listRef}
        data={monthList}
        keyExtractor={item => item.toISOString()}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        // 初始定位
        initialScrollIndex={initialIndex}
        // 滚动回调
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        // 性能配置
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        windowSize={5}
        maxToRenderPerBatch={3}
        removeClippedSubviews={true}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: 'white', // 可以透明，让父级控制
  },
})
