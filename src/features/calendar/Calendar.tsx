import React, { useState, useMemo, useEffect, useRef } from 'react'
import { View, StyleSheet, useWindowDimensions, BackHandler } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { startOfMonth, getDay, format, isSameMonth } from 'date-fns'
import { CalendarHeader } from './components/CalendarHeader'
import { MonthBody } from './components/MonthBody'
import { WeekDateHeader, AnimatedWeekAllDayRow, WeekGridPart } from './components/WeekBody'
import { YearView } from './views/YearView'
import { WeekViewProvider } from './views/WeekView/WeekViewContext'
import { TransitionMonthView } from './components/TransitionMonthView'
import { CalendarProps } from '../../types/event'
import { LayoutRect } from './components/MiniMonthGrid'
import { useCalendarLayout } from './hooks/useCalendarLayout'
import { StandardCalendar } from './components/StandardCalendar'

// 默认空坐标
const DEFAULT_RECT: LayoutRect = { x: 0, y: 0, width: 0, height: 0 }

// 计算给定日期在当月日历网格中位于第几行
const getRowIndex = (date: Date | string | number): number => {
  // 强制转为 Date 对象
  const d = new Date(date)

  // 兜底
  if (isNaN(d.getTime())) {
    return 0
  }

  const monthStart = startOfMonth(d)
  const startDay = getDay(monthStart)
  const offsetStartDay = startDay === 0 ? 6 : startDay - 1
  const dayOfMonth = d.getDate()

  return Math.floor((offsetStartDay + dayOfMonth - 1) / 7)
}

