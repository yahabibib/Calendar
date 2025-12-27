import { useMemo } from 'react'
import { getDay, startOfMonth } from 'date-fns'

export const useMonthPadding = (currentDate: Date, cellWidth: number) => {
  return useMemo(() => {
    const firstDayOfMonth = startOfMonth(currentDate)
    let dayIndex = getDay(firstDayOfMonth)
    // 转换为周一为起点的索引 (0-6)
    dayIndex = (dayIndex === 0 ? 7 : dayIndex) - 1
    return dayIndex * cellWidth
  }, [currentDate, cellWidth])
}