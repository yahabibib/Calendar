import React, { memo, useMemo } from 'react'
import { View, FlatList, StyleSheet } from 'react-native'
import { isSameDay, isValid } from 'date-fns'
import { useWeekViewContext } from '../WeekViewContext'
import { CurrentTimeIndicator } from '../../../components/CurrentTimeIndicator'
import { HOUR_HEIGHT } from '../../../../../theme/layout'
// ✨ 引入新组件
import { EventColumn } from './EventColumn'

const DayBodyItem = memo(({ date, width, events, onEventPress }: any) => {
  const isToday = useMemo(() => isValid(date) && isSameDay(date, new Date()), [date])
  // 过滤出非全天事件
  const regularEvents = useMemo(() => events.filter((e: any) => !e.isAllDay), [events])

  return (
    <View
      style={{
        width,
        height: HOUR_HEIGHT * 24,
        borderRightWidth: 1,
        borderRightColor: '#f5f5f5',
        position: 'relative',
        // 确保子元素绝对定位相对于此容器
        overflow: 'hidden',
      }}>
      {/* 1. 洋葱圈底层：背景网格线 (由父级 FlatList 背景统一处理，或者在这里不画线只画列边框) */}

      {/* 2. 洋葱圈中间层：事件列 */}
      {/* ✨ 这里不再直接 map ScheduleEvent，而是交给 EventColumn 处理重叠布局 */}
      <EventColumn events={regularEvents} width={width} onEventPress={onEventPress} />

      {/* 3. 特殊元素：当前时间线 (层级最高) */}
      {isToday && <CurrentTimeIndicator />}

      {/* 4. 洋葱圈顶层：交互层 (DragCreateWrapper) - 下一步实现 */}
    </View>
  )
})

export const BodyList = () => {
  const {
    dayList,
    dayColumnWidth,
    events,
    bodyListRef,
    onBodyScroll,
    onBodyBeginDrag,
    onScrollEnd,
    onViewableItemsChanged,
    onEventPress,
    isWideScreen,
    initialIndex,
  } = useWeekViewContext()

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={bodyListRef}
        data={dayList}
        keyExtractor={item => item.toISOString()}
        renderItem={({ item }) => (
          <DayBodyItem
            date={item}
            width={dayColumnWidth}
            events={events.filter(
              (e: any) => isValid(new Date(e.startDate)) && isSameDay(new Date(e.startDate), item),
            )}
            onEventPress={onEventPress}
          />
        )}
        horizontal
        snapToInterval={isWideScreen ? undefined : dayColumnWidth}
        decelerationRate="fast"
        getItemLayout={(data, index) => ({
          length: dayColumnWidth,
          offset: dayColumnWidth * index,
          index,
        })}
        onScroll={onBodyScroll}
        onScrollBeginDrag={onBodyBeginDrag}
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={onScrollEnd}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        removeClippedSubviews={true}
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        onScrollToIndexFailed={info => {
          const wait = new Promise(resolve => setTimeout(resolve, 500))
          wait.then(() => {
            bodyListRef.current?.scrollToIndex({ index: info.index, animated: false })
          })
        }}
      />
    </View>
  )
}
