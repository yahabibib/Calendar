// src/types/navigation.ts
import { CalendarEvent } from './event';

export type RootStackParamList = {
  Home: undefined;
  AddEvent: { initialDate?: string; event?: CalendarEvent };
  EventDetails: { event: CalendarEvent }; // ✨ 统一为 event 对象
};