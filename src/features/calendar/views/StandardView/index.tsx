import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated'
import { format, isSameMonth } from 'date-fns'
import { CalendarHeader } from '../../components/CalendarHeader'
import { MonthBody } from './components/Month/MonthBody'
import { WeekDateHeader, AnimatedWeekAllDayRow, WeekGridPart } from './components/Week/WeekBody'
import { TransitionMonthView } from './components/Month/TransitionMonthView'
import { WeekViewProvider } from './components/Week/WeekViewContext'
import { useCalendarLayout } from '../../hooks/useCalendarLayout'
import { CalendarEvent } from '../../../../types/event'

interface StandardCalendarProps {
  // 数据
  selectedDate: Date
  events: CalendarEvent[]

  // 接收父组件的状态
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
  viewMode,
  setViewMode,
  onSelectDate,
  onAddEvent,
  onEventPress,
  onRequestGoToYear,
  style,
  pointerEvents,
}) => {
  const { dynamicMonthRowHeight, MONTH_CONTENT_HEIGHT, WEEK_MODE_HEIGHT } = useCalendarLayout()

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

  // 交互处理
  const handleDayPress = (dateStr: string, visualY?: number) => {
    onSelectDate(new Date(dateStr))
    if (visualY !== undefined) {
      setVisualOffsetY(visualY)
    } else {
      setVisualOffsetY(0)
    }
    if (viewMode === 'month') {
      setViewMode('week')
    }
  }

  const handleHeaderBack = () => {
    if (viewMode === 'week') {
      setVisualOffsetY(0)
      setViewMode('month')
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

  // 动画样式
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
          {/* 公共头部 */}
          <CalendarHeader
            mode={viewMode}
            currentDate={selectedDate}
            onGoBack={handleHeaderBack}
            onTitlePress={handleTitlePress}
            onAddEvent={onAddEvent}
            expandProgress={expandProgress}
          />
          <View style={styles.contentContainer}>
            {/* 月视图 */}
            <Animated.View style={[styles.calendarWrapper, containerStyle]}>
              {/* 真正月视图 */}
              <Animated.View style={[StyleSheet.absoluteFill, monthBodyStyle]}>
                <MonthBody
                  selectedDate={selectedDateStr}
                  onDateSelect={handleDayPress}
                  onPageChange={handleMonthPageChange}
                  rowHeight={dynamicMonthRowHeight}
                />
              </Animated.View>
              {/* 替身月视图 */}
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
              {/* 真正替换的周视图头部组件 */}
              <Animated.View style={[StyleSheet.absoluteFill, weekHeaderStyle]}>
                <WeekDateHeader />
              </Animated.View>
            </Animated.View>
            {/* 周视图全天组件 */}
            <Animated.View style={allDayRowStyle}>
              <AnimatedWeekAllDayRow expandProgress={expandProgress} />
            </Animated.View>
            {/* 周视图日程网格组件 */}
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