export const Calendar: React.FC<CalendarProps> = props => {
  // 布局配置
  const {
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    insets,
    dynamicMonthRowHeight,
    MONTH_CONTENT_HEIGHT,
    WEEK_MODE_HEIGHT,
  } = useCalendarLayout()

  // 视图模型切换
  const [rootMode, setRootMode] = useState<'year' | 'standard'>('standard')
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  // 控制复杂日程组件显示（懒加载标志）
  const [areEventsVisible, setAreEventsVisible] = useState(false)
  // 记录点击时的视觉垂直偏移量
  const [visualOffsetY, setVisualOffsetY] = useState(0)
  // 选中日期
  const [selectedDate, setSelectedDate] = useState(() => {
    return props.initialDate ? new Date(props.initialDate) : new Date()
  })
  // 记录点击来源坐标 (用于 Ghost View 扩散动画)
  const [sourceRect, setSourceRect] = useState<LayoutRect>(DEFAULT_RECT)

  // 选中日期字格式化
  const selectedDateStr = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate])
  // 记录上一次选中的月份，用于检测周视图下的跨月行为
  const lastSelectedMonthRef = useRef(selectedDate)
  // 月周动画进程: 0-月视图、1-周视图
  const expandProgress = useSharedValue(1)
  // 年月动画进程：0-年视图、1-月视图
  const yearTransitionVal = useSharedValue(rootMode === 'year' ? 0 : 1)

  // 动画效果配置
  const toggleMode = (target: 'week' | 'month') => {
    'worklet'
    // 如果是切回月视图，立即隐藏日程，让收缩动画更流畅
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
        // 如果是切换到周视图，且动画完成，再显示日程
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

  // 监听物理返回键 (Android)
  useEffect(() => {
    const backAction = () => {
      if (rootMode === 'standard') {
        if (viewMode === 'week') {
          handleHeaderBack() // 切回月
          return true
        }
        // 月 -> 年
        handleBackToYear()
        return true
      }
      return false
    }
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction)
    return () => backHandler.remove()
  }, [rootMode, viewMode])

  const handleYearSelect = (date: Date, layout: LayoutRect) => {
    // 1. 锁定数据
    setSourceRect(layout)
    setSelectedDate(date)

    // 2. 准备动画状态
    // 先重置为 0 (小格子状态)
    yearTransitionVal.value = 0

    // 3. 切换模式，让 StandardView 挂载 (此时它通过样式被缩放成了小格子)
    setRootMode('standard')
    setViewMode('month')
    // 确保 Month->Week 的动画处于 Month 状态
    expandProgress.value = 1
    setAreEventsVisible(true) // 月视图直接显示日程，或者可以等动画结束

    // 4. 执行扩散动画 (Spring)
    yearTransitionVal.value = withSpring(1, {
      mass: 0.6,
      damping: 15,
      stiffness: 120,
      overshootClamping: false,
    })
  }

  const handleBackToYear = () => {
    // 逆向动画：从全屏 (1) 缩回小格子 (0)
    // ⚠️ 注意：这里有一个逻辑难点，sourceRect 还是上次点击的位置。
    // 如果用户在月视图翻页了，sourceRect 其实应该更新为新月份在年视图的位置。
    // 但为了简化 MVP，我们先缩回原处，或者缩回到屏幕中心淡出。
    // 调研报告建议：简单淡出即可，或者回到原位。

    yearTransitionVal.value = withTiming(
      0,
      {
        duration: 350,
        easing: Easing.out(Easing.exp),
      },
      finished => {
        if (finished) {
          runOnJS(setRootMode)('year')
        }
      },
    )
  }

  // 扩散样式
  const animatedTransitionStyle = useAnimatedStyle(() => {
    // 保护：如果没有 sourceRect，就不要缩放，直接显示（避免首次加载闪烁）
    if (sourceRect.width === 0 && rootMode === 'standard')
      return { opacity: 1, transform: [{ scale: 1 }] }

    // 1. 计算缩放比例 (宽度比)
    const scale = sourceRect.width / SCREEN_WIDTH

    // 2. 计算位移 (Translate)
    // 目标中心点 (小格子中心)
    const targetCenterX = sourceRect.x + sourceRect.width / 2
    const targetCenterY = sourceRect.y + sourceRect.height / 2

    // 屏幕中心点
    const screenCenterX = SCREEN_WIDTH / 2
    const screenCenterY = SCREEN_HEIGHT / 2

    // 偏移量
    const translateX = targetCenterX - screenCenterX
    const translateY = targetCenterY - screenCenterY

    // 3. 插值
    const animScale = interpolate(yearTransitionVal.value, [0, 1], [scale, 1])
    const animTranslateX = interpolate(yearTransitionVal.value, [0, 1], [translateX, 0])
    const animTranslateY = interpolate(yearTransitionVal.value, [0, 1], [translateY, 0])
    // 透明度：快速浮现，模仿 iOS
    const animOpacity = interpolate(yearTransitionVal.value, [0, 0.1, 1], [0, 1, 1])
    // 圆角：从小格子的圆角变直角 (可选)
    const animRadius = interpolate(yearTransitionVal.value, [0, 1], [10, 0])

    return {
      transform: [
        { translateX: animTranslateX },
        { translateY: animTranslateY },
        { scale: animScale },
      ],
      opacity: animOpacity,
      borderRadius: animRadius,
      overflow: 'hidden', // 确保圆角生效
    }
  })

  // 整体月视图动画
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
      transform: [{ translateX: isMonthState ? 0 : 9999 }],
    }
  })

  // 替身动画
  const transitionViewStyle = useAnimatedStyle(() => ({
    // 动画期间显示，Month模式和Week模式都隐藏
    opacity: expandProgress.value <= 0.99 && expandProgress.value > 0 ? 1 : 0,
    zIndex: 10,
  }))

  // week网格 动画
  const bodySlideStyle = useAnimatedStyle(() => {
    return {
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

  // 全天行 动画
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
    // 记录点击位置的视觉偏移，用于 TransitionView 动画对齐
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
      // setRootMode('year')
      handleBackToYear()
    }
  }
  const handleTitlePress = () => {
    if (viewMode === 'month') handleBackToYear()
  }

  return (
    <View style={styles.container}>
      {/* Layer A: YearView (永远在底部) */}
      {/* 优化：当 Standard 模式且动画完全结束(1)时，可以隐藏 YearView 以减少重绘，但为了简单先留着 */}
      <View style={StyleSheet.absoluteFill}>
        <YearView currentYear={selectedDate} onMonthSelect={handleYearSelect} />
      </View>
      {/* 年视图 */}
      {/* {rootMode === 'year' ? (
        <YearView currentYear={selectedDate} onMonthSelect={handleYearSelect} />
      ) : ( */}
      {rootMode === 'standard' && (
        <StandardCalendar
          // ✨ 核心：传入动画样式，StandardCalendar 内部会应用到它的根 View 上
          style={animatedTransitionStyle}
          // 数据
          selectedDate={selectedDate}
          events={props.events}
          // 回调
          onSelectDate={setSelectedDate}
          onAddEvent={props.onAddEventPress}
          onEventPress={props.onEventPress}
          onRequestGoToYear={handleBackToYear} // 子组件请求返回年视图
          // 交互控制 (可选)
          pointerEvents="auto"
        />
        // <Animated.View
        //   style={[
        //     styles.standardContainer,
        //     StyleSheet.absoluteFill, // 强制全屏覆盖
        //     animatedTransitionStyle, // ✨ 施加扩散/缩放动画
        //     { backgroundColor: 'white' }, // 确保背景不透明，遮住下面的 YearView
        //   ]}>
        //   <WeekViewProvider
        //     selectedDate={selectedDateStr}
        //     onDateSelect={handleDayPress}
        //     onEventPress={props.onEventPress}
        //     onHeaderBackPress={() => {}}
        //     areEventsVisible={areEventsVisible}>
        //     <View style={styles.standardContainer}>
        //       {/* 公共 Header */}
        //       <CalendarHeader
        //         mode={viewMode}
        //         currentDate={selectedDate}
        //         onGoBack={handleHeaderBack}
        //         onTitlePress={handleTitlePress}
        //         onAddEvent={props.onAddEventPress}
        //         expandProgress={expandProgress}
        //       />
        //       <View style={styles.contentContainer}>
        //         {/* 月视图部分 */}
        //         <Animated.View style={[styles.calendarWrapper, containerStyle]}>
        //           {/* Layer 1: MonthBody (负责动画过程中的视觉) */}
        //           <Animated.View style={[StyleSheet.absoluteFill, monthBodyStyle]}>
        //             <MonthBody
        //               selectedDate={selectedDateStr}
        //               onDateSelect={handleDayPress}
        //               onPageChange={() => {}}
        //               rowHeight={dynamicMonthRowHeight}
        //             />
        //           </Animated.View>
        //           {/* Layer 2: WeekDateHeader (动画替身) */}
        //           {/* 分裂动画 */}
        //           <Animated.View style={[StyleSheet.absoluteFill, transitionViewStyle]}>
        //             <TransitionMonthView
        //               currentDate={selectedDate}
        //               selectedDate={selectedDateStr}
        //               expandProgress={expandProgress}
        //               monthRowHeight={dynamicMonthRowHeight}
        //               weekRowHeight={WEEK_MODE_HEIGHT}
        //               visualOffsetY={visualOffsetY}
        //             />
        //           </Animated.View>
        //           {/* Layer 3: WeekDateHeader (最终形态) */}
        //           <Animated.View style={[StyleSheet.absoluteFill, weekHeaderStyle]}>
        //             <WeekDateHeader />
        //           </Animated.View>
        //         </Animated.View>

        //         {/* 周视图部分 */}
        //         {/* 全天行动画组件 */}
        //         <Animated.View style={allDayRowStyle}>
        //           <AnimatedWeekAllDayRow expandProgress={expandProgress} />
        //         </Animated.View>

        //         {/* 日程网格 */}
        //         <Animated.View style={[styles.bodyContainer, bodySlideStyle]}>
        //           {viewMode === 'month' ? (
        //             <View style={{ flex: 1, backgroundColor: 'white' }} />
        //           ) : (
        //             <Animated.View style={[StyleSheet.absoluteFill, weekBodyFadeStyle]}>
        //               <WeekGridPart />
        //             </Animated.View>
        //           )}
        //         </Animated.View>
        //       </View>
        //     </View>
        //   </WeekViewProvider>
        // </Animated.View>
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
  },
})
