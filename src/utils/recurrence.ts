import { RRule } from 'rrule'
import { startOfDay, endOfDay, addMinutes, differenceInMinutes, isSameMinute } from 'date-fns'
import { CalendarEvent, RecurrenceRule } from '../types/event'

const FREQ_MAP: Record<string, any> = {
  DAILY: RRule.DAILY,
  WEEKLY: RRule.WEEKLY,
  MONTHLY: RRule.MONTHLY,
  YEARLY: RRule.YEARLY,
}

export const getEventsForDate = (allEvents: CalendarEvent[], date: Date): CalendarEvent[] => {
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
        const rruleObj = event.rrule as RecurrenceRule
        ruleOptions.freq = FREQ_MAP[rruleObj.freq] || RRule.DAILY
        if (rruleObj.interval) ruleOptions.interval = rruleObj.interval
        if (rruleObj.count) ruleOptions.count = rruleObj.count
        if (rruleObj.until) ruleOptions.until = new Date(rruleObj.until)
      }

      const rule = new RRule(ruleOptions)
      const instances = rule.between(dayStart, dayEnd, true)

      instances.forEach(instanceDate => {
        // ✨✨✨ 核心修复：检查黑名单 (EXDATE) ✨✨✨
        // 如果当前生成的实例时间，存在于 exdates 数组中，说明它被删改过了，直接跳过
        if (event.exdates) {
          const instanceISO = instanceDate.toISOString()
          // 简单字符串匹配（因为我们存的就是 ISO）
          // 也可以用 isSameMinute 做更严格的时间比对，但通常 ISO 足够了
          const isExcluded = event.exdates.includes(instanceISO)
          
          if (isExcluded) {
            return // 🚫 命中黑名单，不生成影子，直接 return
          }
        }

        // 生成影子事件
        const shadowEvent: CalendarEvent = {
          ...event,
          id: `${event.id}_${instanceDate.getTime()}`,
          startDate: instanceDate.toISOString(),
          endDate: addMinutes(instanceDate, duration).toISOString(),
          _isInstance: true,
          _originalId: event.id
        }
        
        dailyEvents.push(shadowEvent)
      })

    } catch (e) {
      console.warn(`[Recurrence] Failed to parse rrule for event ${event.id}`, e)
    }
  })

  return dailyEvents
}