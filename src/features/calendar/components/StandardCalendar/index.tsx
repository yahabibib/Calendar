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
import { LayoutRect } from '../MiniMonthGrid'
import { CalendarEvent } from '../../../../types/event'

interface StandardCalendarProps {
  // 数据
  selectedDate: Date
  events: CalendarEvent[]

  // 回调
  onSelectDate: (date: Date) => void
  onAddEvent: () => void
  onEventPress: (event: CalendarEvent) => void

  // ✨ 关键交互：请求返回年视图
  onRequestGoToYear: () => void

  // ✨ 样式注入：接收父组件传来的“扩散/缩放动画”样式
  style?: StyleProp<ViewStyle>

  // 交互控制
  pointerEvents?: 'box-none' | 'none' | 'auto'
}

export const StandardCalendar: React.FC<StandardCalendarProps> = ({
  selectedDate,
  events,
  onSelectDate,
  onAddEvent,
  onEventPress,
  onRequestGoToYear,
  style,
  pointerEvents,
}) => {
  // ------------------------------------------------------------------
  // 1. 布局层 (从 Calendar.tsx 移植)
  // ------------------------------------------------------------------
  const { dynamicMonthRowHeight, MONTH_CONTENT_HEIGHT, WEEK_MODE_HEIGHT } = useCalendarLayout()

  // ------------------------------------------------------------------
  // 2. 状态层 (从 Calendar.tsx 移植)
  // ------------------------------------------------------------------
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [areEventsVisible, setAreEventsVisible] = useState(false) // 懒加载标志
  const [visualOffsetY, setVisualOffsetY] = useState(0) // 视觉偏移

  const selectedDateStr = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate])
  const lastSelectedMonthRef = useRef(selectedDate)

  // 动画值：1=Month, 0=Week
  const expandProgress = useSharedValue(1)

  // ------------------------------------------------------------------
  // 3. 逻辑层 (移植 toggleMode)
  // ------------------------------------------------------------------
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

  // 监听 viewMode 变化驱动动画
  useEffect(() => {
    toggleMode(viewMode)
  }, [viewMode, toggleMode])

  // 跨月保护逻辑
  useEffect(() => {
    if (viewMode === 'week') {
      if (!isSameMonth(selectedDate, lastSelectedMonthRef.current)) {
        setVisualOffsetY(0)
      }
    }
    lastSelectedMonthRef.current = selectedDate
  }, [selectedDate, viewMode])

  // ✨ 物理返回键逻辑 (移植并适配)
  // 这里直接接管了 Week -> Month 的返回，如果是 Month 则请求父级切到 Year
  useEffect(() => {
    const backAction = () => {
      if (viewMode === 'week') {
        handleHeaderBack()
        return true
      }
      // 如果是 Month 视图，通知父组件切回 Year
      onRequestGoToYear()
      return true
    }
    // 注意：这里需要确认是否只有 Standard 模式显示时才注册，或者父组件控制渲染
    // 假设 StandardCalendar 只在 rootMode='standard' 时挂载或 pointerEvents='auto'
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction)
    return () => backHandler.remove()
  }, [viewMode, onRequestGoToYear])

  // ------------------------------------------------------------------
  // 4. 交互处理
  // ------------------------------------------------------------------
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

  // ------------------------------------------------------------------
  // 5. 动画样式 (全部从 Calendar.tsx 一比一移植)
  // ------------------------------------------------------------------

  // 容器高度动画
  const containerStyle = useAnimatedStyle(() => ({
    height: MONTH_CONTENT_HEIGHT, // 保持最大高度，内容通过 mask 裁剪
    overflow: 'hidden',
    zIndex: 1,
  }))

  // WeekHeader 显隐
  const weekHeaderStyle = useAnimatedStyle(() => ({
    opacity: expandProgress.value < 0.01 ? 1 : 0,
    zIndex: expandProgress.value < 0.01 ? 20 : -1,
    transform: [{ translateY: 0 }],
  }))

  // 周视图网格 Fade
  const weekBodyFadeStyle = useAnimatedStyle(() => ({
    flex: 1,
    opacity: interpolate(expandProgress.value, [0.6, 0], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(expandProgress.value, [0, 1], [0, 50], Extrapolation.CLAMP),
      },
    ],
  }))

  // MonthBody 显隐
  const monthBodyStyle = useAnimatedStyle(() => {
    const isMonthState = expandProgress.value > 0.99
    return {
      opacity: isMonthState ? 1 : 0,
      zIndex: isMonthState ? 1 : -1,
      transform: [{ translateX: isMonthState ? 0 : 9999 }],
    }
  })

  // 替身显隐
  const transitionViewStyle = useAnimatedStyle(() => ({
    opacity: expandProgress.value <= 0.99 && expandProgress.value > 0 ? 1 : 0,
    zIndex: 10,
  }))

  // Body 滑动动画
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

  // 全天行位置
  const allDayRowStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    top: WEEK_MODE_HEIGHT,
    left: 0,
    right: 0,
    zIndex: 20,
  }))

  // ------------------------------------------------------------------
  // 6. 渲染
  // ------------------------------------------------------------------
  return (
    <Animated.View
      style={[
        styles.standardContainer,
        StyleSheet.absoluteFill, // 强制全屏覆盖
        style, // ✨ 接收父组件的 Scale/Translate 动画
        { backgroundColor: 'white' },
      ]}
      pointerEvents={pointerEvents}>
      <WeekViewProvider
        selectedDate={selectedDateStr}
        onDateSelect={handleDayPress}
        onEventPress={onEventPress}
        onHeaderBackPress={() => {}} // 内部 Header 已处理
        areEventsVisible={areEventsVisible}>
        <View style={styles.standardContainer}>
          {/* Header */}
          <CalendarHeader
            mode={viewMode}
            currentDate={selectedDate}
            onGoBack={handleHeaderBack}
            onTitlePress={handleTitlePress}
            onAddEvent={onAddEvent}
            expandProgress={expandProgress}
          />

          <View style={styles.contentContainer}>
            {/* 月视图容器 */}
            <Animated.View style={[styles.calendarWrapper, containerStyle]}>
              {/* Layer 1: MonthBody */}
              <Animated.View style={[StyleSheet.absoluteFill, monthBodyStyle]}>
                <MonthBody
                  selectedDate={selectedDateStr}
                  onDateSelect={handleDayPress}
                  onPageChange={() => {}}
                  rowHeight={dynamicMonthRowHeight}
                />
              </Animated.View>

              {/* Layer 2: Transition View */}
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

              {/* Layer 3: Week Header */}
              <Animated.View style={[StyleSheet.absoluteFill, weekHeaderStyle]}>
                <WeekDateHeader />
              </Animated.View>
            </Animated.View>

            {/* 周视图容器 */}
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
