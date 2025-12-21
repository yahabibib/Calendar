import React, { memo, useMemo, useCallback } from 'react'
import { View, StyleSheet, TouchableWithoutFeedback } from 'react-native'
import { FlatList } from 'react-native-gesture-handler' // 保持 RNGH
import { isSameDay, isValid, setHours, setMinutes } from 'date-fns'
import { useNavigation } from '@react-navigation/native'
import { useWeekViewContext } from '../WeekViewContext'
import { CurrentTimeIndicator } from '../../../components/CurrentTimeIndicator'
import { HOUR_HEIGHT } from '../../../../../theme/layout'
import { EventColumn } from './EventColumn'
import { DragCreateWrapper } from './DragCreateWrapper'

const DayBodyItem = memo(({ date, width, events, onEventPress, onCreateEvent }: any) => {
  const isToday = useMemo(() => isValid(date) && isSameDay(date, new Date()), [date])
  const regularEvents = useMemo(() => events.filter((e: any) => !e.isAllDay), [events])

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
          <EventColumn
            events={regularEvents}
            width={width}
            onEventPress={onEventPress}
            dayDate={date}
          />
          {isToday && <CurrentTimeIndicator />}
        </View>
      </DragCreateWrapper>
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
    editingEventId,
    setEditingEventId,
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
      <TouchableWithoutFeedback
        onPress={() => {
          if (editingEventId) setEditingEventId(null)
        }}>
        <View style={{ flex: 1 }}>
          {isEditing && (
            <TouchableWithoutFeedback onPress={() => setEditingEventId(null)}>
              <View style={StyleSheet.absoluteFill} />
            </TouchableWithoutFeedback>
          )}

          <FlatList
            ref={bodyListRef}
            data={dayList}
            keyExtractor={item => item.toISOString()}
            renderItem={({ item }) => (
              <DayBodyItem
                date={item}
                width={dayColumnWidth}
                events={events.filter(
                  (e: any) =>
                    isValid(new Date(e.startDate)) && isSameDay(new Date(e.startDate), item),
                )}
                onEventPress={onEventPress}
                onCreateEvent={handleCreateEvent}
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
            // ✨ 回退：编辑时锁死滚动，保证绝对稳定
            scrollEnabled={!isEditing}
            removeClippedSubviews={!isEditing}
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
      </TouchableWithoutFeedback>
    </View>
  )
}
