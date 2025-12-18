import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { COLORS, COMMON_STYLES, SPACING } from '../theme';

// 配置中文 (只需执行一次，放在组件外即可)
LocaleConfig.locales['cn'] = {
  monthNames: ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'],
  monthNamesShort: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
  dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
  dayNamesShort: ['周日','周一','周二','周三','周四','周五','周六'],
  today: '今天'
};
LocaleConfig.defaultLocale = 'cn';

interface CalendarWidgetProps {
  selectedDate: string;
  markedDates: any;
  onDateSelect: (date: string) => void;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({ 
  selectedDate, 
  markedDates, 
  onDateSelect 
}) => {
  return (
    <View style={styles.container}>
      <Calendar
        current={selectedDate}
        onDayPress={(day: { dateString: string }) => onDateSelect(day.dateString)}
        markedDates={markedDates}
        theme={{
          todayTextColor: COLORS.primary,
          arrowColor: COLORS.primary,
          monthTextColor: COLORS.text,
          textMonthFontWeight: 'bold',
          selectedDayBackgroundColor: COLORS.primary,
        }}
      />
    </View>
  );
};

// 样式分离
const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.sm,
    ...COMMON_STYLES.shadow, // 复用阴影
  }
});