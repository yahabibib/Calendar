import React, { useState, useEffect } from 'react'
import { View, StyleSheet, BackHandler } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  Easing,
} from 'react-native-reanimated'
import { YearView } from './views/YearView'
import { StandardCalendar } from './components/StandardCalendar' // ✅ 只有这一个子组件
import { CalendarProps } from '../../types/event'
import { LayoutRect } from './components/MiniMonthGrid'
import { useCalendarLayout } from './hooks/useCalendarLayout'

const DEFAULT_RECT: LayoutRect = { x: 0, y: 0, width: 0, height: 0 }

export const Calendar: React.FC<CalendarProps> = props => {
  // ✅ 1. 布局：使用 Hook
  const { SCREEN_WIDTH, SCREEN_HEIGHT } = useCalendarLayout()

  // ✅ 2. 状态：只保留路由状态
  const [rootMode, setRootMode] = useState<'year' | 'standard'>('standard')
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')

  const [selectedDate, setSelectedDate] = useState(() => {
    return props.initialDate ? new Date(props.initialDate) : new Date()
  })

  // 扩散动画起点
  const [sourceRect, setSourceRect] = useState<LayoutRect>(DEFAULT_RECT)

  // 年月动画进程
  const yearTransitionVal = useSharedValue(rootMode === 'year' ? 0 : 1)

  // ✅ 3. 交互：物理返回键
  const handleHeaderBack = () => {
    if (viewMode === 'week') {
      setViewMode('month')
    } else {
      handleBackToYear()
    }
  }

  useEffect(() => {
    const backAction = () => {
      if (rootMode === 'standard') {
        if (viewMode === 'week') {
          handleHeaderBack()
          return true
        }
        handleBackToYear()
        return true
      }
      return false
    }
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction)
    return () => backHandler.remove()
  }, [rootMode, viewMode])

  // ✅ 4. 逻辑：年视图切换
  const handleYearSelect = (date: Date, layout: LayoutRect) => {
    setSourceRect(layout)
    setSelectedDate(date)
    yearTransitionVal.value = 0
    setRootMode('standard')
    setViewMode('month') // 确保进入时是月视图

    yearTransitionVal.value = withSpring(1, {
      mass: 0.6,
      damping: 15,
      stiffness: 120,
      overshootClamping: false,
    })
  }

  const handleBackToYear = () => {
    yearTransitionVal.value = withTiming(
      0,
      { duration: 350, easing: Easing.out(Easing.exp) },
      finished => {
        if (finished) runOnJS(setRootMode)('year')
      },
    )
  }

  // ✅ 5. 动画：扩散样式 (Style Injection)
  const animatedTransitionStyle = useAnimatedStyle(() => {
    if (sourceRect.width === 0 && rootMode === 'standard')
      return { opacity: 1, transform: [{ scale: 1 }] }

    const scale = sourceRect.width / SCREEN_WIDTH
    const targetCenterX = sourceRect.x + sourceRect.width / 2
    const targetCenterY = sourceRect.y + sourceRect.height / 2
    const screenCenterX = SCREEN_WIDTH / 2
    const screenCenterY = SCREEN_HEIGHT / 2

    const animScale = interpolate(yearTransitionVal.value, [0, 1], [scale, 1])
    const animTranslateX = interpolate(
      yearTransitionVal.value,
      [0, 1],
      [targetCenterX - screenCenterX, 0],
    )
    const animTranslateY = interpolate(
      yearTransitionVal.value,
      [0, 1],
      [targetCenterY - screenCenterY, 0],
    )
    const animOpacity = interpolate(yearTransitionVal.value, [0, 0.1, 1], [0, 1, 1])
    const animRadius = interpolate(yearTransitionVal.value, [0, 1], [10, 0])

    return {
      transform: [
        { translateX: animTranslateX },
        { translateY: animTranslateY },
        { scale: animScale },
      ],
      opacity: animOpacity,
      borderRadius: animRadius,
      overflow: 'hidden',
    }
  })

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
        <YearView currentYear={selectedDate} onMonthSelect={handleYearSelect} />
      </View>

      {rootMode === 'standard' && (
        <StandardCalendar
          style={animatedTransitionStyle}
          selectedDate={selectedDate}
          events={props.events}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onSelectDate={setSelectedDate}
          onAddEvent={props.onAddEventPress}
          onEventPress={props.onEventPress}
          onRequestGoToYear={handleBackToYear}
          pointerEvents="auto"
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
})
