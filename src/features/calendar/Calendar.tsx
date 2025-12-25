import React, { useState, useMemo, useEffect, useRef } from 'react'
import { View, StyleSheet, useWindowDimensions } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated'
import { startOfMonth, getDay, format, isSameMonth } from 'date-fns'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { CalendarHeader } from './components/CalendarHeader'
import { MonthBody } from './components/MonthBody'
import { WeekDateHeader, AnimatedWeekAllDayRow, WeekGridPart } from './components/WeekBody'
import { YearView } from './views/YearView'
import { WeekViewProvider } from './views/WeekView/WeekViewContext'
import { CALENDAR_ROW_HEIGHT, WEEK_MODE_HEIGHT, MONTH_HEADER_HEIGHT } from './constants'
import { MONTH_TITLE_HEIGHT } from './components/MonthGrid'
import { TransitionMonthView } from './components/TransitionMonthView'
import { CalendarProps } from '../../types/event'

const getRowIndex = (date: Date | string | number): number => {
  // 1. 强制转为 Date 对象 (防止传入的是 string 或 timestamp)
  const d = new Date(date)

  // 2. 安全检查：如果是无效日期，返回 0 防止崩溃
  if (isNaN(d.getTime())) {
    return 0
  }

  const monthStart = startOfMonth(d)
  const startDay = getDay(monthStart)
  const offsetStartDay = startDay === 0 ? 6 : startDay - 1

  // 3. 现在可以安全调用 .getDate() 了
  const dayOfMonth = d.getDate()

  return Math.floor((offsetStartDay + dayOfMonth - 1) / 7)
}

