import React, { useState, useRef, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
  ScrollView,
  StyleSheet,
} from 'react-native'
import {
  addDays,
  format,
  startOfWeek,
  differenceInCalendarDays,
  isSameDay,
  isValid,
} from 'date-fns'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { styles } from './styles'
import { WeekRow } from '../../components/WeekRow'
import { ScheduleEvent } from '../../components/ScheduleEvent'
import { CurrentTimeIndicator } from '../../components/CurrentTimeIndicator'
import { CalendarEvent } from '../../../../types/event'
import { useEventStore } from '../../../../store/eventStore'
import { HOUR_HEIGHT, TIME_LABEL_WIDTH, ALL_DAY_HEADER_HEIGHT } from '../../../../theme/layout'

const PAST_DAYS_RANGE = 365
const TOTAL_PAGES_ESTIMATE = 730

interface WeekViewProps {
  selectedDate: string
  onDateSelect: (date: string) => void
  onHeaderBackPress?: (currentDate: Date) => void
  onAddEvent?: (startDate: Date) => void
  onEventPress?: (event: CalendarEvent) => void
}

// 组件 A: 顶部的日期头 (吸顶部分)
const DayHeaderItem = React.memo(
  ({
    date,
    width,
    events,
    isWideScreen,
  }: {
    date: Date
    width: number
    events: CalendarEvent[]
    isWideScreen: boolean
  }) => {
    const isToday = React.useMemo(() => isValid(date) && isSameDay(date, new Date()), [date])
    const dateLabel = useMemo(() => (isValid(date) ? format(date, 'M月d日') : ''), [date])
    const allDayEvents = events.filter(e => e.isAllDay)

    return (
      <View
        style={{
          width,
          height: ALL_DAY_HEADER_HEIGHT,
          borderRightWidth: 1,
          borderRightColor: '#f0f0f0',
          backgroundColor: '#f9f9f9',
          paddingHorizontal: 4,
          justifyContent: 'center',
          borderBottomWidth: 1,
          borderBottomColor: '#e0e0e0',
        }}>
        {!isWideScreen && (
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: isToday ? '#ff3b30' : '#333',
              marginBottom: 2,
            }}>
            {dateLabel}
          </Text>
        )}

        {allDayEvents.length > 0 && (
          <View
            style={{
              backgroundColor: allDayEvents[0].color,
              borderRadius: 2,
              paddingHorizontal: 4,
              paddingVertical: 1,
            }}>
            <Text style={{ fontSize: 9, color: 'white' }} numberOfLines={1}>
              {allDayEvents[0].title}
            </Text>
          </View>
        )}
      </View>
    )
  },
)

// 组件 B: 下方的日程网格
const DayBodyItem = React.memo(
  ({
    date,
    width,
    events,
    onEventPress,
  }: {
    date: Date
    width: number
    events: CalendarEvent[]
    onEventPress?: (e: CalendarEvent) => void
  }) => {
    const isToday = React.useMemo(() => isValid(date) && isSameDay(date, new Date()), [date])
    const regularEvents = events.filter(e => !e.isAllDay)

    return (
      <View
        style={{
          width,
          height: HOUR_HEIGHT * 24,
          borderRightWidth: 1,
          borderRightColor: '#f5f5f5',
          position: 'relative',
        }}>
        {regularEvents.map(event => (
          <ScheduleEvent key={event.id} event={event} onPress={onEventPress || (() => {})} />
        ))}
        {isToday && <CurrentTimeIndicator />}
      </View>
    )
  },
)

