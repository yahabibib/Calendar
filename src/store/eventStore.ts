import { create } from 'zustand';
import { CalendarEvent, MOCK_EVENTS } from '../types/event';

interface EventStore {
  events: CalendarEvent[];
  // Action: 添加日程
  addEvent: (event: CalendarEvent) => void;
  // Action: 删除日程
  deleteEvent: (id: string) => void;
}

export const useEventStore = create<EventStore>((set) => ({
  // 初始数据使用 Mock 数据，方便调试
  events: MOCK_EVENTS,
  
  addEvent: (newEvent) => set((state) => ({
    events: [...state.events, newEvent]
  })),

  deleteEvent: (id) => set((state) => ({
    events: state.events.filter((e) => e.id !== id)
  })),
}));