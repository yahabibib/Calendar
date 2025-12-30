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
import { CalendarEvent } from '@/types/event'

interface MonthBodyProps {
  selectedDate: string
  onDateSelect: (date: string, visualOffsetY: number) => void
  onPageChange: (currentDate: Date) => void
  rowHeight: number
  events: CalendarEvent[]
}

export const MonthBody = React.memo<MonthBodyProps>(
  ({ selectedDate, onDateSelect, onPageChange, rowHeight, events }) => {
    const { SCREEN_WIDTH: windowWidth, insets } = useCalendarLayout()
    const listRef = useRef<FlatList>(null)

    const currentVisibleMonthRef = useRef<Date | null>(null)
    const isDraggingRef = useRef(false)
    const scrollYRef = useRef(0)

    const [containerWidth, setContainerWidth] = useState(windowWidth)

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

    const handleScrollBeginDrag = useCallback(() => {
      isDraggingRef.current = true
    }, [])

    useEffect(() => {
      const targetDate = new Date(selectedDate)
      if (isDraggingRef.current) return
      if (
        currentVisibleMonthRef.current &&
        isSameMonth(currentVisibleMonthRef.current, targetDate)
      ) {
        return
      }
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
              onDateSelect={d => {
                const layoutOffset = layoutCache[index].offset
                const currentScroll = scrollYRef.current
                const visualOffset = layoutOffset - currentScroll
                onDateSelect(format(d, 'yyyy-MM-dd'), visualOffset)
              }}
              rowHeight={rowHeight}
              cellWidth={cellWidth}
              events={events}
            />
          </View>
        )
      },
      [onDateSelect, rowHeight, cellWidth, layoutCache, events],
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
