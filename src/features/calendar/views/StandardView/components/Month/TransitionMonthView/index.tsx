import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  SharedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated'
import { useCalendarGrid } from '@/features/calendar/hooks/useCalendarGrid'
import { useCalendarLayout } from '@/features/calendar/hooks/useCalendarLayout'
import { useMonthPadding } from '../../Shared/hooks/useMonthPadding'
import { MonthSectionHeader } from '../../Shared/components/MonthSectionHeader'
import { MonthDayCell } from '../../Shared/components/MonthDayCell'
import { MONTH_TITLE_HEIGHT } from '../constants'

interface TransitionMonthViewProps {
  currentDate: Date
  selectedDate: string
  expandProgress: SharedValue<number>
  monthRowHeight: number
  visualOffsetY: number
}

const AnimatedHeader = Animated.createAnimatedComponent(View)

export const TransitionMonthView = React.memo<TransitionMonthViewProps>(
  ({ currentDate, selectedDate, expandProgress, monthRowHeight, visualOffsetY }) => {
    const { SCREEN_WIDTH, SCREEN_HEIGHT } = useCalendarLayout()
    const { gridData } = useCalendarGrid(currentDate)
    const cellWidth = SCREEN_WIDTH / 7
    const paddingLeft = useMonthPadding(currentDate, cellWidth)

    // 确定选中行索引
    const selectedRowIndex = useMemo(() => {
      const dayIndex = gridData.findIndex(d => d.dateString === selectedDate)
      if (dayIndex === -1) return 0
      return Math.floor(dayIndex / 7)
    }, [gridData, selectedDate])

    // 计算选中行在月视图中的初始 Y 坐标 (相对于 TransitionMonthView 顶部)
    const selectedRowInitialY = MONTH_TITLE_HEIGHT + selectedRowIndex * monthRowHeight

    // 容器整体位移逻辑
    const wrapperStyle = useAnimatedStyle(() => {
      // 动画位移：从 0 (原地) 到 -selectedRowInitialY (选中行顶到头)
      const containerAnimY = interpolate(
        expandProgress.value,
        [1, 0],
        [0, -selectedRowInitialY],
        Extrapolation.CLAMP,
      )

      return {
        transform: [{ translateY: visualOffsetY + containerAnimY }],
      }
    })

    // Header 动画：属于“上半区”，向上滑走
    const headerStyle = useAnimatedStyle(() => {
      // 额外向上飞出一段距离，速度比容器快一点，产生视差
      const extraSlideUp = interpolate(expandProgress.value, [1, 0], [0, -selectedRowInitialY])
      return {
        transform: [{ translateY: extraSlideUp }],
        opacity: interpolate(expandProgress.value, [0.5, 0], [1, 0]), // 稍微晚点消失，防止穿帮
      }
    })

    return (
      <Animated.View style={[styles.container, wrapperStyle]}>
        <AnimatedHeader style={headerStyle}>
          <MonthSectionHeader currentDate={currentDate} paddingLeft={paddingLeft} />
        </AnimatedHeader>

        <View style={styles.gridContainer}>
          {Array.from({ length: 6 }).map((_, rowIndex) => {
            const rowDays = gridData.slice(rowIndex * 7, (rowIndex + 1) * 7)
            if (rowDays.length === 0) return null

            // 判断区域
            const isSelectedRow = rowIndex === selectedRowIndex
            const isUpperZone = rowIndex < selectedRowIndex
            const isLowerZone = rowIndex > selectedRowIndex

            return (
              <SlidingRow
                key={`row-${rowIndex}`}
                days={rowDays}
                rowHeight={monthRowHeight}
                cellWidth={cellWidth}
                expandProgress={expandProgress}
                // 传给子组件，让它自己决定怎么飞
                zone={isSelectedRow ? 'hero' : isUpperZone ? 'upper' : 'lower'}
                // 下半区需要飞多远？飞出整个屏幕的高度
                screenHeight={SCREEN_HEIGHT}
              />
            )
          })}
        </View>
      </Animated.View>
    )
  },
)

// --- 独立的行组件 (负责具体的飞行逻辑) ---
interface SlidingRowProps {
  days: any[]
  rowHeight: number
  cellWidth: number
  expandProgress: SharedValue<number>
  zone: 'upper' | 'hero' | 'lower'
  screenHeight: number
}

const SlidingRow = ({
  days,
  rowHeight,
  cellWidth,
  expandProgress,
  zone,
  screenHeight,
}: SlidingRowProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    let translateY = 0
    let opacity = 1

    if (zone === 'hero') {
      // 主角：纹丝不动 (相对于容器)
      // 因为容器已经在上移了，它自然就跟着上移到了顶部
      translateY = 0
      opacity = 1
    } else if (zone === 'upper') {
      // 上半区：向上飞 (加速离开)
      translateY = interpolate(expandProgress.value, [1, 0], [0, -rowHeight * 2])
      // 慢慢变淡
      opacity = interpolate(expandProgress.value, [1, 0.5], [1, 0])
    } else if (zone === 'lower') {
      // 下半区：向下飞 (加速离开，直接飞出屏幕底部)
      translateY = interpolate(expandProgress.value, [1, 0], [0, screenHeight])
      // 稍微晚点变淡，确保飞出视野
      opacity = interpolate(expandProgress.value, [0.8, 0.2], [1, 0])
    }

    return {
      transform: [{ translateY }],
      opacity,
    }
  })

  return (
    <Animated.View style={[styles.row, { height: rowHeight }, animatedStyle]}>
      {days.map((dayItem: any, colIndex: number) => {
        const isLastColumn = (colIndex + 1) % 7 === 0
        if (!dayItem.isCurrentMonth) {
          return <View key={dayItem.dateString} style={{ width: cellWidth, height: rowHeight }} />
        }
        return (
          <MonthDayCell
            key={dayItem.dateString}
            dayNum={dayItem.dayNum}
            isToday={dayItem.isToday}
            width={cellWidth}
            height={rowHeight}
            showBorderRight={!isLastColumn}
          />
        )
      })}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'visible', // 关键！改为 visible，否则飞出去的行会被切掉，效果就没了
  },
  gridContainer: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
  },
})
