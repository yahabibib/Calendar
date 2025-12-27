import React, { memo } from 'react'
import { View, Text, FlatList, StyleSheet, Dimensions, useWindowDimensions } from 'react-native'
import { format, isSameDay } from 'date-fns'
import { useWeekViewContext } from './WeekViewContext'
import { COLORS } from '../../../../../../theme'
import { WEEK_MODE_HEIGHT } from '../../../../constants'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const WeekDateItem = memo(({ date, width, isFocused, isSelected }: any) => {
  const isToday = isSameDay(date, new Date())

  let containerStyle = styles.dateCircle
  let textStyle = styles.dateText

  if (isSelected) {
    containerStyle = [styles.dateCircle, styles.selectedCircle]
    textStyle = [styles.dateText, styles.selectedDateText]
  } else if (isToday) {
    containerStyle = [styles.dateCircle, styles.todayCircle]
    textStyle = [styles.dateText, styles.todayDateText]
  } else if (isFocused) {
    // textStyle = [styles.dateText, { color: '#000', fontWeight: '500' }]
    containerStyle = [styles.dateCircle, styles.focusedCircle]
    textStyle = [styles.dateText, styles.focusedDateText]
  } else {
    textStyle = [styles.dateText, { color: '#000' }]
  }

  return (
    <View style={[styles.itemContainer, { width }]}>
      <View style={containerStyle}>
        <Text style={textStyle}>{format(date, 'd')}</Text>
      </View>
    </View>
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
  } = useWeekViewContext()

  const { width: SCREEN_WIDTH } = useWindowDimensions()

  return (
    <View style={{ height: WEEK_MODE_HEIGHT, backgroundColor: 'white' }}>
      <FlatList
        ref={headerListRef}
        data={dayList}
        keyExtractor={(item, index) => item?.toISOString?.() || index.toString()}
        extraData={`${focusedDate.toISOString()}_${selectedDate}`}
        renderItem={({ item }) => {
          if (!item) return null // 安全检查
          const isFocused = isSameDay(item, focusedDate)
          return (
            <WeekDateItem
              date={item}
              width={weekDateItemWidth}
              isFocused={isFocused}
              isSelected={isSameDay(item, new Date(selectedDate))}
            />
          )
        }}
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
  dateText: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.3,
  },
  selectedDateText: {
    color: 'white',
    fontWeight: '600',
  },
  todayDateText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  focusedCircle: {
    backgroundColor: '#ff3b30', // 鲜艳的红色，非常醒目
  },
  focusedDateText: {
    color: 'white', // 白字
    fontWeight: '600',
  },
  // ⚫️ 普通文字
  dateText: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.3,
  },
})
