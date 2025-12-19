// src/features/calendar/views/WeekView/components/BodyList.tsx
import React, { memo, useMemo } from 'react'
import { View, FlatList, StyleSheet } from 'react-native'
import { isSameDay, isValid } from 'date-fns'
import { useWeekViewContext } from '../WeekViewContext'
import { ScheduleEvent } from '../../../components/ScheduleEvent'
import { CurrentTimeIndicator } from '../../../components/CurrentTimeIndicator'
import { HOUR_HEIGHT } from '../../../../../theme/layout'

const DayBodyItem = memo(({ date, width, events, onEventPress }: any) => {
  const isToday = useMemo(() => isValid(date) && isSameDay(date, new Date()), [date])
  const regularEvents = events.filter((e: any) => !e.isAllDay)
  return (
    <View
      style={{
        width,
        height: HOUR_HEIGHT * 24,
        borderRightWidth: 1,
        borderRightColor: '#f5f5f5',
        position: 'relative',
      }}>
      {regularEvents.map((event: any) => (
        <ScheduleEvent key={event.id} event={event} onPress={onEventPress || (() => {})} />
      ))}
      {isToday && <CurrentTimeIndicator />}
    </View>
  )
})

export const BodyList = () => {
  const {
    dayList,
    dayColumnWidth,
    events,
    bodyListRef,
    // ✨ 引入 Handler
    onBodyScroll,
    onBodyBeginDrag,
    onScrollEnd,
    onViewableItemsChanged,
    onEventPress,
    isWideScreen,
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
        // ✨ 绑定滚动事件
        onScroll={onBodyScroll}
        onScrollBeginDrag={onBodyBeginDrag}
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={onScrollEnd}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        initialNumToRender={7}
        removeClippedSubviews={true}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  )
}
