export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export interface RecurrenceRule {
  freq: RecurrenceFrequency // 重复频率
  interval?: number // 重复间隔
  until?: string  // 重复终止时间
  count?: number  // 重复次数
}

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
  coordinates?: LatLng
  
  description?: string
  url?: string
  calendarId?: string
  color?: string
  rrule?: RecurrenceRule | string
  alarms?: number[]

  _isInstance?: boolean  // 标识是否为重复生成的实例
  _originalId?: string   // 指向母日程的 ID

  exdates?: string[]  // 例外日期，用于排除某些特定的重复实例
}

export const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: '1',
    title: '项目启动会',
    description: '讨论日历应用的架构设计',
    location: 'Apple Park',
    coordinates: { latitude: 37.3346, longitude: -122.0090 },
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
    // 这是一个每周五重复的例子
    rrule: { freq: 'WEEKLY' }, 
  }
];