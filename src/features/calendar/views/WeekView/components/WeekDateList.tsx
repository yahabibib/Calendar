import React, { memo } from 'react'
import { View, Text, FlatList, StyleSheet } from 'react-native'
import { format, isSameDay } from 'date-fns'
import { useWeekViewContext } from '../WeekViewContext'
import { COLORS } from '../../../../../theme'
import { WEEK_MODE_HEIGHT } from '../../../constants' // ✨ 引入常量

const WeekDateItem = memo(({ date, width, isInViewWindow, isSelected }: any) => {
  const isToday = isSameDay(date, new Date())

  let containerStyle = styles.dateCircle
  let textStyle = styles.dateText

  if (isSelected) {
    containerStyle = [styles.dateCircle, styles.selectedCircle]
    textStyle = [styles.dateText, styles.selectedDateText]
  } else if (isToday) {
    textStyle = [styles.dateText, styles.todayDateText]
  } else if (!isInViewWindow) {
    textStyle = [styles.dateText, { color: '#ccc' }]
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
    weekListRef,
    visibleStartDateIndex,
    isWideScreen,
    onWeekScroll,
    onWeekBeginDrag,
    onScrollEnd,
    initialIndex,
    selectedDate,
  } = useWeekViewContext()

  const numVisibleColumns = isWideScreen ? 7 : 2

  return (
    // ✨ 使用常量控制高度
    <View style={{ height: WEEK_MODE_HEIGHT, backgroundColor: 'white' }}>
      <FlatList
        ref={weekListRef}
        data={dayList}
        keyExtractor={item => item.toISOString()}
        extraData={`${visibleStartDateIndex}_${selectedDate}`}
        renderItem={({ item, index }) => {
          const isInWindow =
            index >= visibleStartDateIndex && index < visibleStartDateIndex + numVisibleColumns
          return (
            <WeekDateItem
              date={item}
              width={weekDateItemWidth}
              isInViewWindow={isInWindow}
              isSelected={isSameDay(item, new Date(selectedDate))}
            />
          )
        }}
        horizontal
        scrollEnabled={true}
        onScroll={onWeekScroll}
        onScrollBeginDrag={onWeekBeginDrag}
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={onScrollEnd}
        scrollEventThrottle={16}
        snapToInterval={weekDateItemWidth}
        decelerationRate="fast"
        getItemLayout={(data, index) => ({
          length: weekDateItemWidth,
          offset: weekDateItemWidth * index,
          index,
        })}
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        onScrollToIndexFailed={info => {
          const wait = new Promise(resolve => setTimeout(resolve, 500))
          wait.then(() => {
            weekListRef.current?.scrollToIndex({ index: info.index, animated: false })
          })
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  itemContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: WEEK_MODE_HEIGHT, // 确保子项高度撑满
  },
  dateCircle: {
    width: 40, // ✨ 稍微加大圆圈
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  selectedCircle: {
    backgroundColor: 'black',
  },
  dateText: {
    fontSize: 18, // ✨ 微调字体
    color: '#000',
    fontWeight: '500',
  },
  selectedDateText: {
    color: 'white',
    fontWeight: '600',
  },
  todayDateText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
})
