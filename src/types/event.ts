// src/types/event.ts

export interface CalendarEvent {
  // --- 基础字段 ---
  id: string;             // UID: 唯一标识
  title: string;          // SUMMARY: 标题
  description?: string;   // DESCRIPTION: 备注
  location?: string;      // LOCATION: 地点
  
  // --- 时间字段 (ISO 8601 字符串) ---
  startTime: string;      // DTSTART: 开始时间 (e.g., '2023-12-01T09:00:00Z')
  endTime: string;        // DTEND: 结束时间
  isAllDay: boolean;      // 辅助字段：是否全天
  
  // --- 扩展字段 (RFC 5545) ---
  rrule?: string;         // RRULE: 重复规则字符串 (e.g., 'FREQ=WEEKLY;COUNT=5')
  
  // --- 提醒字段 (VALARM) ---
  alarmOffset?: number;   // TRIGGER: 提前多少分钟提醒 (e.g., 15)
}

// 模拟数据 (Mock Data)
export const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: '1',
    title: '项目启动会',
    description: '讨论日历应用的架构设计',
    location: '会议室 302',
    startTime: new Date().toISOString().split('T')[0] + 'T09:00:00Z', // 今天的 9点
    endTime: new Date().toISOString().split('T')[0] + 'T10:00:00Z',   // 今天的 10点
    isAllDay: false,
    alarmOffset: 15,
  },
  {
    id: '2',
    title: '提交周报',
    startTime: new Date().toISOString().split('T')[0] + 'T18:00:00Z',
    endTime: new Date().toISOString().split('T')[0] + 'T18:30:00Z',
    isAllDay: false,
    rrule: 'FREQ=WEEKLY;BYDAY=FR', // 每周五
  }
];