export const Calendar: React.FC<CalendarProps> = props => {
  const insets = useSafeAreaInsets()
  const { height: SCREEN_HEIGHT } = useWindowDimensions()

  // 动态行高度计算
  const dynamicMonthRowHeight = useMemo(() => {
    const availableSpace =
      SCREEN_HEIGHT -
      insets.top -
      MONTH_HEADER_HEIGHT -
      insets.bottom -
      20 - // bottom padding
      MONTH_TITLE_HEIGHT // 每个月内部还有一个标题

    // 分成 6 行
    const rowHeight = availableSpace / 6

    // 兜底：不能比周视图还矮，否则动画逻辑会崩
    return Math.max(rowHeight, WEEK_MODE_HEIGHT)
  }, [SCREEN_HEIGHT, insets.top, insets.bottom])

  // 月视图的总内容高度 (用于容器动画)
  const MONTH_CONTENT_HEIGHT = dynamicMonthRowHeight * 6 + MONTH_TITLE_HEIGHT + 20

  // 修正位移计算公式
  const rowIndex = useMemo(() => getRowIndex(selectedDate), [selectedDate])

  // 目标位移：负的 (当前行数 * 动态行高 + 月份内部标题)
  const targetOffsetY = -(rowIndex * dynamicMonthRowHeight) - MONTH_TITLE_HEIGHT

  const [rootMode, setRootMode] = useState<'year' | 'standard'>('standard')
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')

  // 控制复杂日程组件显示（懒加载标志）
  const [areEventsVisible, setAreEventsVisible] = useState(false)

  // 记录点击时的视觉垂直偏移量
  const [visualOffsetY, setVisualOffsetY] = useState(0)

  const [selectedDate, setSelectedDate] = useState(() => {
    return props.initialDate ? new Date(props.initialDate) : new Date()
  })
  const selectedDateStr = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate])

  // 记录上一次选中的月份，用于检测周视图下的跨月行为
  const lastSelectedMonthRef = useRef(selectedDate)

  const expandProgress = useSharedValue(1)

  // 动画效果配置
  const toggleMode = (target: 'week' | 'month') => {
    'worklet'
    // 1. 如果是切回月视图，立即隐藏日程，让收缩动画更流畅
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
        // 2. 如果是切换到周视图，且动画完成，再显示日程
        if (finished && target === 'week') {
          runOnJS(setAreEventsVisible)(true)
        }
      },
    )
  }

  useEffect(() => {
    toggleMode(viewMode)
  }, [viewMode])

  // 跨月保护：如果在 Week 视图里翻页到了新月份，MonthBody 肯定会滚到该月顶部
  useEffect(() => {
    if (viewMode === 'week') {
      if (!isSameMonth(selectedDate, lastSelectedMonthRef.current)) {
        setVisualOffsetY(0)
      }
    }
    lastSelectedMonthRef.current = selectedDate
  }, [selectedDate, viewMode])

  // 容器高度
  const containerStyle = useAnimatedStyle(() => ({
    // height: interpolate(
    //   expandProgress.value,
    //   [0, 1],
    //   [WEEK_MODE_HEIGHT, MONTH_CONTENT_HEIGHT],
    //   Extrapolation.CLAMP,
    // ),
    // overflow: 'hidden',
    height: MONTH_CONTENT_HEIGHT, // 始终保持最大高度
    overflow: 'hidden',
    zIndex: 1,
  }))

  // WeekHeader 显隐
  const weekHeaderStyle = useAnimatedStyle(() => ({
    opacity: expandProgress.value < 0.01 ? 1 : 0,
    zIndex: expandProgress.value < 0.01 ? 20 : -1,
    transform: [{ translateY: 0 }], // 确保位置归零
  }))

  // 时间轴网络部分 动画
  const weekBodyFadeStyle = useAnimatedStyle(() => ({
    flex: 1,
    opacity: interpolate(expandProgress.value, [0.6, 0], [0, 1], Extrapolation.CLAMP),

    transform: [
      {
        translateY: interpolate(expandProgress.value, [0, 1], [0, 50], Extrapolation.CLAMP),
      },
    ],
  }))

  // 月份 body 动画
  const monthBodyStyle = useAnimatedStyle(() => {
    const isMonthState = expandProgress.value > 0.99
    return {
      opacity: isMonthState ? 1 : 0,
      zIndex: isMonthState ? 1 : -1,
      // ✨ 优化：彻底移走，确保 GPU 不渲染它
      transform: [{ translateX: isMonthState ? 0 : 9999 }],
    }
  })

  // 替身动画
  const transitionViewStyle = useAnimatedStyle(() => ({
    // 动画期间显示，Month模式和Week模式都隐藏
    opacity: expandProgress.value <= 0.99 && expandProgress.value > 0 ? 1 : 0,
    zIndex: 10,
  }))

  const bodySlideStyle = useAnimatedStyle(() => {
    return {
      // 移除 flex: 1，因为已经是 absolute + bottom: 0 了
      // flex: 1,
      transform: [
        {
          translateY: interpolate(
            expandProgress.value,
            [0, 1],
            // 0 (Week): Body 下移到 52px (只露出周标题)
            // 1 (Month): Body 下移到 400px+ (露出整个月视图)
            [WEEK_MODE_HEIGHT, MONTH_CONTENT_HEIGHT],
            Extrapolation.CLAMP,
          ),
        },
      ],
    }
  })

  const allDayRowStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    top: WEEK_MODE_HEIGHT,
    left: 0,
    right: 0,
    zIndex: 20,
  }))

  // 选中日期点击操作
  const handleDayPress = (dateStr: string, visualY?: number) => {
    const date = new Date(dateStr)
    setSelectedDate(date)

    if (visualY !== undefined) {
      setVisualOffsetY(visualY)
    } else {
      setVisualOffsetY(0)
    }

    if (viewMode === 'month') {
      setViewMode('week')
    }
  }

  // 返回按钮操作
  const handleHeaderBack = () => {
    if (viewMode === 'week') {
      setVisualOffsetY(0)
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
    setVisualOffsetY(0)
  }
  const handleTitlePress = () => {
    if (viewMode === 'month') setRootMode('year')
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
          onHeaderBackPress={() => {}}
          areEventsVisible={areEventsVisible}>
          <View style={styles.standardContainer}>
            <CalendarHeader
              mode={viewMode}
              currentDate={selectedDate}
              onGoBack={handleHeaderBack}
              onTitlePress={handleTitlePress}
              onAddEvent={props.onAddEventPress}
              expandProgress={expandProgress}
            />

            <View style={styles.contentContainer}>
              {/* 动画容器 */}
              <Animated.View style={[styles.calendarWrapper, containerStyle]}>
                {/* Layer 1: MonthBody (负责动画过程中的视觉) */}
                <Animated.View style={[StyleSheet.absoluteFill, monthBodyStyle]}>
                  <MonthBody
                    selectedDate={selectedDateStr}
                    onDateSelect={handleDayPress}
                    onPageChange={() => {}}
                    rowHeight={dynamicMonthRowHeight}
                  />
                </Animated.View>

                {/* Layer 2: WeekDateHeader (动画替身) */}
                {/* 分裂动画 */}
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
                {/* Layer 3: WeekDateHeader (最终形态) */}
                <Animated.View style={[StyleSheet.absoluteFill, weekHeaderStyle]}>
                  <WeekDateHeader />
                </Animated.View>
              </Animated.View>

              {/* 全天行动画组件 */}
              <Animated.View style={allDayRowStyle}>
                <AnimatedWeekAllDayRow expandProgress={expandProgress} />
              </Animated.View>

              {/* 底部内容 */}
              {/* <View style={styles.bodyContainer}>
              {viewMode === 'month' ? (
                <View style={{ flex: 1, backgroundColor: 'white' }} />
              ) : (
                <Animated.View style={[StyleSheet.absoluteFill, weekBodyFadeStyle]}>
                  <WeekGridPart />
                </Animated.View>
              )}
            </View> */}
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
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  standardContainer: { flex: 1 },
  contentContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  calendarWrapper: {
    // 绝对定位，不再占据流空间
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    // zIndex 低
    zIndex: 1,
    // 阴影
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    // elevation: 4,
    // width: '100%',
    // backgroundColor: 'white',
    // zIndex: 1,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.05,
    // shadowRadius: 4,
    // elevation: 4,
  },
  bodyContainer: {
    // 绝对定位，强制占满父容器
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0, // 确保高度足够，不会出现下方空白
    backgroundColor: '#fff',
    // zIndex 高，确保能盖住 calendarWrapper
    zIndex: 10,
    // flex: 1,
    // backgroundColor: '#fff',
    // zIndex: 10,
  },
})
