import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { format } from 'date-fns'
import { useCalendarGrid } from '../../hooks/useCalendarGrid'
import { styles } from './styles'

interface MiniMonthGridProps {
  date: Date
  onMonthPress: (date: Date) => void
  cellWidth: number
}

export const MiniMonthGrid = React.memo<MiniMonthGridProps>(({ date, onMonthPress, cellWidth }) => {
  const { gridData } = useCalendarGrid(date)

  const PADDING_H = 5
  const DAY_SIZE = (cellWidth - PADDING_H * 2) / 7
  const MONTH_TITLE_HEIGHT = 24
  const MARGIN_BOTTOM = 20

  const monthTitle = format(date, 'M月')
  const titleColor = '#ff3b30'

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { width: cellWidth, marginBottom: MARGIN_BOTTOM, paddingHorizontal: PADDING_H },
      ]}
      onPress={() => onMonthPress(date)}
      activeOpacity={0.6}>
      <Text style={[styles.monthTitle, { color: titleColor, height: MONTH_TITLE_HEIGHT }]}>
        {monthTitle}
      </Text>

      {/* ✨ 修复 3: 强制网格容器高度为 6 行 */}
      {/* 这样可以配合 YearView 的 getItemLayout，防止计算误差导致的跳动/白屏 */}
      <View style={[styles.grid, { height: DAY_SIZE * 6 }]}>
        {gridData.map((dayItem, index) => {
          if (!dayItem.isCurrentMonth) {
            // 年视图不需要渲染空白占位 View，直接返回 null 即可，
            // 只要外层容器 height 撑开了就行
            return null
          }
          const isToday = dayItem.isToday
          return (
            <View
              key={index}
              style={[
                styles.dayCell,
                {
                  width: DAY_SIZE,
                  height: DAY_SIZE,
                  // 这里需要绝对定位或者计算偏移吗？不需要，flexWrap 会自动排
                  // 但为了保证位置准确，我们前面返回了 null，这在 flexWrap 下会导致位置前移
                  // 所以：如果前面有空位，必须渲染空 View 占位！
                },
                isToday && styles.todayCell,
              ]}>
              <Text style={[styles.dayText, isToday && styles.todayText]}>{dayItem.dayNum}</Text>
            </View>
          )
        })}
        {/* 修正逻辑：上面的 map 逻辑在 flexWrap 下有个问题。
          useCalendarGrid 返回的数据包含了前导的空日期（上个月的）。
          在 MiniMonthGrid 里，如果 !isCurrentMonth 我们返回了 null，会导致 flex 布局错位（1号跑到了周一的位置）。
          
          修正方案：必须渲染占位符！
        */}
      </View>
    </TouchableOpacity>
  )
})

// 为了解决上述逻辑，我们重新写一下内部 map，确保占位符存在
const MiniMonthGridContent: React.FC<{ gridData: any[]; daySize: number }> = ({
  gridData,
  daySize,
}) => {
  return (
    <>
      {gridData.map((dayItem, index) => {
        // 无论是本月还是非本月，都要渲染一个 View 来占格子位置
        const content = dayItem.isCurrentMonth ? (
          <View
            style={[
              styles.dayCell,
              { width: daySize, height: daySize },
              dayItem.isToday && styles.todayCell,
            ]}>
            <Text style={[styles.dayText, dayItem.isToday && styles.todayText]}>
              {dayItem.dayNum}
            </Text>
          </View>
        ) : (
          <View style={{ width: daySize, height: daySize }} />
        )

        return <View key={index}>{content}</View>
      })}
    </>
  )
}

// 最终组件
export const MiniMonthGridUpdated = React.memo<MiniMonthGridProps>(
  ({ date, onMonthPress, cellWidth }) => {
    const { gridData } = useCalendarGrid(date)

    const PADDING_H = 5
    const DAY_SIZE = (cellWidth - PADDING_H * 2) / 7
    const MONTH_TITLE_HEIGHT = 24
    const MARGIN_BOTTOM = 20
    const titleColor = '#ff3b30'

    return (
      <TouchableOpacity
        style={[
          styles.container,
          { width: cellWidth, marginBottom: MARGIN_BOTTOM, paddingHorizontal: PADDING_H },
        ]}
        onPress={() => onMonthPress(date)}
        activeOpacity={0.6}>
        <Text style={[styles.monthTitle, { color: titleColor, height: MONTH_TITLE_HEIGHT }]}>
          {format(date, 'M月')}
        </Text>

        {/* 强制高度 6 行 */}
        <View style={[styles.grid, { height: DAY_SIZE * 6 }]}>
          {gridData.map((dayItem, index) => {
            // 渲染真实日期或占位符
            return (
              <View
                key={index}
                style={[
                  styles.dayCell,
                  { width: DAY_SIZE, height: DAY_SIZE },
                  dayItem.isToday && dayItem.isCurrentMonth && styles.todayCell,
                ]}>
                {dayItem.isCurrentMonth && (
                  <Text style={[styles.dayText, dayItem.isToday && styles.todayText]}>
                    {dayItem.dayNum}
                  </Text>
                )}
              </View>
            )
          })}
        </View>
      </TouchableOpacity>
    )
  },
)

// 导出时替换掉上面的 draft
export { MiniMonthGridUpdated as MiniMonthGrid }