export const WeekView: React.FC<WeekViewProps> = ({
  selectedDate,
  onDateSelect,
  onHeaderBackPress,
  onAddEvent,
  onEventPress,
}) => {
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()
  const events = useEventStore(state => state.events)

  const headerListRef = useRef<FlatList>(null)
  const bodyListRef = useRef<FlatList>(null)
  const verticalScrollRef = useRef<ScrollView>(null)

  const isWideScreen = screenWidth > 600
  const numColumns = isWideScreen ? 7 : 2

  // 右侧实际可用宽度
  const rightSideWidth = screenWidth - TIME_LABEL_WIDTH
  const dayColumnWidth = rightSideWidth / numColumns

  // 数据源
  const { dayList, startDateAnchor } = useMemo(() => {
    const today = new Date()
    const anchor = startOfWeek(today, { weekStartsOn: 1 })
    const start = addDays(anchor, -PAST_DAYS_RANGE)
    const list = Array.from({ length: TOTAL_PAGES_ESTIMATE }).map((_, i) => addDays(start, i))
    return { dayList: list, startDateAnchor: start }
  }, [])

  const initialIndex = useMemo(() => {
    const target = new Date(selectedDate)
    if (!isValid(target)) return 0
    return Math.max(0, differenceInCalendarDays(target, startDateAnchor))
  }, [selectedDate, startDateAnchor])

  const [headerDate, setHeaderDate] = useState(() => {
    const d = new Date(selectedDate)
    return isValid(d) ? d : new Date()
  })

  const onBodyScroll = useCallback((e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x
    if (headerListRef.current) {
      headerListRef.current.scrollToOffset({ offset: offsetX, animated: false })
    }
  }, [])

  const onMomentumScrollEnd = useCallback(
    (e: any) => {
      const offsetX = e.nativeEvent.contentOffset.x
      const index = Math.round(offsetX / dayColumnWidth)
      const itemDate = dayList[index]
      if (itemDate && isValid(itemDate)) {
        onDateSelect(format(itemDate, 'yyyy-MM-dd'))
      }
    },
    [dayList, dayColumnWidth, onDateSelect],
  )

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      const firstItem = viewableItems[0]
      if (firstItem && firstItem.item && isValid(firstItem.item)) {
        setHeaderDate(firstItem.item)
      }
    }
  }, [])

  const renderHeaderItem = useCallback(
    ({ item }: { item: Date }) => {
      const dayEvents = events.filter(e => {
        const d = new Date(e.startDate)
        return isValid(d) && isSameDay(d, item)
      })
      return (
        <DayHeaderItem
          date={item}
          width={dayColumnWidth}
          events={dayEvents}
          isWideScreen={isWideScreen}
        />
      )
    },
    [dayColumnWidth, events, isWideScreen],
  )

  const renderBodyItem = useCallback(
    ({ item }: { item: Date }) => {
      const dayEvents = events.filter(e => {
        const d = new Date(e.startDate)
        return isValid(d) && isSameDay(d, item)
      })
      return (
        <DayBodyItem
          date={item}
          width={dayColumnWidth}
          events={dayEvents}
          onEventPress={onEventPress}
        />
      )
    },
    [dayColumnWidth, events, onEventPress],
  )

  const headerWeekStart = useMemo(() => {
    const d = isValid(headerDate) ? headerDate : new Date()
    return startOfWeek(d, { weekStartsOn: 1 })
  }, [headerDate])

  const hours = Array.from({ length: 24 }).map((_, i) => i)
  const snapInterval = isWideScreen ? rightSideWidth : dayColumnWidth

  return (
    <View style={styles.container}>
      {/* 1. 顶部固定 Header (WeekRow) */}
      <View style={[styles.headerContainer, { paddingTop: insets.top, zIndex: 20 }]}>
        <View style={styles.navRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => onHeaderBackPress?.(headerDate)}>
            <Text style={styles.backArrow}>◀</Text>
            <Text style={styles.backText}>
              {isValid(headerDate) ? format(headerDate, 'M月') : ''}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.titleRow}>
          <Text style={styles.headerTitle}>
            {isValid(headerDate) ? format(headerDate, 'yyyy年 M月') : ''}
          </Text>
        </View>

        {/* ✨ 修复对齐 1: 给 WeekRow 包裹一个带左侧占位的容器 */}
        <View style={{ flexDirection: 'row', width: '100%' }}>
          {/* 左侧占位：对齐下方的时间轴 */}
          <View style={{ width: TIME_LABEL_WIDTH }} />

          {/* 右侧：WeekRow 填满剩余空间 */}
          <View style={{ flex: 1 }}>
            <WeekRow
              startDate={headerWeekStart}
              selectedDate={isValid(new Date(selectedDate)) ? new Date(selectedDate) : new Date()}
              onDateSelect={d => {
                onDateSelect(format(d, 'yyyy-MM-dd'))
                const diff = differenceInCalendarDays(d, startDateAnchor)
                bodyListRef.current?.scrollToIndex({ index: Math.max(0, diff), animated: true })
              }}
              renderDays={7}
              isWideScreen={isWideScreen}
            />
          </View>
        </View>
      </View>

      {/* 2. 垂直滚动容器 */}
      <View style={{ flex: 1 }}>
        <ScrollView
          ref={verticalScrollRef}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentOffset={{ x: 0, y: 480 }}
          stickyHeaderIndices={[0]}
          bounces={false}>
          {/* Sticky Header: "全天" + 日期头 */}
          {/* 显式设置高度，防止空行或撑大 */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: '#f9f9f9',
              borderBottomWidth: 1,
              borderBottomColor: '#ddd',
              zIndex: 10,
              width: screenWidth,
              height: ALL_DAY_HEADER_HEIGHT, // ✨ 显式约束高度
            }}>
            {/* 左上角 "全天" */}
            <View
              style={{
                width: TIME_LABEL_WIDTH,
                height: '100%',
                backgroundColor: 'white',
                borderRightWidth: 1,
                borderRightColor: '#f0f0f0',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Text style={{ fontSize: 10, color: '#999', fontWeight: '500' }}>全天</Text>
            </View>

            {/* 右侧 日期头列表 */}
            {/* ✨ 使用显式宽度容器，确保与 Body 完全对齐 */}
            <View style={{ width: rightSideWidth }}>
              <FlatList
                ref={headerListRef}
                data={dayList}
                keyExtractor={item =>
                  isValid(item) ? item.toISOString() : Math.random().toString()
                }
                renderItem={renderHeaderItem}
                horizontal={true}
                scrollEnabled={false}
                getItemLayout={(data, index) => ({
                  length: dayColumnWidth,
                  offset: dayColumnWidth * index,
                  index,
                })}
                initialScrollIndex={initialIndex}
                windowSize={5}
                initialNumToRender={numColumns + 1}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          </View>

          {/* Body Row: 时间轴 + 网格 */}
          <View style={{ flexDirection: 'row', height: HOUR_HEIGHT * 24, width: screenWidth }}>
            {/* Left Time Ruler */}
            <View
              style={{
                width: TIME_LABEL_WIDTH,
                borderRightWidth: 1,
                borderRightColor: '#f0f0f0',
                backgroundColor: 'white',
              }}>
              {hours.map(h => (
                <View key={h} style={{ height: HOUR_HEIGHT, alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, color: '#999', transform: [{ translateY: -6 }] }}>
                    {h === 0 ? '' : `${h}:00`}
                  </Text>
                </View>
              ))}
            </View>

            {/* Right Grid List */}
            <View style={{ width: rightSideWidth }}>
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                {hours.map(h => (
                  <View
                    key={`line-${h}`}
                    style={{
                      height: HOUR_HEIGHT,
                      borderBottomWidth: 1,
                      borderBottomColor: '#f5f5f5',
                    }}
                  />
                ))}
              </View>

              <FlatList
                ref={bodyListRef}
                data={dayList}
                keyExtractor={item =>
                  isValid(item) ? item.toISOString() : Math.random().toString()
                }
                renderItem={renderBodyItem}
                horizontal={true}
                snapToInterval={snapInterval}
                decelerationRate="fast"
                pagingEnabled={isWideScreen}
                initialScrollIndex={initialIndex}
                getItemLayout={(data, index) => ({
                  length: dayColumnWidth,
                  offset: dayColumnWidth * index,
                  index,
                })}
                onScroll={onBodyScroll}
                scrollEventThrottle={16}
                onMomentumScrollEnd={onMomentumScrollEnd}
                onViewableItemsChanged={onViewableItemsChanged}
                windowSize={5}
                initialNumToRender={numColumns + 1}
                maxToRenderPerBatch={2}
                removeClippedSubviews={true}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  )
}
