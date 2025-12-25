import React, { useMemo } from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated'
import { format, startOfMonth, getDay, isSameDay, addMonths, subMonths } from 'date-fns'
import { useCalendarGrid } from '../../hooks/useCalendarGrid'
import { styles as gridStyles } from '../MonthGrid/styles'
import { MONTH_TITLE_HEIGHT } from '../../constants'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

interface TransitionMonthViewProps {
  currentDate: Date
  selectedDate: string
  expandProgress: Animated.SharedValue<number>
  monthRowHeight: number
  weekRowHeight: number
  // ✨ 接收视觉偏移量
  visualOffsetY?: number
}

const getHeaderConfig = (date: Date) => {
  const monthLabel = format(date, 'M月')
  const isJanuary = monthLabel === '1月'
  // 如果是1月，显示年份
  const displayLabel = isJanuary ? format(date, 'yyyy年 M月') : monthLabel

  // 计算 paddingLeft (根据每月1号是周几)
  const firstDayOfMonth = startOfMonth(date)
  let dayIndex = getDay(firstDayOfMonth)
  dayIndex = (dayIndex === 0 ? 7 : dayIndex) - 1 // 转为周一为起点的索引 (0-6)

  // CELL_WIDTH 需要根据你的屏幕宽度计算，通常是 screenWidth / 7
  // 这里假设你已经有了 cellWidth 变量
  const paddingLeft = dayIndex * (Dimensions.get('window').width / 7)

  return { displayLabel, isJanuary, paddingLeft }
}

const chunk = <T,>(arr: T[], size: number): T[][] => {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  )
}

