import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { CalendarEvent, MOCK_EVENTS } from '../types/event'

interface EventStore {
  events: CalendarEvent[]
  
  // Actions
  addEvent: (event: CalendarEvent) => void
  removeEvent: (id: string) => void // ✨ 统一命名为 removeEvent，匹配 UI 调用
  updateEvent: (updatedEvent: CalendarEvent) => void
  
  // Utils
  resetToMock: () => void // 供调试用：重置回测试数据
}

export const useEventStore = create<EventStore>()(
  persist(
    (set, get) => ({
      // 初始状态为空，由 hydration 逻辑填充
      events: [],

      addEvent: (newEvent) => set((state) => ({
        events: [...state.events, newEvent]
      })),

      removeEvent: (id) => set((state) => ({
        events: state.events.filter((e) => e.id !== id)
      })),

      updateEvent: (updatedEvent) => set((state) => ({
        events: state.events.map((e) => e.id === updatedEvent.id ? updatedEvent : e)
      })),

      resetToMock: () => set({ events: MOCK_EVENTS }),
    }),
    {
      name: 'calendar-event-storage', // 本地存储的 Key
      storage: createJSONStorage(() => AsyncStorage), // 使用 AsyncStorage
      
      // ✨ 高级技巧：当 Store 从硬盘加载完毕(Rehydrated)后触发
      onRehydrateStorage: () => (state) => {
        // 如果本地没有数据（比如第一次安装），则自动加载 Mock 数据
        if (state && state.events.length === 0) {
          console.log('[EventStore] No local data found, loading MOCK_EVENTS')
          state.resetToMock()
        } else {
          console.log('[EventStore] Local data loaded:', state?.events.length)
        }
      },
    }
  )
)