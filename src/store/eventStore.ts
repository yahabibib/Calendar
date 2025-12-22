import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { addDays, subDays, parseISO, differenceInMilliseconds, addMilliseconds } from 'date-fns' // ✨ 引入时间计算函数
import { CalendarEvent, MOCK_EVENTS } from '../types/event'

export type UpdateMode = 'single' | 'future' | 'all'

interface EventStore {
  events: CalendarEvent[]
  
  addEvent: (event: CalendarEvent) => void
  removeEvent: (id: string) => void
  updateEvent: (updatedEvent: CalendarEvent) => void
  
  updateRecurringEvent: (
    originId: string,
    originalStart: string, // 该实例原本的开始时间 (用于计算 exdate 或 偏移量)
    updatedInstance: CalendarEvent, // 用户修改后的实例数据 (包含新时间)
    mode: UpdateMode
  ) => void
  
  resetToMock: () => void
  clearAll: () => void
}

export const useEventStore = create<EventStore>()(
  persist(
    (set, get) => ({
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

      // 🧠 修复后的重复日程核心算法
      updateRecurringEvent: (originId: string, originalStart: string, updatedInstance: CalendarEvent, mode: UpdateMode) => {
        set((state) => {
          const events = [...state.events]
          const masterIndex = events.findIndex(e => e.id === originId)
          if (masterIndex === -1) return { events }

          const masterEvent = events[masterIndex]
          const newId = Math.random().toString(36).substr(2, 9)

          // 清理运行时字段
          const cleanInstance = { ...updatedInstance }
          delete cleanInstance._isInstance
          delete cleanInstance._originalId

          if (mode === 'single') {
            // 🏷 模式 1：仅此日程 (无变化)
            // 1. 母日程加黑名单
            const exdates = masterEvent.exdates ? [...masterEvent.exdates] : []
            exdates.push(originalStart)
            events[masterIndex] = { ...masterEvent, exdates }

            // 2. 新建独立日程
            const singleEvent: CalendarEvent = {
              ...cleanInstance,
              id: newId,
              rrule: undefined,
              exdates: undefined,
            }
            events.push(singleEvent)

          } else if (mode === 'future') {
            // 🏷 模式 2：将来所有 (修复逻辑)
            // 1. 截断旧日程 (Until = 昨天)
            const untilDate = subDays(parseISO(originalStart), 1)
            
            // 确保保留原有的频率设置
            let newMasterRrule = typeof masterEvent.rrule === 'string' 
              ? { freq: 'DAILY' } // 降级处理
              : { ...masterEvent.rrule }
            
            // @ts-ignore
            newMasterRrule.until = untilDate.toISOString()

            events[masterIndex] = {
              ...masterEvent,
              // @ts-ignore
              rrule: newMasterRrule
            }

            // 2. 创建新系列 (Start = 新的当前时间)
            const futureSeries: CalendarEvent = {
              ...masterEvent, // 继承母日程的基础信息 (颜色、标题等)
              ...cleanInstance, // 覆盖新的信息 (如新的开始时间、新的标题)
              id: newId,
              exdates: [], // 新系列清空历史黑名单
              // rrule 继承母日程的频率，但直到 infinite (或者原 master 的 until)
              // 注意：这里我们假设直接继承原 rule 的 freq/interval，去掉 until
              // @ts-ignore
              rrule: { ...masterEvent.rrule, until: undefined } 
            }
            events.push(futureSeries)

          } else if (mode === 'all') {
            // 🏷 模式 3：所有日程 (⚡️ 核心修复)
            // ❌ 错误做法：直接 events[masterIndex] = { ...masterEvent, ...cleanInstance }
            // 这会导致 startDate 变成今天，从而丢失过去日期的日程

            // ✅ 正确做法：计算时间偏移量，平移母日程
            const oldInstanceDate = parseISO(originalStart)
            const newInstanceDate = parseISO(updatedInstance.startDate)
            
            // 计算偏移量 (毫秒)
            const diff = differenceInMilliseconds(newInstanceDate, oldInstanceDate)

            // 应用偏移量到母日程的 Start 和 End
            const newMasterStart = addMilliseconds(parseISO(masterEvent.startDate), diff)
            const newMasterEnd = addMilliseconds(parseISO(masterEvent.endDate), diff)

            events[masterIndex] = {
              ...masterEvent,
              // 应用平移后的时间
              startDate: newMasterStart.toISOString(),
              endDate: newMasterEnd.toISOString(),
              // 应用其他可能修改的属性 (如标题、颜色)，但不包括 id/rrule
              title: cleanInstance.title,
              color: cleanInstance.color,
              location: cleanInstance.location,
              description: cleanInstance.description,
            }
          }

          return { events }
        })
      },

      resetToMock: () => set({ events: MOCK_EVENTS }),
      clearAll: () => set({ events: [] }),
    }),
    {
      name: 'calendar-event-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state && state.events.length === 0) {
          console.log('[EventStore] No local data found, loading MOCK_EVENTS')
          state.resetToMock()
        }
      },
    }
  )
)