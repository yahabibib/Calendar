import React, { useRef, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { ExpandableCalendar, CalendarProvider, LocaleConfig } from 'react-native-calendars'
import { COLORS, COMMON_STYLES } from '../theme'

// --- 1. 国际化配置 (保持不变) ---
LocaleConfig.locales['cn'] = {
  monthNames: [
    '一月',
    '二月',
    '三月',
    '四月',
    '五月',
    '六月',
    '七月',
    '八月',
    '九月',
    '十月',
    '十一月',
    '十二月',
  ],
  monthNamesShort: [
    '1月',
    '2月',
    '3月',
    '4月',
    '5月',
    '6月',
    '7月',
    '8月',
    '9月',
    '10月',
    '11月',
    '12月',
  ],
  dayNames: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
  dayNamesShort: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
  today: '今天',
}
LocaleConfig.defaultLocale = 'cn'

interface CalendarWidgetProps {
  selectedDate: string
  markedDates: any
  onDateSelect: (date: string) => void
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  selectedDate,
  markedDates,
  onDateSelect,
}) => {
  return (
    <View style={styles.container}>
      {/* CalendarProvider 是必须的容器
        date: 当前选中的日期
        onDateChanged: 用户点击或滑动日期时触发
        disabledOpacity: 禁止点击时的透明度
      */}
      <CalendarProvider
        date={selectedDate}
        onDateChanged={onDateSelect}
        theme={{
          todayButtonTextColor: COLORS.primary,
        }}
        showTodayButton // 显示“回到今天”按钮
      >
        <ExpandableCalendar
          // --- 核心交互 ---
          firstDay={1} // 周一开始
          markedDates={markedDates}
          horizontal={true} // 允许左右滑动月份/周
          hideArrows={false} // 显示左右箭头
          disablePan={false} // ✅ 开启手势：允许上下拖拽切换周/月视图
          // 默认显示模式：CLOSED (周视图) 或 OPEN (月视图)
          initialPosition={ExpandableCalendar.positions.CLOSED}
          // --- 样式美化 ---
          theme={{
            todayTextColor: COLORS.primary,
            arrowColor: COLORS.primary,
            monthTextColor: COLORS.text,
            textMonthFontWeight: 'bold',
            selectedDayBackgroundColor: COLORS.primary,
            dotColor: COLORS.secondary,

            // 调整头部样式
            stylesheet: {
              calendar: {
                header: {
                  paddingHorizontal: 20,
                },
              },
            },
          }}
        />
      </CalendarProvider>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    // 这里的 height 不需要写死，Provider 会自动处理
    backgroundColor: 'white',
    ...COMMON_STYLES.shadow,
    zIndex: 100, // 关键：确保日历浮在列表上面
  },
})
