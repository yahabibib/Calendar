// src/features/calendar/views/WeekView/components/AllDayList.tsx
import React, { memo, useMemo } from 'react'
import { View, Text, FlatList } from 'react-native'
import { isSameDay, isValid, format } from 'date-fns'
import { useWeekViewContext } from '../WeekViewContext'
import { CalendarEvent } from '../../../../../types/event'

const AllDayItem = memo(({ date, width, events, containerHeight }: any) => {
  const isToday = useMemo(() => isValid(date) && isSameDay(date, new Date()), [date])
  const dateLabel = useMemo(() => (isValid(date) ? format(date, 'M月d日') : ''), [date])
  const allDayEvents = useMemo(() => events.filter((e: any) => e.isAllDay), [events])

  return (
    <View
      style={{
        width,
        height: containerHeight,
        borderRightWidth: 1,
        borderRightColor: '#f0f0f0',
        backgroundColor: '#f9f9f9',
        paddingHorizontal: 2,
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
      }}>
      <View style={{ height: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: isToday ? '#ff3b30' : '#333' }}>
          {dateLabel}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        {allDayEvents.map((event: any) => (
          <View
            key={event.id}
            style={{
              backgroundColor: event.color || '#2196F3',
              borderRadius: 2,
              paddingHorizontal: 4,
              height: 18,
              justifyContent: 'center',
              marginBottom: 2,
              opacity: 0.9,
            }}>
            <Text style={{ fontSize: 10, color: 'white', lineHeight: 14 }} numberOfLines={1}>
              {event.title}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
})

export const AllDayList = () => {
  const {
    dayList,
    dayColumnWidth,
    events,
    headerListRef,
    derivedHeaderHeight,
    // ✨ 引入 Handler
    onHeaderScroll,
    onHeaderBeginDrag,
    onScrollEnd,
  } = useWeekViewContext()

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={headerListRef}
        data={dayList}
        keyExtractor={item => item.toISOString()}
        renderItem={({ item }) => (
          <AllDayItem
            date={item}
            width={dayColumnWidth}
            events={events.filter(
              (e: any) => isValid(new Date(e.startDate)) && isSameDay(new Date(e.startDate), item),
            )}
            containerHeight={derivedHeaderHeight}
          />
        )}
        horizontal
        // ✨ 开启滚动
        scrollEnabled={true}
        onScroll={onHeaderScroll}
        onScrollBeginDrag={onHeaderBeginDrag}
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={onScrollEnd}
        scrollEventThrottle={16}
        // ✨ 新增吸附属性
        snapToInterval={dayColumnWidth}
        getItemLayout={(data, index) => ({
          length: dayColumnWidth,
          offset: dayColumnWidth * index,
          index,
        })}
        showsHorizontalScrollIndicator={false}
        initialNumToRender={3}
      />
    </View>
  )
}
