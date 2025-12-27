// src/features/calendar/components/StandardCalendar/index.tsx

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { View, StyleSheet, BackHandler, StyleProp, ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated'
import { format, isSameMonth } from 'date-fns'

// Components
import { CalendarHeader } from '../CalendarHeader'
import { MonthBody } from '../MonthBody'
import { WeekDateHeader, AnimatedWeekAllDayRow, WeekGridPart } from '../WeekBody'
import { TransitionMonthView } from '../TransitionMonthView'
import { WeekViewProvider } from '../../views/WeekView/WeekViewContext'

// Hooks & Constants
import { useCalendarLayout } from '../../hooks/useCalendarLayout'
import { CalendarEvent } from '../../../../types/event'

interface StandardCalendarProps {
  // 数据
  selectedDate: Date
  events: CalendarEvent[]

  // ✨ 状态提升：接收父组件的状态
  viewMode: 'month' | 'week'
  setViewMode: (mode: 'month' | 'week') => void

  // 回调
  onSelectDate: (date: Date) => void
  onAddEvent: () => void
  onEventPress: (event: CalendarEvent) => void
  onRequestGoToYear: () => void

  // 样式
  style?: StyleProp<ViewStyle>
  pointerEvents?: 'box-none' | 'none' | 'auto'
}

export const StandardCalendar: React.FC<StandardCalendarProps> = ({
  selectedDate,
  events,
  viewMode, // ✨ 来自父组件
  setViewMode, // ✨ 来自父组件
  onSelectDate,
  onAddEvent,
  onEventPress,
  onRequestGoToYear,
  style,
  pointerEvents,
}) => {
  const { dynamicMonthRowHeight, MONTH_CONTENT_HEIGHT, WEEK_MODE_HEIGHT } = useCalendarLayout()

  // ❌ 删除本地状态
  // const [viewMode, setViewMode] = useState<'month' | 'week'>('month')

  const [areEventsVisible, setAreEventsVisible] = useState(false)
  const [visualOffsetY, setVisualOffsetY] = useState(0)

  const selectedDateStr = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate])
  const lastSelectedMonthRef = useRef(selectedDate)

  const expandProgress = useSharedValue(viewMode === 'month' ? 1 : 0) // 根据传入的 mode 初始化

  // 动画逻辑
  const toggleMode = useCallback(
    (target: 'week' | 'month') => {
      'worklet'
      if (target === 'month') {
        runOnJS(setAreEventsVisible)(false)
      }

      expandProgress.value = withSpring(
        target === 'month' ? 1 : 0,
        {
          mass: 0.5,
          damping: 15,
          stiffness: 80,
          overshootClamping: false,
        },
        finished => {
          if (finished && target === 'week') {
            runOnJS(setAreEventsVisible)(true)
          }
        },
      )
    },
    [expandProgress],
  )

  // 监听外部传入的 viewMode 变化
  useEffect(() => {
    toggleMode(viewMode)
  }, [viewMode, toggleMode])

  // 跨月保护
  useEffect(() => {
    if (viewMode === 'week') {
      if (!isSameMonth(selectedDate, lastSelectedMonthRef.current)) {
        setVisualOffsetY(0)
      }
    }
    lastSelectedMonthRef.current = selectedDate
  }, [selectedDate, viewMode])

  // ✨ 物理返回键：这里只需要处理 Standard 内部的逻辑（Week -> Month）
  // Month -> Year 的逻辑其实父组件 Calendar.tsx 已经处理了，
  // 但为了双重保险，这里保留 onRequestGoToYear 的调用也是可以的。
  // 不过通常建议 BackHandler 只在一个层级注册。
  // 考虑到 Calendar.tsx 已经注册了 BackHandler，这里的其实可以移除，
  // 或者只保留 handleHeaderBack 供 UI 按钮使用。

  // 交互处理
  const handleDayPress = (dateStr: string, visualY?: number) => {
    onSelectDate(new Date(dateStr))
    if (visualY !== undefined) {
      setVisualOffsetY(visualY)
    } else {
      setVisualOffsetY(0)
    }
    if (viewMode === 'month') {
      setViewMode('week') // ✨ 调用父组件的方法
    }
  }

  const handleHeaderBack = () => {
    if (viewMode === 'week') {
      setVisualOffsetY(0)
      setViewMode('month') // ✨ 调用父组件的方法
    } else {
      onRequestGoToYear()
    }
  }

  const handleTitlePress = () => {
    if (viewMode === 'month') onRequestGoToYear()
  }

  const handleMonthPageChange = (newDate: Date) => {
    onSelectDate(newDate)
  }

  // ... 动画样式保持不变 ...
  const containerStyle = useAnimatedStyle(() => ({
    height: MONTH_CONTENT_HEIGHT,
    overflow: 'hidden',
    zIndex: 1,
  }))
  const weekHeaderStyle = useAnimatedStyle(() => ({
    opacity: expandProgress.value < 0.01 ? 1 : 0,
    zIndex: expandProgress.value < 0.01 ? 20 : -1,
    transform: [{ translateY: 0 }],
  }))
  const weekBodyFadeStyle = useAnimatedStyle(() => ({
    flex: 1,
    opacity: interpolate(expandProgress.value, [0.6, 0], [0, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(expandProgress.value, [0, 1], [0, 50], Extrapolation.CLAMP) },
    ],
  }))
  const monthBodyStyle = useAnimatedStyle(() => {
    const isMonthState = expandProgress.value > 0.99
    return {
      opacity: isMonthState ? 1 : 0,
      zIndex: isMonthState ? 1 : -1,
      transform: [{ translateX: isMonthState ? 0 : 9999 }],
    }
  })
  const transitionViewStyle = useAnimatedStyle(() => ({
    opacity: expandProgress.value <= 0.99 && expandProgress.value > 0 ? 1 : 0,
    zIndex: 10,
  }))
  const bodySlideStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          expandProgress.value,
          [0, 1],
          [WEEK_MODE_HEIGHT, MONTH_CONTENT_HEIGHT],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }))
  const allDayRowStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    top: WEEK_MODE_HEIGHT,
    left: 0,
    right: 0,
    zIndex: 20,
  }))

  return (
    <Animated.View
      style={[
        styles.standardContainer,
        StyleSheet.absoluteFill,
        style,
        { backgroundColor: 'white' },
      ]}
      pointerEvents={pointerEvents}>
      <WeekViewProvider
        selectedDate={selectedDateStr}
        onDateSelect={handleDayPress}
        onEventPress={onEventPress}
        onHeaderBackPress={() => {}}
        areEventsVisible={areEventsVisible}>
        <View style={styles.standardContainer}>
          <CalendarHeader
            mode={viewMode} // ✨ 传入当前模式
            currentDate={selectedDate}
            onGoBack={handleHeaderBack}
            onTitlePress={handleTitlePress}
            onAddEvent={onAddEvent}
            expandProgress={expandProgress}
          />

          <View style={styles.contentContainer}>
            <Animated.View style={[styles.calendarWrapper, containerStyle]}>
              <Animated.View style={[StyleSheet.absoluteFill, monthBodyStyle]}>
                <MonthBody
                  selectedDate={selectedDateStr}
                  onDateSelect={handleDayPress}
                  onPageChange={handleMonthPageChange}
                  rowHeight={dynamicMonthRowHeight}
                />
              </Animated.View>

              <Animated.View style={[StyleSheet.absoluteFill, transitionViewStyle]}>
                <TransitionMonthView
                  currentDate={selectedDate}
                  selectedDate={selectedDateStr}
                  expandProgress={expandProgress}
                  monthRowHeight={dynamicMonthRowHeight}
                  weekRowHeight={WEEK_MODE_HEIGHT}
                  visualOffsetY={visualOffsetY}
                />
              </Animated.View>

              <Animated.View style={[StyleSheet.absoluteFill, weekHeaderStyle]}>
                <WeekDateHeader />
              </Animated.View>
            </Animated.View>

            <Animated.View style={allDayRowStyle}>
              <AnimatedWeekAllDayRow expandProgress={expandProgress} />
            </Animated.View>

            <Animated.View style={[styles.bodyContainer, bodySlideStyle]}>
              {viewMode === 'month' ? (
                <View style={{ flex: 1, backgroundColor: 'white' }} />
              ) : (
                <Animated.View style={[StyleSheet.absoluteFill, weekBodyFadeStyle]}>
                  <WeekGridPart />
                </Animated.View>
              )}
            </Animated.View>
          </View>
        </View>
      </WeekViewProvider>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  standardContainer: { flex: 1 },
  contentContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  calendarWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  bodyContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 10,
  },
})
