import { CalendarEvent } from '../types/event';
// 定义整个 App 的页面栈及其参数
export type RootStackParamList = {
  Home: undefined;      // Home 页面不需要参数
  AddEvent: { event?: CalendarEvent | undefined};  // AddEvent 页面暂时不需要参数
  EventDetails: { eventId: string }; // 详情页需要 eventId
};