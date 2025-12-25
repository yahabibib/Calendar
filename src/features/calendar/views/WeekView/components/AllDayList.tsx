import React, { memo, useMemo } from 'react'
import { View, Text, FlatList } from 'react-native'
import { isSameDay, isValid, format } from 'date-fns'
import Animated, { FadeIn } from 'react-native-reanimated'
import { useWeekViewContext } from '../WeekViewContext'
import { CalendarEvent } from '../../../../../types/event'

interface AllDayItemProps {
  date: Date
  width: number
  events: CalendarEvent[]
  containerHeight: number
  areEventsVisible: boolean
}

const AllDayItem = memo(
  ({ date, width, events, containerHeight, areEventsVisible }: AllDayItemProps) => {
    const isToday = useMemo(() => isValid(date) && isSameDay(date, new Date()), [date])
    const dateLabel = useMemo(() => (isValid(date) ? format(date, 'M月d日') : ''), [date])

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
        <View
          style={{ height: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: isToday ? '#ff3b30' : '#333' }}>
            {dateLabel}
          </Text>
        </View>

        {areEventsVisible ? (
          <Animated.View style={{ flex: 1 }} entering={FadeIn.duration(300)}>
            {events
              .filter((e: any) => e.isAllDay)
              .map((event: any) => (
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
          </Animated.View>
        ) : null}
      </View>
    )
  },
)

export const AllDayList = () => {
  const {
    dayList,
    dayColumnWidth,
    events,
    allDayListRef,
    derivedHeaderHeight,
    isWideScreen,
    onAllDayScroll,
    onAllDayBeginDrag,
    onScrollEnd,
    initialIndex,
    areEventsVisible,
  } = useWeekViewContext()

  const safeWidth = dayColumnWidth && !isNaN(dayColumnWidth) ? dayColumnWidth : 0

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={allDayListRef}
        data={dayList}
        keyExtractor={(item, index) => item?.toISOString?.() || index.toString()}
        renderItem={({ item }) => (
          <AllDayItem
            date={item}
            width={safeWidth}
            events={events.filter(
              (e: any) => isValid(new Date(e.startDate)) && isSameDay(new Date(e.startDate), item),
            )}
            containerHeight={derivedHeaderHeight}
            areEventsVisible={areEventsVisible}
          />
        )}
        horizontal
        scrollEnabled={true}
        onScroll={onAllDayScroll}
        onScrollBeginDrag={onAllDayBeginDrag}
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={onScrollEnd}
        scrollEventThrottle={16}
        snapToInterval={isWideScreen ? undefined : safeWidth}
        decelerationRate="fast"
        getItemLayout={(data, index) => ({
          length: safeWidth,
          offset: safeWidth * index,
          index,
        })}
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        onScrollToIndexFailed={info => {
          const wait = new Promise(resolve => setTimeout(resolve, 500))
          wait.then(() => {
            allDayListRef.current?.scrollToIndex({ index: info.index, animated: false })
          })
        }}
      />
    </View>
  )
}
