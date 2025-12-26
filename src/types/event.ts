export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

// 重复日程
export interface RecurrenceRule {
  freq: RecurrenceFrequency // 重复频率
  interval?: number // 重复间隔
  until?: string  // 重复终止时间
  count?: number  // 重复次数
}

// 地图定位
export interface LatLng {
  latitude: number
  longitude: number
}

// 日程
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

  // 黑名单 (用于母日程): 记录被修改/删除的实例原始时间
  exdates?: string[] 

  // 用于例外日程 (Exception): 指向它所属的母日程 ID
  recurringEventId?: string 

  // 用于例外日程: 记录它原本应该是几点开始的 (用于匹配 exdates)
  originalStartTime?: string

  // 运行时字段
  _isInstance?: boolean  // 是否是母日程的实例
  _originalId?: string  // 母日程的 ID
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