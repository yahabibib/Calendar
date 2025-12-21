import React, { memo, useMemo, useCallback } from 'react'
import { View, StyleSheet } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { isSameDay, isValid, setHours, setMinutes } from 'date-fns'
import { useNavigation } from '@react-navigation/native'
import { useWeekViewContext } from '../WeekViewContext'
import { CurrentTimeIndicator } from '../../../components/CurrentTimeIndicator'
import { HOUR_HEIGHT } from '../../../../../theme/layout'
import { EventColumn } from './EventColumn'
import { DragCreateWrapper } from './DragCreateWrapper'
// ✨ 引入新工具
import { getEventsForDate } from '../../../../../utils/recurrence'

const DayBodyItem = memo(({ date, width, events, onEventPress, onCreateEvent }: any) => {
  const isToday = useMemo(() => isValid(date) && isSameDay(date, new Date()), [date])
  // 这里的 events 已经是 getEventsForDate 计算好的当日实例列表了
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
    events, // 这是 Store 里的全量元数据
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
      <FlatList
        ref={bodyListRef}
        data={dayList}
        keyExtractor={item => item.toISOString()}
        renderItem={({ item }) => (
          <DayBodyItem
            date={item}
            width={dayColumnWidth}
            // ✨✨✨ 核心修改：使用 getEventsForDate 计算重复实例 ✨✨✨
            // 之前的 filter 只能看到当天的日程，现在可以看到根据 RRULE 生成的未来日程
            events={getEventsForDate(events, item)}
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
