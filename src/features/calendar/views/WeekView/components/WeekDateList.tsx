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
    // ✨ 引入 Handler
    onWeekScroll,
    onWeekBeginDrag,
    onScrollEnd,
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
        // ✨ 开启滚动
        scrollEnabled={true}
        onScroll={onWeekScroll}
        onScrollBeginDrag={onWeekBeginDrag}
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={onScrollEnd} // 加上这个更保险
        scrollEventThrottle={16} // 保证平滑
        snapToInterval={weekDateItemWidth}
        getItemLayout={(data, index) => ({
          length: weekDateItemWidth,
          offset: weekDateItemWidth * index,
          index,
        })}
        showsHorizontalScrollIndicator={false}
        initialNumToRender={7}
      />
    </View>
  )
}
