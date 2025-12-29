import React, { memo, useCallback, useEffect } from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native'
// ✨ 直接引入 Animated
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  useSharedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated'
import { format, isSameDay } from 'date-fns'
import { useWeekViewContext } from './WeekViewContext'
import { COLORS } from '@/theme'
import { WEEK_MODE_HEIGHT } from '../../../../constants'
import { WeekSlidingIndicator } from './WeekSlidingIndicator'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// 🎨 颜色定义
const SELECTED_COLOR = 'rgba(84, 110, 122, 0.8)'
const TODAY_BG_COLOR = '#F2F2F7'
const TODAY_TEXT_COLOR = COLORS.primary
const NORMAL_TEXT_COLOR = '#000000'
const SELECTED_TEXT_COLOR = '#FFFFFF'

interface WeekDateItemProps {
  date: Date
  width: number
  index: number
  onPress: () => void
}


const WeekDateItem = memo(({ date, width, index, onPress }: WeekDateItemProps) => {
  const { animBodyScrollX, dayColumnWidth } = useWeekViewContext()
  const isToday = isSameDay(date, new Date())

  // 1. 背景色动画
  const containerStyle = useAnimatedStyle(() => {
    // 今天不参与渐变，始终保持浅灰背景
    if (isToday) return { backgroundColor: TODAY_BG_COLOR }

    // 防止除以0
    if (dayColumnWidth === 0) return { backgroundColor: 'transparent' }

    const currentHeadIndex = animBodyScrollX.value / dayColumnWidth
    const distance = Math.abs(currentHeadIndex - index)
    // 限制在 0-1 之间
    const activeLevel = interpolate(distance, [0, 1], [1, 0], Extrapolation.CLAMP)

    return {
      backgroundColor: interpolateColor(activeLevel, [0, 1], ['transparent', SELECTED_COLOR]),
    }
  })

  // 2. 文字颜色动画
  const textStyle = useAnimatedStyle(() => {
    if (isToday) return { color: TODAY_TEXT_COLOR, fontWeight: '600' }

    if (dayColumnWidth === 0) return { color: NORMAL_TEXT_COLOR }

    const currentHeadIndex = animBodyScrollX.value / dayColumnWidth
    const distance = Math.abs(currentHeadIndex - index)
    const activeLevel = interpolate(distance, [0, 1], [1, 0], Extrapolation.CLAMP)

    return {
      color: interpolateColor(activeLevel, [0, 1], [NORMAL_TEXT_COLOR, SELECTED_TEXT_COLOR]),
      fontWeight: activeLevel > 0.6 ? '600' : '400',
    }
  })

  return (
    <TouchableOpacity
      style={[styles.itemContainer, { width }]}
      onPress={onPress}
      activeOpacity={0.6}>
      {/* ✨✨✨ 修复点：直接使用 Animated.View ✨✨✨ */}
      <Animated.View style={[styles.dateCircle, containerStyle]}>
        {/* ✨✨✨ 修复点：直接使用 Animated.Text ✨✨✨ */}
        <Animated.Text style={[styles.dateText, textStyle]}>{format(date, 'd')}</Animated.Text>
      </Animated.View>
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
    ({ item, index }: { item: Date; index: number }) => {
      if (!item) return null
      return (
        <WeekDateItem
          date={item}
          width={weekDateItemWidth}
          index={index}
          onPress={() => onDateSelect(item.toISOString())}
        />
      )
    },
    [weekDateItemWidth, onDateSelect],
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
        scrollEnabled={true}
        onScroll={onHeaderScroll}
        onScrollBeginDrag={onHeaderBeginDrag}
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={onScrollEnd}
        scrollEventThrottle={16}
        pagingEnabled={!isWideScreen}
        snapToInterval={SCREEN_WIDTH}
        decelerationRate="fast"
        getItemLayout={(data, index) => ({
          length: weekDateItemWidth,
          offset: weekDateItemWidth * index,
          index,
        })}
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
  },
  dateText: {
    fontSize: 17,
    letterSpacing: -0.3,
  },
})
