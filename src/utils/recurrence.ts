import { RRule, Weekday } from 'rrule'
import { startOfDay, endOfDay, addMinutes, differenceInMinutes, isSameMinute } from 'date-fns'
import { CalendarEvent, RecurrenceRule } from '../types/event'

// 基础频率映射
const FREQ_MAP: Record<string, any> = {
  DAILY: RRule.DAILY,
  WEEKLY: RRule.WEEKLY,
  MONTHLY: RRule.MONTHLY,
  YEARLY: RRule.YEARLY,
}

// 星期常量映射
const WEEKDAY_MAP: Record<string, Weekday> = {
  MO: RRule.MO,
  TU: RRule.TU,
  WE: RRule.WE,
  TH: RRule.TH,
  FR: RRule.FR,
  SA: RRule.SA,
  SU: RRule.SU,
}

/**
 * 辅助函数：解析星期字符串
 * 支持 "MO" (每周一) 和 "+1MO" (每月第一个周一) 两种格式
 */
const parseWeekday = (dayStr: string): Weekday | null => {
  // 1. 简单格式: "MO", "TU"
  if (WEEKDAY_MAP[dayStr]) {
    return WEEKDAY_MAP[dayStr]
  }

  // 2. 高级格式: "+1MO", "-1FR" (用于 Monthly 模式)
  // 正则匹配：可选的正负号 + 数字 + 星期简写
  const match = dayStr.match(/^([+-]?\d+)([A-Z]{2})$/)
  if (match) {
    const nth = parseInt(match[1], 10)
    const dayCode = match[2]
    const rruleDay = WEEKDAY_MAP[dayCode]
    if (rruleDay) {
      return rruleDay.nth(nth) // 调用 rrule 的 nth 方法
    }
  }
  return null
}

export const getEventsForDate = (allEvents: CalendarEvent[], date: Date): CalendarEvent[] => {
  if (!allEvents || !Array.isArray(allEvents)) {
    return []
  }

  const dayStart = startOfDay(date)
  const dayEnd = endOfDay(date)

  const dailyEvents: CalendarEvent[] = []

  allEvents.forEach(event => {
    const eventStart = new Date(event.startDate)

    // 1. 普通日程 (无重复规则)
    if (!event.rrule) {
      if (eventStart >= dayStart && eventStart <= dayEnd) {
        dailyEvents.push(event)
      }
      return
    }

    // 2. 重复日程 (RRULE)
    try {
      const eventEnd = new Date(event.endDate)
      const duration = differenceInMinutes(eventEnd, eventStart)

      let ruleOptions: any = {
        dtstart: eventStart,
      }

      if (typeof event.rrule === 'string') {
        const parsed = RRule.parseString(event.rrule)
        ruleOptions = { ...ruleOptions, ...parsed }
      } else {
        const r = event.rrule as RecurrenceRule

        // A. 基础字段
        ruleOptions.freq = FREQ_MAP[r.freq] || RRule.DAILY
        if (r.interval) ruleOptions.interval = r.interval
        if (r.count) ruleOptions.count = r.count
        if (r.until) ruleOptions.until = new Date(r.until)

        // B. 高级字段：星期 (byDay)
        if (r.byDay && r.byDay.length > 0) {
          const parsedDays = r.byDay.map(d => parseWeekday(d)).filter(d => d !== null)

          if (parsedDays.length > 0) {
            ruleOptions.byweekday = parsedDays
          }
        }

        // C. 高级字段：月日期 (byMonthDay)
        if (r.byMonthDay && r.byMonthDay.length > 0) {
          ruleOptions.bymonthday = r.byMonthDay
        }

        // D. 高级字段：月份 (byMonth)
        if (r.byMonth && r.byMonth.length > 0) {
          ruleOptions.bymonth = r.byMonth
        }

        // E. 周首日 (wkst)
        if (r.weekStart && WEEKDAY_MAP[r.weekStart]) {
          ruleOptions.wkst = WEEKDAY_MAP[r.weekStart]
        }

        const rule = new RRule(ruleOptions)
        const instances = rule.between(dayStart, dayEnd, true)

        instances.forEach(instanceDate => {
          // 检查黑名单 (EXDATE)
          // 如果当前生成的实例时间，存在于 exdates 数组中，说明它被删改过了，直接跳过
          if (event.exdates) {
            const instanceISO = instanceDate.toISOString()
            const isExcluded = event.exdates.includes(instanceISO)
            if (isExcluded) {
              return
            }
          }

          // 生成影子事件
          const shadowEvent: CalendarEvent = {
            ...event,
            id: `${event.id}_${instanceDate.getTime()}`,
            startDate: instanceDate.toISOString(),
            endDate: addMinutes(instanceDate, duration).toISOString(),
            _isInstance: true,
            _originalId: event.id,
          }

          dailyEvents.push(shadowEvent)
        })
      }
    } catch (e) {
      console.warn(`[Recurrence] Failed to parse rrule for event ${event.id}`, e)
    }
  })

  return dailyEvents
}
