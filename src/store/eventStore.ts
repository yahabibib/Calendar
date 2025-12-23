import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { subDays, parseISO, differenceInMilliseconds, addMilliseconds } from 'date-fns'
import uuid from 'react-native-uuid'
import { CalendarEvent, MOCK_EVENTS } from '../types/event'
import { notificationService } from '../services/NotificationService'

export type UpdateMode = 'single' | 'future' | 'all'
export type DeleteMode = 'single' | 'future'

interface EventStore {
  events: CalendarEvent[]
  
  addEvent: (event: CalendarEvent) => void
  removeEvent: (id: string) => void
  updateEvent: (updatedEvent: CalendarEvent) => void
  
  // 核心：处理重复日程的编辑
  updateRecurringEvent: (
    originId: string,
    originalStart: string,
    updatedInstance: CalendarEvent,
    mode: UpdateMode
  ) => void
  
  // 核心：处理重复日程的删除
  deleteRecurringEvent: (
    originId: string, 
    originalStart: string, 
    mode: DeleteMode
  ) => void

  resetToMock: () => void
  clearAll: () => void
}

export const useEventStore = create<EventStore>()(
  persist(
    (set, get) => ({
      events: [],

      // --- 基础增删改查 ---

      addEvent: (newEvent) => {
        set((state) => ({ events: [...state.events, newEvent] }))
        // 🔔 调度提醒
        notificationService.scheduleEvent(newEvent)
      },

      removeEvent: (id) => {
        // 先获取目标用于可能的清理
        const target = get().events.find(e => e.id === id)
        set((state) => ({ events: state.events.filter((e) => e.id !== id) }))
        // 🔔 取消提醒
        notificationService.cancelEvent(id)
      },

      updateEvent: (updatedEvent) => {
        set((state) => ({
          events: state.events.map((e) => e.id === updatedEvent.id ? updatedEvent : e)
        }))
        // 🔔 重新调度 (内部会自动 cancel 旧的)
        notificationService.scheduleEvent(updatedEvent)
      },

      // --- 核心：重复日程编辑逻辑 ---

      updateRecurringEvent: (originId, originalStart, updatedInstance, mode) => {
        set((state) => {
          const events = [...state.events]
          const masterIndex = events.findIndex(e => e.id === originId)
          if (masterIndex === -1) return { events }

          const masterEvent = events[masterIndex]
          
          // ✨ 生成新的 UUID
          const newId = uuid.v4() as string

          // 🧹 清理运行时字段 (防止污染数据库)
          const cleanInstance = { ...updatedInstance }
          delete cleanInstance._isInstance
          delete cleanInstance._originalId

          if (mode === 'single') {
            // 🏷 模式 1：仅此日程 (Linked Exception)
            
            // A. 母日程：添加黑名单 (屏蔽旧影子)
            const exdates = masterEvent.exdates ? [...masterEvent.exdates] : []
            exdates.push(originalStart)
            events[masterIndex] = { ...masterEvent, exdates }
            
            // 🔔 母日程变更，重新调度 (主要是为了更新 exdates 逻辑，避免在这一天响铃)
            notificationService.scheduleEvent(events[masterIndex])

            // B. 新日程：创建链接式例外
            const exceptionEvent: CalendarEvent = {
              ...cleanInstance, 
              id: newId,        
              
              rrule: undefined,   // 例外本身通常不重复
              exdates: undefined, // 例外没有黑名单
              
              // ✨ 关键：建立链接
              recurringEventId: originId,
              originalStartTime: originalStart, 
            }
            events.push(exceptionEvent)
            
            // 🔔 调度新例外的提醒
            notificationService.scheduleEvent(exceptionEvent)

          } else if (mode === 'future') {
            // 🏷 模式 2：将来所有 (Split & New Series)
            
            // A. 母日程：截断 (Until = 昨天)
            const untilDate = subDays(parseISO(originalStart), 1)
            
            // 确保 rrule 是对象格式以便修改
            let newMasterRrule = typeof masterEvent.rrule === 'string' 
              ? { freq: 'DAILY' } // 兜底，实际应解析字符串
              : { ...masterEvent.rrule }
            
            // @ts-ignore
            newMasterRrule.until = untilDate.toISOString()

            events[masterIndex] = {
              ...masterEvent,
              // @ts-ignore
              rrule: newMasterRrule
            }
            
            // 🔔 母日程变更，重新调度 (限制了截止时间)
            notificationService.scheduleEvent(events[masterIndex])

            // B. 新系列：完全独立的新母日程
            const futureSeries: CalendarEvent = {
              ...masterEvent,   // 1. 继承原母日程的基础属性
              ...cleanInstance, // 2. 覆盖所有新属性 (包括 rrule!)
              // 注意：如果 cleanInstance.rrule 是 undefined (用户改为从不重复)，这里会正确覆盖
              
              id: newId,    // 全新 UUID
              exdates: [],  // 新系列清空历史黑名单
            }
            events.push(futureSeries)
            
            // 🔔 调度新系列的提醒
            notificationService.scheduleEvent(futureSeries)

          } else if (mode === 'all') {
            // 🏷 模式 3：所有日程 (Rewrite History)
            
            // 计算时间偏移量 (Diff)
            const oldInstanceDate = parseISO(originalStart)
            const newInstanceDate = parseISO(updatedInstance.startDate)
            const diff = differenceInMilliseconds(newInstanceDate, oldInstanceDate)

            // 应用偏移量到母日程
            const newMasterStart = addMilliseconds(parseISO(masterEvent.startDate), diff)
            const newMasterEnd = addMilliseconds(parseISO(masterEvent.endDate), diff)

            events[masterIndex] = {
              ...masterEvent,     // 1. 底层继承
              ...cleanInstance,   // 2. 应用所有修改 (包括 rrule)
              
              // 3. 强制修正时间：必须使用平移后的时间，不能直接用 instance 的时间
              id: masterEvent.id, // ID 不变
              startDate: newMasterStart.toISOString(),
              endDate: newMasterEnd.toISOString(),
              
              // 通常保留原有的 exdates (除非业务决定重置例外)
              exdates: masterEvent.exdates, 
            }
            
            // 🔔 母日程变更，重新调度
            notificationService.scheduleEvent(events[masterIndex])
          }

          return { events }
        })
      },

      // --- 核心：重复日程删除逻辑 ---

      deleteRecurringEvent: (originId, originalStart, mode) => {
        set((state) => {
          const events = [...state.events]
          const masterIndex = events.findIndex(e => e.id === originId)
          if (masterIndex === -1) return { events }

          const masterEvent = events[masterIndex]

          if (mode === 'single') {
            // 🏷 模式 1：仅此日程 -> 加黑名单
            const exdates = masterEvent.exdates ? [...masterEvent.exdates] : []
            exdates.push(originalStart)
            events[masterIndex] = { ...masterEvent, exdates }
            
            // 🔔 更新提醒 (移除这一天的响铃)
            notificationService.scheduleEvent(events[masterIndex])
          } 
          else if (mode === 'future') {
            // 🏷 模式 2：将来所有 -> 截断
            const untilDate = subDays(parseISO(originalStart), 1)
            
            let newMasterRrule = typeof masterEvent.rrule === 'string' 
              ? { freq: 'DAILY' } 
              : { ...masterEvent.rrule }
            
            // @ts-ignore
            newMasterRrule.until = untilDate.toISOString()

            events[masterIndex] = {
              ...masterEvent,
              // @ts-ignore
              rrule: newMasterRrule
            }
            
            // 🔔 更新提醒 (未来不再响铃)
            notificationService.scheduleEvent(events[masterIndex])
          }

          return { events }
        })
      },

      resetToMock: () => {
        set({ events: MOCK_EVENTS })
        // MOCK 数据通常不自动注册通知，避免打扰，或者也可以遍历注册
        MOCK_EVENTS.forEach(e => notificationService.scheduleEvent(e))
      },
      
      clearAll: () => {
        const allEvents = get().events
        set({ events: [] })
        // 取消所有通知
        allEvents.forEach(e => notificationService.cancelEvent(e.id))
      },
    }),
    {
      name: 'calendar-event-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // App 启动/重载时，初始化通知渠道
          notificationService.createChannel()
          notificationService.requestPermission()
          
          if (state.events.length === 0) {
            state.resetToMock()
          }
        }
      },
    }
  )
)