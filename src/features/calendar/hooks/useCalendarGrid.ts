import { useMemo } from 'react';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths
} from 'date-fns';

const WEEK_STARTS_ON = 1; // 周一为一周开始

export const useCalendarGrid = (currentDate: Date) => {
  const gridData = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    // 面板的起始日 (本月第一周的周一)
    const startDate = startOfWeek(monthStart, { weekStartsOn: WEEK_STARTS_ON });

    // 动态计算结束日期
    const endDate = endOfWeek(monthEnd, { weekStartsOn: WEEK_STARTS_ON });

    const days = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    return days.map(date => ({
      date,
      dateString: format(date, 'yyyy-MM-dd'),
      dayNum: format(date, 'd'),
      isCurrentMonth: isSameMonth(date, monthStart),
      isToday: isSameDay(date, new Date()),
    }));
  }, [currentDate]);

  return {
    gridData,
    weekDays: ['一', '二', '三', '四', '五', '六', '日'],
    nextMonth: () => addMonths(currentDate, 1),
    prevMonth: () => subMonths(currentDate, 1),
  };
};