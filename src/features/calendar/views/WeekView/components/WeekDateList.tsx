// src/features/calendar/views/WeekView/components/WeekDateList.tsx
import React, { memo } from 'react'
import { View, Text, FlatList } from 'react-native'
import { format, isSameDay } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useWeekViewContext } from '../WeekViewContext'

const WeekDateItem = memo(({ date, width, isInViewWindow, isToday }: any) => {
  return (
    <View style={{ width, justifyContent: 'center', alignItems: 'center', paddingVertical: 8 }}>
      <Text
        style={{
          fontSize: 12,
          color: isToday ? '#ff3b30' : isInViewWindow ? '#333' : '#999',
          marginBottom: 4,
          fontWeight: isInViewWindow ? '600' : '400',
        }}>
        {format(date, 'EEE', { locale: zhCN })}
      </Text>
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: isToday ? '#ff3b30' : isInViewWindow ? '#eee' : 'transparent',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: isToday ? 'white' : isInViewWindow ? '#000' : '#333',
          }}>
          {format(date, 'd')}
        </Text>
      </View>
    </View>
  )
})

export const WeekDateList = () => {
  const {
    dayList,
    weekDateItemWidth,
    weekListRef,
    visibleStartDateIndex,
    isWideScreen,
    onWeekScroll,
    onWeekBeginDrag,
    onScrollEnd,
    // ✨ 获取 initialIndex
    initialIndex,
  } = useWeekViewContext()

  const numVisibleColumns = isWideScreen ? 7 : 2

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={weekListRef}
        data={dayList}
        keyExtractor={item => item.toISOString()}
        extraData={visibleStartDateIndex}
        renderItem={({ item, index }) => (
          <WeekDateItem
            date={item}
            width={weekDateItemWidth}
            isInViewWindow={
              index >= visibleStartDateIndex && index < visibleStartDateIndex + numVisibleColumns
            }
            isToday={isSameDay(item, new Date())}
          />
        )}
        horizontal
        scrollEnabled={true}
        onScroll={onWeekScroll}
        onScrollBeginDrag={onWeekBeginDrag}
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={onScrollEnd}
        scrollEventThrottle={16}
        snapToInterval={isWideScreen ? undefined : weekDateItemWidth}
        decelerationRate="fast"
        getItemLayout={(data, index) => ({
          length: weekDateItemWidth,
          offset: weekDateItemWidth * index,
          index,
        })}
        showsHorizontalScrollIndicator={false}
        // ✨ 关键修复：添加初始滚动索引
        initialScrollIndex={initialIndex}
        // ✨ 关键修复：防止布局未就绪导致的滚动失败
        onScrollToIndexFailed={info => {
          const wait = new Promise(resolve => setTimeout(resolve, 500))
          wait.then(() => {
            weekListRef.current?.scrollToIndex({ index: info.index, animated: false })
          })
        }}
      />
    </View>
  )
}
