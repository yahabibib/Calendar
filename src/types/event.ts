// src/types/event.ts

export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export interface RecurrenceRule {
  freq: RecurrenceFrequency
  interval?: number
  until?: string
  count?: number
}

// ✨ 新增坐标类型
export interface LatLng {
  latitude: number
  longitude: number
}

export interface CalendarEvent {
  id: string
  title: string
  startDate: string
  endDate: string
  isAllDay: boolean
  
  location?: string
  // ✨ 新增坐标字段 (可选)
  coordinates?: LatLng
  
  description?: string
  url?: string
  calendarId?: string
  color?: string
  rrule?: RecurrenceRule | string
  alarms?: number[]
}

// 模拟数据 (Mock Data)
export const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: '1',
    title: '项目启动会',
    description: '讨论日历应用的架构设计',
    location: 'Apple Park',
    // ✨ 给这个 mock 数据加上坐标 (Apple Park 的位置)
    coordinates: {
      latitude: 37.3346,
      longitude: -122.0090,
    },
    startDate: new Date().toISOString().split('T')[0] + 'T09:00:00Z',
    endDate: new Date().toISOString().split('T')[0] + 'T10:00:00Z',
    isAllDay: false,
    alarms: [15],
  },
  {
    id: '2',
    title: '提交周报',
    startDate: new Date().toISOString().split('T')[0] + 'T18:00:00Z',
    endDate: new Date().toISOString().split('T')[0] + 'T18:30:00Z',
    isAllDay: false,
    rrule: 'FREQ=WEEKLY;BYDAY=FR',
  }
];