const StaticMonthUnit = React.memo<{ date: Date; rowHeight: number }>(({ date, rowHeight }) => {
  const { gridData } = useCalendarGrid(date)
  const headerConfig = getHeaderConfig(date)
  const rows = useMemo(() => chunk(gridData, 7), [gridData])
  return (
    <View>
      <View style={[gridStyles.monthHeader, { paddingLeft: headerConfig.paddingLeft }]}>
        <Text
          style={[
            gridStyles.monthHeaderText,
            headerConfig.isJanuary && gridStyles.monthHeaderTextYear,
          ]}>
          {headerConfig.displayLabel}
        </Text>
      </View>
      <View>
        {rows.map((row, i) => (
          <View key={i} style={{ flexDirection: 'row', width: '100%', height: rowHeight }}>
            {row.map((dayItem: any, index: number) => {
              if (!dayItem.isCurrentMonth) return <View key={index} style={{ width: '14.2857%' }} />
              return (
                <View
                  key={index}
                  style={{
                    width: '14.2857%',
                    height: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <View style={[gridStyles.dayCircle, dayItem.isToday && gridStyles.todayCircle]}>
                    <Text style={[gridStyles.dayText, dayItem.isToday && gridStyles.todayText]}>
                      {dayItem.dayNum}
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        ))}
      </View>
    </View>
  )
})

export const TransitionMonthView = React.memo<TransitionMonthViewProps>(
  ({
    currentDate,
    selectedDate,
    expandProgress,
    monthRowHeight,
    weekRowHeight,
    visualOffsetY = 0,
  }) => {
    const prevMonthDate = useMemo(() => subMonths(currentDate, 1), [currentDate])
    const nextMonthDate = useMemo(() => addMonths(currentDate, 1), [currentDate])

    // 计算当前月份的 header 配置
    const currentHeaderConfig = getHeaderConfig(currentDate)

    const { gridData } = useCalendarGrid(currentDate)
    const rows = useMemo(() => chunk(gridData, 7), [gridData])

    const selectedRowIndex = useMemo(() => {
      const target = new Date(selectedDate)
      const monthStart = startOfMonth(currentDate)
      const startDay = getDay(monthStart)
      const offsetStartDay = startDay === 0 ? 6 : startDay - 1
      const dayOfMonth = target.getDate()
      return Math.floor((offsetStartDay + dayOfMonth - 1) / 7)
    }, [currentDate, selectedDate])

    const topRows = rows.slice(0, selectedRowIndex)
    const selectedRowData = rows[selectedRowIndex]
    const bottomRows = rows.slice(selectedRowIndex + 1)

    // ==========================================
    // 📐 计算位移
    // ==========================================
    const initialTopHeight = MONTH_TITLE_HEIGHT + selectedRowIndex * monthRowHeight
    // 目标：让选中行去到 Y=0
    // 默认情况下的位移（假设月份在顶部）：
    const defaultTranslateY = -initialTopHeight

    // 外层容器样式 (Global Shift)
    const containerShiftStyle = useAnimatedStyle(() => ({
      transform: [
        {
          translateY: interpolate(
            expandProgress.value,
            [0, 1],
            [0, visualOffsetY], // Week时归零，Month时对齐滚动位置
            Extrapolation.CLAMP,
          ),
        },
      ],
    }))

    // 内层上半部分动画
    const upperBundleStyle = useAnimatedStyle(() => ({
      transform: [
        {
          translateY: interpolate(
            expandProgress.value,
            [0, 1],
            [defaultTranslateY, 0], // 从 "顶上去" 到 "归位"
            Extrapolation.CLAMP,
          ),
        },
      ],
    }))

    // 下半部分动画 (滑出屏幕)
    const lowerPartInitialY = initialTopHeight + monthRowHeight
    const distanceToOffScreen = SCREEN_HEIGHT - lowerPartInitialY + 100
    const lowerPartTranslateY = Math.max(300, distanceToOffScreen)

    const lowerPartStyle = useAnimatedStyle(() => ({
      transform: [
        {
          translateY: interpolate(
            expandProgress.value,
            [0, 1],
            // [lowerPartTranslateY, 0],
            [400, 0],
            Extrapolation.CLAMP,
          ),
        },
      ],
      // opacity: interpolate(expandProgress.value, [0, 0.6], [0, 1]),
      opacity: interpolate(expandProgress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    }))

    const fadeOutStyle = useAnimatedStyle(() => ({
      opacity: interpolate(
        expandProgress.value,
        [0.4, 1], // 调整这个区间可以控制淡出的快慢
        [0, 1], // Week模式下完全透明，Month模式下不透明
        Extrapolation.CLAMP,
      ),
    }))

    const selectedRowMorphStyle = useAnimatedStyle(() => ({
      height: interpolate(
        expandProgress.value,
        [0, 1],
        [weekRowHeight, monthRowHeight],
        Extrapolation.CLAMP,
      ),
      overflow: 'hidden',
    }))

    // renderSimpleRow 保持不变...
    const renderSimpleRow = (rowItems: any[], fixedHeight?: number) => (
      <View style={{ flexDirection: 'row', width: '100%', height: fixedHeight || '100%' }}>
        {rowItems.map((dayItem: any, index: number) => {
          if (!dayItem.isCurrentMonth) return <View key={index} style={{ width: '14.2857%' }} />
          const isSelected = isSameDay(dayItem.date, new Date(selectedDate))
          return (
            <View
              key={index}
              style={{
                width: '14.2857%',
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <View
                style={[
                  gridStyles.dayCircle,
                  isSelected && gridStyles.selectedCircle,
                  !isSelected && dayItem.isToday && gridStyles.todayCircle,
                ]}>
                <Text
                  style={[
                    gridStyles.dayText,
                    isSelected && gridStyles.selectedText,
                    !isSelected && dayItem.isToday && gridStyles.todayText,
                  ]}>
                  {dayItem.dayNum}
                </Text>
              </View>
              <View style={gridStyles.dotContainer} />
            </View>
          )
        })}
      </View>
    )

    return (
      // ✨ 增加外层 Animated.View 处理视觉对齐
      <Animated.View style={[styles.container, containerShiftStyle]} pointerEvents="none">
        {/* Layer 1: Upper Bundle */}
        <Animated.View style={[styles.upperContainer, upperBundleStyle]}>
          <Animated.View style={fadeOutStyle}>
            <View style={{ position: 'absolute', bottom: '100%', left: 0, right: 0 }}>
              <StaticMonthUnit date={prevMonthDate} rowHeight={monthRowHeight} />
              <View style={{ height: 20 }} />
            </View>
            {/* header */}
            <View
              style={[gridStyles.monthHeader, { paddingLeft: currentHeaderConfig.paddingLeft }]}>
              <Text
                style={[
                  gridStyles.monthHeaderText,
                  currentHeaderConfig.isJanuary && gridStyles.monthHeaderTextYear,
                ]}>
                {currentHeaderConfig.displayLabel}
              </Text>
            </View>
            {/* 上部分日历 */}
            <View>
              {topRows.map((row, i) => (
                <View key={i}>{renderSimpleRow(row, monthRowHeight)}</View>
              ))}
            </View>
          </Animated.View>
          {/* 选中行 */}
          <Animated.View style={selectedRowMorphStyle}>
            {selectedRowData && renderSimpleRow(selectedRowData)}
          </Animated.View>
        </Animated.View>

        {/* Layer 2: Lower Part */}
        <Animated.View
          style={[
            styles.lowerContainer,
            { top: initialTopHeight + monthRowHeight },
            lowerPartStyle,
          ]}>
          <View>
            {bottomRows.map((row, i) => (
              <View key={i}>{renderSimpleRow(row, monthRowHeight)}</View>
            ))}
          </View>
          <View style={{ marginTop: 20 }}>
            <StaticMonthUnit date={nextMonthDate} rowHeight={monthRowHeight} />
          </View>
        </Animated.View>
      </Animated.View>
    )
  },
)

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
    zIndex: 20,
    overflow: 'visible',
  },
  upperContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    backgroundColor: 'white',
  },
  lowerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
    backgroundColor: 'white',
  },
})
