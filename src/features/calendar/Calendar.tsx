import React, { useState, useEffect } from 'react'
import { View, StyleSheet, BackHandler } from 'react-native'
import { useCalendarLayout } from './hooks/useCalendarLayout'
import { useYearTransition } from './hooks/useYearTransition'
import { YearView } from './views/YearView'
import { StandardCalendar } from './views/StandardView'
import { CalendarEvent } from '../../types/event'
import { LayoutRect } from './views/YearView/components/MiniMonthGrid'

export interface CalendarProps {
  // 初始选中的日期
  initialDate?: string | Date
  // 日程列表
  events: CalendarEvent[]
  onAddEventPress: () => void
  onEventPress: (event: CalendarEvent) => void
  // 初始视图模式
  mode?: 'month' | 'week'
}

const DEFAULT_RECT: LayoutRect = { x: 0, y: 0, width: 0, height: 0 }

export const Calendar: React.FC<CalendarProps> = props => {
  // 布局层
  const { SCREEN_WIDTH, SCREEN_HEIGHT } = useCalendarLayout()

  // 状态层
  const [rootMode, setRootMode] = useState<'year' | 'standard'>('standard')
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [selectedDate, setSelectedDate] = useState(() => {
    return props.initialDate ? new Date(props.initialDate) : new Date()
  })
  const [sourceRect, setSourceRect] = useState<LayoutRect>(DEFAULT_RECT)

  // 动画层
  const { animatedStyle, startEnterAnimation, startExitAnimation } = useYearTransition({
    sourceRect,
    screenWidth: SCREEN_WIDTH,
    screenHeight: SCREEN_HEIGHT,
    onExitComplete: () => setRootMode('year'),
  })

  // 交互层
  const handleYearSelect = (date: Date, layout: LayoutRect) => {
    setSourceRect(layout)
    setSelectedDate(date)

    // 先挂载组件 -> 再播放动画
    setRootMode('standard')
    setViewMode('month')
    startEnterAnimation()
  }

  const handleBackToYear = () => {
    startExitAnimation()
  }

  // 物理返回键监听
  useEffect(() => {
    const backAction = () => {
      if (rootMode === 'standard') {
        if (viewMode === 'week') {
          setViewMode('month') // 周 -> 月
          return true
        }
        handleBackToYear() // 月 -> 年
        return true
      }
      return false
    }
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction)
    return () => backHandler.remove()
  }, [rootMode, viewMode])

  // 5. 渲染层
  return (
    <View style={styles.container}>
      {/* 底层：年视图 */}
      <View style={StyleSheet.absoluteFill}>
        <YearView currentYear={selectedDate} onMonthSelect={handleYearSelect} />
      </View>

      {/* 顶层：标准日历 (条件渲染) */}
      {rootMode === 'standard' && (
        <StandardCalendar
          style={animatedStyle}
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
