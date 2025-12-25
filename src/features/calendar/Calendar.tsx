import React, { useState, useMemo, useEffect } from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated'
import { startOfMonth, getDay, format } from 'date-fns'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { CalendarHeader } from './components/CalendarHeader'
import { MonthBody } from './components/MonthBody'
import { WeekDateHeader, WeekAllDayRow, WeekGridPart } from './components/WeekBody'
import { YearView } from './views/YearView'
import { EventList } from '../../components/EventList'
import { WeekViewProvider } from './views/WeekView/WeekViewContext'

import {
  CALENDAR_ROW_HEIGHT,
  WEEK_MODE_HEIGHT, // ✨ 引入新常量
} from './constants'
import { MONTH_TITLE_HEIGHT } from './components/MonthGrid'
import { CalendarProps } from '../../types/event'

const getRowIndex = (date: Date): number => {
  const monthStart = startOfMonth(date)
  const startDay = getDay(monthStart)
  const offsetStartDay = startDay === 0 ? 6 : startDay - 1
  const dayOfMonth = date.getDate()
  return Math.floor((offsetStartDay + dayOfMonth - 1) / 7)
}

export const Calendar: React.FC<CalendarProps> = props => {
  const insets = useSafeAreaInsets()
  const [rootMode, setRootMode] = useState<'year' | 'standard'>('standard')
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')

  const [selectedDate, setSelectedDate] = useState(() => {
    return props.initialDate ? new Date(props.initialDate) : new Date()
  })
  const selectedDateStr = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate])

  const expandProgress = useSharedValue(1)

  const toggleMode = (target: 'week' | 'month') => {
    'worklet'
    expandProgress.value = withSpring(target === 'month' ? 1 : 0, {
      mass: 1,
      damping: 15,
      stiffness: 100,
      overshootClamping: false,
    })
  }

  useEffect(() => {
    toggleMode(viewMode)
  }, [viewMode])

  const rowIndex = useMemo(() => getRowIndex(selectedDate), [selectedDate])

  // 吸附计算：依然基于月视图的行高
  const targetOffsetY = -(rowIndex * CALENDAR_ROW_HEIGHT) - MONTH_TITLE_HEIGHT

  // 月视图总高度：6行 + 标题 + 缓冲
  const MONTH_VIEW_HEIGHT = CALENDAR_ROW_HEIGHT * 6 + MONTH_TITLE_HEIGHT + 20

  const containerStyle = useAnimatedStyle(() => ({
    height: interpolate(
      expandProgress.value,
      [0, 1],
      [WEEK_MODE_HEIGHT, MONTH_VIEW_HEIGHT], // ✨ Week模式下高度为 58，Month模式下铺满
      Extrapolation.CLAMP,
    ),
    overflow: 'hidden',
  }))

  const monthTranslateStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          expandProgress.value,
          [0, 1],
          [targetOffsetY, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
    opacity: interpolate(expandProgress.value, [0, 0.2], [0, 1], Extrapolation.CLAMP),
  }))

  const weekHeaderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expandProgress.value, [0.8, 0], [0, 1], Extrapolation.CLAMP),
    zIndex: expandProgress.value < 0.1 ? 10 : -1,
    transform: [
      {
        translateY: interpolate(expandProgress.value, [0.5, 0], [-20, 0], Extrapolation.CLAMP),
      },
    ],
  }))

  const weekBodyFadeStyle = useAnimatedStyle(() => ({
    flex: 1,
    opacity: interpolate(expandProgress.value, [0.5, 0], [0, 1], Extrapolation.CLAMP),
  }))

  const handleDayPress = (dateStr: string) => {
    const date = new Date(dateStr)
    setSelectedDate(date)
    if (viewMode === 'month') {
      setViewMode('week')
    }
  }

  const handleHeaderBack = () => {
    if (viewMode === 'week') {
      setViewMode('month')
    } else {
      setRootMode('year')
    }
  }

  const handleYearSelect = (date: Date) => {
    setSelectedDate(date)
    setRootMode('standard')
    setViewMode('month')
    expandProgress.value = 1
  }

  const handleTitlePress = () => {
    if (viewMode === 'month') {
      setRootMode('year')
    }
  }

  return (
    <View style={styles.container}>
      {rootMode === 'year' ? (
        <YearView currentYear={selectedDate} onMonthSelect={handleYearSelect} />
      ) : (
        <WeekViewProvider
          selectedDate={selectedDateStr}
          onDateSelect={handleDayPress}
          onEventPress={props.onEventPress}
          onHeaderBackPress={() => {}}>
          <View style={styles.standardContainer}>
            <CalendarHeader
              mode={viewMode}
              currentDate={selectedDate}
              onGoBack={handleHeaderBack}
              onTitlePress={handleTitlePress}
              onAddEvent={props.onAddEventPress}
              expandProgress={expandProgress}
            />

            {/* 1. 折叠容器 */}
            <Animated.View style={[styles.calendarWrapper, containerStyle]}>
              <Animated.View style={[StyleSheet.absoluteFill, monthTranslateStyle]}>
                <MonthBody
                  selectedDate={selectedDateStr}
                  onDateSelect={handleDayPress}
                  onPageChange={() => {}}
                  rowHeight={CALENDAR_ROW_HEIGHT} // ✨ 传入新的大行高
                />
              </Animated.View>

              <Animated.View style={[StyleSheet.absoluteFill, weekHeaderStyle]}>
                <WeekDateHeader />
              </Animated.View>
            </Animated.View>

            {/* 2. 全天事件行 */}
            {viewMode === 'week' && <WeekAllDayRow />}

            {/* 3. 底部内容 */}
            <View style={styles.bodyContainer}>
              {viewMode === 'month' ? (
                <View style={{ flex: 1, backgroundColor: 'white' }} />
              ) : (
                <Animated.View style={[StyleSheet.absoluteFill, weekBodyFadeStyle]}>
                  <WeekGridPart />
                </Animated.View>
              )}
            </View>
          </View>
        </WeekViewProvider>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  standardContainer: { flex: 1 },
  calendarWrapper: {
    width: '100%',
    backgroundColor: 'white',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  bodyContainer: {
    flex: 1,
    backgroundColor: '#fff',
    zIndex: 1,
  },
})
