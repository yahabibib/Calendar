import { RRule } from 'rrule'
import { startOfDay, endOfDay, addMinutes, differenceInMinutes } from 'date-fns'
import { CalendarEvent, RecurrenceRule } from '../types/event'

// 频率映射表：将我们的字符串类型映射为 rrule 的常量
const FREQ_MAP: Record<string, any> = {
  DAILY: RRule.DAILY,
  WEEKLY: RRule.WEEKLY,
  MONTHLY: RRule.MONTHLY,
  YEARLY: RRule.YEARLY,
}

/**
 * 核心函数：获取指定日期当天的所有日程（包含普通日程 + 重复日程的实例）
 * @param allEvents Store 中的所有元数据事件
 * @param date 指定的日期 (Date 对象)
 */
export const getEventsForDate = (allEvents: CalendarEvent[], date: Date): CalendarEvent[] => {
  const dayStart = startOfDay(date)
  const dayEnd = endOfDay(date)
  
  const dailyEvents: CalendarEvent[] = []

  allEvents.forEach(event => {
    const eventStart = new Date(event.startDate)
    
    // 1. 普通日程 (无重复规则)
    if (!event.rrule) {
      // 简单判断：日程开始时间在当天 (为了性能，暂不处理跨天长日程的切片显示)
      if (eventStart >= dayStart && eventStart <= dayEnd) {
        dailyEvents.push(event)
      }
      return
    }

    // 2. 重复日程 (RRULE)
    try {
      const eventEnd = new Date(event.endDate)
      const duration = differenceInMinutes(eventEnd, eventStart)

      // 构建 rrule 配置对象
      let ruleOptions: any = {
        dtstart: eventStart, // ⚠️ 核心：规则必须基于原始开始时间计算
      }

      if (typeof event.rrule === 'string') {
        // 如果是字符串 (例如从 iCal 导入)
        const parsed = RRule.parseString(event.rrule)
        ruleOptions = { ...ruleOptions, ...parsed }
      } else {
        // 如果是对象 (我们 App 自己创建的结构)
        const rruleObj = event.rrule as RecurrenceRule
        ruleOptions.freq = FREQ_MAP[rruleObj.freq] || RRule.DAILY
        
        if (rruleObj.interval) ruleOptions.interval = rruleObj.interval
        if (rruleObj.count) ruleOptions.count = rruleObj.count
        if (rruleObj.until) ruleOptions.until = new Date(rruleObj.until)
      }

      const rule = new RRule(ruleOptions)

      // 计算：当天是否有实例落在时间范围内
      // between(start, end, inc): inc=true 表示包含边界
      const instances = rule.between(dayStart, dayEnd, true)

      instances.forEach(instanceDate => {
        // 生成“影子事件” (Shadow Event)
        const shadowEvent: CalendarEvent = {
          ...event,
          // ⚠️ 关键：生成临时唯一 ID，格式：原始ID_实例时间戳
          // 这样 React Key 不会冲突，且我们能通过 split('_') 找回原 ID
          id: `${event.id}_${instanceDate.getTime()}`,
          
          // ⚠️ 关键：时间要换成计算出来的实例时间
          startDate: instanceDate.toISOString(),
          endDate: addMinutes(instanceDate, duration).toISOString(),
          
          // 标记身份
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