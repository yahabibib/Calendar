// src/types/event.ts

export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export interface RecurrenceRule {
  freq: RecurrenceFrequency
  interval?: number // 每隔几天/几周
  until?: string // 结束日期 (ISO)
  count?: number // 重复次数
}

export interface CalendarEvent {
  id: string
  title: string
  startDate: string // ISO 8601
  endDate: string // ISO 8601
  isAllDay: boolean
  
  // --- ✨ 新增 RFC 5545 字段 ---
  location?: string       // LOCATION: 地点
  description?: string    // DESCRIPTION: 备注/描述
  url?: string            // URL: 相关链接
  
  // 归属
  calendarId?: string     // 归属的日历 ID (如 "Work", "Home")
  color?: string          // 方便 UI 展示的颜色
  
  // 规则与提醒
  rrule?: RecurrenceRule | string // RRULE: 重复规则 (简单起见，我们先用对象或字符串)
  alarms?: number[]       // VALARM: 提醒设置 (存储“提前多少分钟”的数组，如 [15, 60] 表示提前15分钟和1小时)
}

// 模拟数据 (Mock Data)
export const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: '1',
    title: '项目启动会',
    description: '讨论日历应用的架构设计',
    location: '会议室 302',
    startDate: new Date().toISOString().split('T')[0] + 'T09:00:00Z', // 今天的 9点
    endDate: new Date().toISOString().split('T')[0] + 'T10:00:00Z',   // 今天的 10点
    isAllDay: false,
    alarms: [15],
  },
  {
    id: '2',
    title: '提交周报',
    startDate: new Date().toISOString().split('T')[0] + 'T18:00:00Z',
    endDate: new Date().toISOString().split('T')[0] + 'T18:30:00Z',
    isAllDay: false,
    rrule: 'FREQ=WEEKLY;BYDAY=FR', // 每周五
  }
];