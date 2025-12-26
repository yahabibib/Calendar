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
    mode: UpdateMode,
  ) => void

  // 核心：处理重复日程的删除
  deleteRecurringEvent: (originId: string, originalStart: string, mode: DeleteMode) => void

  resetToMock: () => void
  clearAll: () => void
}

export const useEventStore = create<EventStore>()(
  persist(
    (set, get) => ({
      events: [],
      // 添加日程
      addEvent: newEvent => {
        set(state => ({ events: [...state.events, newEvent] }))
        // 添加提醒
        notificationService.scheduleEvent(newEvent)
      },
      // 删除日程
      removeEvent: id => {
        set(state => ({ events: state.events.filter(e => e.id !== id) }))
        // 取消提醒
        notificationService.cancelEvent(id)
      },
      // 编辑日程
      updateEvent: updatedEvent => {
        set(state => ({
          events: state.events.map(e => (e.id === updatedEvent.id ? updatedEvent : e)),
        }))
        // 重新调度提醒
        notificationService.scheduleEvent(updatedEvent)
      },
      // 编辑重复日程
      updateRecurringEvent: (originId, originalStart, updatedInstance, mode) => {
        set(state => {
          // 日程浅拷贝
          const events = [...state.events]
          // 母日程索引
          const masterIndex = events.findIndex(e => e.id === originId)
          if (masterIndex === -1) return { events }
          // 母日程实例
          const masterEvent = events[masterIndex]
          // 生成新的 UUID
          const newId = uuid.v4() as string
          // 清理运行时字段 (防止污染数据库)
          const cleanInstance = { ...updatedInstance }
          delete cleanInstance._isInstance
          delete cleanInstance._originalId

          // -- 仅此日程 --
          if (mode === 'single') {
            // 母日程：添加黑名单 (屏蔽旧影子)
            const exdates = masterEvent.exdates ? [...masterEvent.exdates] : []
            exdates.push(originalStart)
            events[masterIndex] = { ...masterEvent, exdates }
            // 提醒重新调度
            notificationService.scheduleEvent(events[masterIndex])
            // 新日程：创建链接式例外
            const exceptionEvent: CalendarEvent = {
              ...cleanInstance,
              id: newId,
              rrule: undefined, // 仅此日程默认为不重复，即例外无规则
              exdates: undefined, // 例外没有黑名单
              // 建立链接
              recurringEventId: originId,
              originalStartTime: originalStart,
            }
            events.push(exceptionEvent)
            // 更新该日程提醒
            notificationService.scheduleEvent(exceptionEvent)
          } else if (mode === 'future') {
            // -- 将来所有 --
            // 截断 (Until = 昨天)
            const untilDate = subDays(parseISO(originalStart), 1)
            // 确保 rrule 是对象格式以便修改
            let newMasterRrule =
              typeof masterEvent.rrule === 'string'
                ? { freq: 'DAILY' } // 兜底，实际应解析字符串
                : { ...masterEvent.rrule }
            // 历史重复规则结束时间修改到截断那天
            // @ts-ignore
            newMasterRrule.until = untilDate.toISOString()
            events[masterIndex] = {
              ...masterEvent,
              // @ts-ignore
              rrule: newMasterRrule,
            }
            // 历史母日程变更，重新调度提醒
            notificationService.scheduleEvent(events[masterIndex])

            // 完全独立的新母日程
            const futureSeries: CalendarEvent = {
              ...masterEvent, // 继承原母日程的基础属性
              ...cleanInstance, // 覆盖所有新属性 (包括 rrule)
              id: newId, // 全新 UUID
              exdates: [], // 新系列清空历史黑名单
            }
            // 添加新母日程
            events.push(futureSeries)
            // 调度新系列的提醒
            notificationService.scheduleEvent(futureSeries)
          } else if (mode === 'all') {
            // -- 所有日程 --
            // 计算开始时间的偏移量
            const oldInstanceStart = parseISO(originalStart)
            const newInstanceStart = parseISO(updatedInstance.startDate)
            const startDiff = differenceInMilliseconds(newInstanceStart, oldInstanceStart)
            // 计算新的时长
            const newInstanceEnd = parseISO(updatedInstance.endDate)
            const newDuration = differenceInMilliseconds(newInstanceEnd, newInstanceStart)
            // 应用到母日程
            const newMasterStart = addMilliseconds(parseISO(masterEvent.startDate), startDiff)
            const newMasterEnd = addMilliseconds(newMasterStart, newDuration)
            // 更新全量母日程
            events[masterIndex] = {
              ...masterEvent,
              ...cleanInstance,
              id: masterEvent.id,
              startDate: newMasterStart.toISOString(),
              endDate: newMasterEnd.toISOString(),
              exdates: masterEvent.exdates,
            }
            // 调度全量母日程提醒
            notificationService.scheduleEvent(events[masterIndex])
          }
          return { events }
        })
      },
      // 重复日程
      deleteRecurringEvent: (originId, originalStart, mode) => {
        set(state => {
          const events = [...state.events]
          const masterIndex = events.findIndex(e => e.id === originId)
          if (masterIndex === -1) return { events }
          const masterEvent = events[masterIndex]
          // -- 仅此日程 --
          if (mode === 'single') {
            const exdates = masterEvent.exdates ? [...masterEvent.exdates] : []
            exdates.push(originalStart)
            events[masterIndex] = { ...masterEvent, exdates }
            notificationService.scheduleEvent(events[masterIndex])
          } else if (mode === 'future') {
            // -- 将来所有 --
            const untilDate = subDays(parseISO(originalStart), 1)
            let newMasterRrule =
              typeof masterEvent.rrule === 'string' ? { freq: 'DAILY' } : { ...masterEvent.rrule }
            // @ts-ignore
            newMasterRrule.until = untilDate.toISOString()
            events[masterIndex] = {
              ...masterEvent,
              // @ts-ignore
              rrule: newMasterRrule,
            }
            notificationService.scheduleEvent(events[masterIndex])
          }
          return { events }
        })
      },
      resetToMock: () => {
        set({ events: MOCK_EVENTS })
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
      onRehydrateStorage: () => state => {
        if (state) {
          // App 启动/重载时，初始化通知渠道
          notificationService.createChannel()
          notificationService.requestPermission()
          if (state.events.length === 0) {
            state.resetToMock()
          }
        }
      },
    },
  ),
)
