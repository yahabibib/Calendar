import notifee, { 
  TimestampTrigger, 
  TriggerType, 
  AuthorizationStatus,
  AndroidImportance
} from '@notifee/react-native'
import { RRule } from 'rrule'
import { addDays, subMinutes, differenceInMinutes } from 'date-fns'
import { CalendarEvent, RecurrenceRule } from '../types/event'

// 预取窗口：只注册未来多少天内的重复提醒 (iOS 限制本地通知数量，不能无限注册)
const RECURRENCE_WINDOW_DAYS = 14 

class NotificationService {
  
  // 1. 初始化 & 权限请求
  async requestPermission() {
    const settings = await notifee.requestPermission()
    if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
      console.log('[Notification] Permission granted')
      return true
    }
    console.log('[Notification] Permission denied')
    return false
  }

  // 2. 为一个日程调度所有相关的提醒
  async scheduleEvent(event: CalendarEvent) {
    // 先清理旧的 (防止修改时间后，旧的提醒还在)
    await this.cancelEvent(event.id)

    if (!event.alarms || event.alarms.length === 0) return

    // 计算未来 14 天内所有需要提醒的时间点
    const triggerDates = this.calculateTriggerDates(event)

    for (const date of triggerDates) {
      for (const offsetMinutes of event.alarms) {
        // 计算响铃时间：日程开始时间 - 提前量
        const triggerDate = subMinutes(date, offsetMinutes)
        
        // 如果时间已经过去了，就不注册了
        if (triggerDate.getTime() <= Date.now()) continue

        // 生成唯一 ID
        const notificationId = this.generateId(event.id, date.getTime(), offsetMinutes)

        try {
          // 创建触发器
          const trigger: TimestampTrigger = {
            type: TriggerType.TIMESTAMP,
            timestamp: triggerDate.getTime(), 
          }

          // 发送调度请求
          await notifee.createTriggerNotification(
            {
              id: notificationId,
              title: event.title,
              body: this.getBodyText(offsetMinutes),
              android: {
                channelId: 'calendar-reminders',
                pressAction: { id: 'default' },
              },
              data: { eventId: event.id } // 方便点击时跳转
            },
            trigger,
          )
          console.log(`[Notification] Scheduled: ${event.title} at ${triggerDate.toISOString()}`)
        } catch (e) {
          console.error('[Notification] Schedule failed', e)
        }
      }
    }
  }

  // 3. 取消一个日程的所有提醒
  async cancelEvent(eventId: string) {
    // Notifee 没有直接按 tag 取消的功能 (iOS)，所以我们得遍历
    // 策略：获取所有挂起的通知，找到 ID 以 eventId 开头的，删掉
    const pendingNotifications = await notifee.getTriggerNotificationIds()
    
    const idsToCancel = pendingNotifications.filter(id => id.startsWith(`${eventId}_`))
    
    if (idsToCancel.length > 0) {
      await notifee.cancelTriggerNotifications(idsToCancel)
      console.log(`[Notification] Cancelled ${idsToCancel.length} for event ${eventId}`)
    }
  }

  // --- Helpers ---

  // 创建安卓渠道 (在 App 启动时调用一次即可)
  async createChannel() {
    await notifee.createChannel({
      id: 'calendar-reminders',
      name: '日程提醒',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    })
  }

  private generateId(eventId: string, timestamp: number, offset: number) {
    // 格式: eventID_timestamp_offset
    return `${eventId}_${timestamp}_${offset}`
  }

  private getBodyText(offset: number) {
    if (offset === 0) return '日程现在开始'
    if (offset < 60) return `${offset} 分钟后开始`
    if (offset % 60 === 0) return `${offset / 60} 小时后开始`
    return `${offset} 分钟后开始`
  }

  // 核心：计算触发时间点列表
  private calculateTriggerDates(event: CalendarEvent): Date[] {
    const start = new Date(event.startDate)
    
    // A. 单次日程
    if (!event.rrule) {
      return [start]
    }

    // B. 重复日程：计算未来 N 天的实例
    try {
      // 构造 RRule 对象
      let rruleOptions: any = {
        dtstart: start,
      }
      
      if (typeof event.rrule === 'string') {
        // 如果需要支持字符串格式，这里需要 RRule.fromString，暂时假设我们 store 里都是对象
        // 或者简单处理：暂不处理 string 类型的 rrule 用于提醒（MVP）
        console.warn('[Notification] String rrule not fully supported in simple scheduler yet')
        return [start] 
      } else {
        const r = event.rrule as RecurrenceRule
        const freqMap: any = { DAILY: RRule.DAILY, WEEKLY: RRule.WEEKLY, MONTHLY: RRule.MONTHLY, YEARLY: RRule.YEARLY }
        
        rruleOptions.freq = freqMap[r.freq]
        if (r.interval) rruleOptions.interval = r.interval
        if (r.until) rruleOptions.until = new Date(r.until)
        if (r.count) rruleOptions.count = r.count
      }

      const rule = new RRule(rruleOptions)
      
      // 窗口期：从现在 到 未来14天
      const now = new Date()
      const windowEnd = addDays(now, RECURRENCE_WINDOW_DAYS)
      
      // 获取这期间的所有日期 (包括今天之前的，如果今天还没响铃的话)
      // 注意：rule.between 的 start 如果是过去时间，会包含过去所有的点，这没必要。
      // 我们取 max(eventStart, now - 24h) 作为计算起点，避免计算太久远的历史
      const calcStart = start > now ? start : subMinutes(now, 24 * 60) 
      
      const instances = rule.between(calcStart, windowEnd, true)
      
      // 过滤掉黑名单 (Exdates)
      // 这里的 exdates 是 ISO string 数组
      if (event.exdates) {
        return instances.filter(date => !event.exdates!.includes(date.toISOString()))
      }
      
      return instances

    } catch (e) {
      console.error('[Notification] RRule parse failed', e)
      return [start]
    }
  }
}

export const notificationService = new NotificationService()