import React, { memo, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native'
import { format, isSameDay } from 'date-fns'
import { useWeekViewContext } from './WeekViewContext'
import { COLORS } from '@/theme'
import { WEEK_MODE_HEIGHT } from '../../../../constants'
import { WeekSlidingIndicator } from './WeekSlidingIndicator'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface WeekDateItemProps {
  date: Date
  width: number
  isFocused: boolean
  isSelected: boolean
  onPress: () => void
}

const WeekDateItem = memo(({ date, width, isFocused, isSelected, onPress }: WeekDateItemProps) => {
  const isToday = isSameDay(date, new Date())

  let containerStyle: any = styles.dateCircle
  let textStyle: any = styles.dateText

  if (isSelected) {
    // 选中状态 (优先级最高)
    containerStyle = [styles.dateCircle, styles.selectedCircle]
    textStyle = [styles.dateText, styles.selectedDateText]
  } else if (isToday) {
    // 今天 (优先级第二)
    containerStyle = [styles.dateCircle, styles.todayCircle]
    textStyle = [styles.dateText, styles.todayDateText]
  } else if (isFocused) {
    // 聚焦状态 (Window 第一天)
    // 移除背景色 (背景由胶囊提供)，改为文字加深
    containerStyle = styles.dateCircle // 无背景
    textStyle = [styles.dateText, styles.focusedDateText] // 深灰色
  } else {
    // 普通状态
    textStyle = [styles.dateText, { color: '#000' }]
  }

  return (
    <TouchableOpacity
      style={[styles.itemContainer, { width }]}
      onPress={onPress}
      activeOpacity={0.6}>
      <View style={containerStyle}>
        <Text style={textStyle}>{format(date, 'd')}</Text>
      </View>
    </TouchableOpacity>
  )
})

export const WeekDateList = () => {
  const {
    dayList,
    weekDateItemWidth,
    headerListRef,
    focusedDate,
    selectedDate,
    isWideScreen,
    onHeaderScroll,
    onHeaderBeginDrag,
    onScrollEnd,
    onDateSelect,
  } = useWeekViewContext()

  const { width: SCREEN_WIDTH } = useWindowDimensions()

  const renderItem = useCallback(
    ({ item }: { item: Date }) => {
      if (!item) return null

      // 判断状态
      const isFocused = isSameDay(item, focusedDate)
      const isSelected = isSameDay(item, new Date(selectedDate))

      return (
        <WeekDateItem
          date={item}
          width={weekDateItemWidth}
          isFocused={isFocused}
          isSelected={isSelected}
          onPress={() => onDateSelect(item.toISOString())}
        />
      )
    },
    [focusedDate, selectedDate, weekDateItemWidth, onDateSelect],
  )

  return (
    <View style={{ height: WEEK_MODE_HEIGHT, backgroundColor: 'white' }}>
      <WeekSlidingIndicator />
      <FlatList
        ref={headerListRef}
        data={dayList}
        keyExtractor={(item, index) => item?.toISOString?.() || index.toString()}
        extraData={`${focusedDate.toISOString()}_${selectedDate}`}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        // 滑动操作
        scrollEnabled={true}
        onScroll={onHeaderScroll}
        onScrollBeginDrag={onHeaderBeginDrag}
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={onScrollEnd}
        scrollEventThrottle={16}
        // 翻页操作
        pagingEnabled={!isWideScreen}
        snapToInterval={SCREEN_WIDTH}
        decelerationRate="fast"
        // 布局计算
        getItemLayout={(data, index) => ({
          length: weekDateItemWidth,
          offset: weekDateItemWidth * index,
          index,
        })}
        // 初始渲染量优化
        initialNumToRender={7}
        windowSize={3}
        style={{ backgroundColor: 'transparent' }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  itemContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: WEEK_MODE_HEIGHT,
  },
  dateCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  selectedCircle: {
    backgroundColor: COLORS.primary,
  },
  todayCircle: {
    backgroundColor: '#F2F2F7',
  },
  selectedDateText: {
    color: 'white',
    fontWeight: '600',
  },
  todayDateText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  // focusedCircle: {
  //   backgroundColor: '#ff3b30', // 鲜艳的红色，非常醒目
  // },
  focusedDateText: {
    color: '#333333', // 深灰色
    fontWeight: '700', // 加粗，体现它是窗口的“锚点”
  },
  // ⚫️ 普通文字
  dateText: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.3,
  },
})
