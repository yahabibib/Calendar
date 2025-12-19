import { CalendarEvent, RecurrenceFrequency, RecurrenceRule } from '../../types/event'

export interface EventFormState {
  title: string
  location: string
  description: string
  url: string
  isAllDay: boolean
  startDate: Date
  endDate: Date
  
  // RFC 5545 字段
  repeatFreq: RecurrenceFrequency | null
  repeatInterval: string // 表单里用 string 方便输入，保存时转 number
  repeatUntil: Date | null
  
  calendarId: string
  color: string
  alarmOffset: number | null
}

// 预定义选项类型
export interface OptionItem<T> {
  label: string
  value: T
  color?: string
}