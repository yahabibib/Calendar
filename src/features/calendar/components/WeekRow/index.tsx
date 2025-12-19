import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { format, isSameDay, addDays } from 'date-fns'
import { styles } from './styles'
import { COLORS } from '../../../../theme'

interface WeekRowProps {
  startDate: Date
  selectedDate: Date
  onDateSelect: (date: Date) => void
  renderDays?: number // 始终渲染 7 天
  isWideScreen?: boolean // ✨ 传入是否是大屏
}

const WEEK_DAYS_CN = ['日', '一', '二', '三', '四', '五', '六']

export const WeekRow = React.memo<WeekRowProps>(
  ({ startDate, selectedDate, onDateSelect, renderDays = 7, isWideScreen = false }) => {
    const days = Array.from({ length: renderDays }).map((_, index) => {
      const date = addDays(startDate, index)
      return {
        date,
        dayNum: format(date, 'd'),
        weekDay: WEEK_DAYS_CN[date.getDay()],
        isToday: isSameDay(date, new Date()),
        dateString: format(date, 'yyyy-MM-dd'),
      }
    })

    return (
      <View style={styles.container}>
        {days.map(dayItem => {
          // ✨ 精细的高亮逻辑
          const isSelected = isSameDay(dayItem.date, selectedDate)

          // 在手机上(非宽屏)，下一天显示浅色高亮
          const isSecondary = !isWideScreen && isSameDay(dayItem.date, addDays(selectedDate, 1))

          return (
            <TouchableOpacity
              key={dayItem.dateString}
              style={[styles.dayCell, { width: `${100 / renderDays}%` }]}
              onPress={() => onDateSelect(dayItem.date)}
              activeOpacity={0.7}>
              {/* 星期文字：始终保持灰色/黑色，不高亮 */}
              <Text
                style={[
                  styles.weekDayText,
                  dayItem.isToday && { color: COLORS.primary, fontWeight: 'bold' }, // 仅今天变红
                ]}>
                {dayItem.weekDay}
              </Text>

              {/* 日期圆圈：负责背景高亮 */}
              <View
                style={[
                  styles.dayCircle,
                  isSelected && styles.selectedCircle, // 深色实心
                  isSecondary && styles.secondarySelectedCircle, // 浅色背景
                  !isSelected && !isSecondary && dayItem.isToday && styles.todayCircle,
                ]}>
                <Text
                  style={[
                    styles.dayText,
                    isSelected && styles.selectedText, // 深色背景配白字
                    isSecondary && { color: COLORS.primary }, // 浅色背景配主题色字
                    !isSelected && !isSecondary && dayItem.isToday && styles.todayText,
                  ]}>
                  {dayItem.dayNum}
                </Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
    )
  },
)
