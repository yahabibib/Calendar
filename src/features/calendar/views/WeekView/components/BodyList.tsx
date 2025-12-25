import React, { memo, useMemo, useCallback } from 'react'
import { View, StyleSheet } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { isSameDay, isValid, setHours, setMinutes } from 'date-fns'
import { useNavigation } from '@react-navigation/native'
import Animated, { FadeIn } from 'react-native-reanimated'

import { useWeekViewContext } from '../WeekViewContext'
import { CurrentTimeIndicator } from '../../../components/CurrentTimeIndicator'
import { HOUR_HEIGHT } from '../../../../../theme/layout'
import { EventColumn } from './EventColumn'
import { DragCreateWrapper } from './DragCreateWrapper'
import { getEventsForDate } from '../../../../../utils/recurrence'

interface DayBodyItemProps {
  date: Date
  width: number
  events: any[]
  onEventPress?: (e: any) => void
  onCreateEvent: (ts: number, h: number, m: number) => void
  areEventsVisible: boolean
}

const DayBodyItem = memo(
  ({ date, width, events, onEventPress, onCreateEvent, areEventsVisible }: DayBodyItemProps) => {
    const isToday = useMemo(() => isValid(date) && isSameDay(date, new Date()), [date])

    return (
      <View
        style={{
          width,
          height: HOUR_HEIGHT * 24,
          borderRightWidth: 1,
          borderRightColor: '#f5f5f5',
          position: 'relative',
          overflow: 'visible',
          zIndex: 1,
        }}>
        <DragCreateWrapper date={date} onCreateEvent={onCreateEvent}>
          <View style={{ flex: 1 }}>
            {areEventsVisible ? (
              <Animated.View style={{ flex: 1 }} entering={FadeIn.duration(300)}>
                <EventColumn
                  events={events.filter((e: any) => !e.isAllDay)}
                  width={width}
                  onEventPress={onEventPress}
                  dayDate={date}
                />
              </Animated.View>
            ) : null}

            {isToday && <CurrentTimeIndicator />}
          </View>
        </DragCreateWrapper>
      </View>
    )
  },
)

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
    editingEventId,
    areEventsVisible,
  } = useWeekViewContext()

  const isEditing = editingEventId !== null
  const navigation = useNavigation<any>()

  const handleCreateEvent = useCallback(
    (timestamp: number, hour: number, minute: number) => {
      const baseDate = new Date(timestamp)
      const startDate = setMinutes(setHours(baseDate, hour), minute)
      navigation.navigate('AddEvent', { initialDate: startDate.toISOString() })
    },
    [navigation],
  )

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
            events={areEventsVisible ? getEventsForDate(events, item) : []}
            onEventPress={onEventPress}
            onCreateEvent={handleCreateEvent}
            areEventsVisible={areEventsVisible}
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
        scrollEnabled={!isEditing}
        removeClippedSubviews={false}
        onScroll={onBodyScroll}
        onScrollBeginDrag={onBodyBeginDrag}
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={onScrollEnd}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
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
