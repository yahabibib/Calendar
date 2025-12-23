import { useState, useCallback } from 'react'
import { Alert } from 'react-native'
import { addHours, isBefore, format } from 'date-fns'
import uuid from 'react-native-uuid'
import { useEventStore } from '../../../store/eventStore'
import { CalendarEvent, RecurrenceFrequency, RecurrenceRule } from '../../../types/event'

// 辅助：解析 RRULE 对象 (保持不变)
const parseRrule = (rrule?: RecurrenceRule | string) => {
  if (!rrule) return { freq: null, interval: '1', until: null }
  if (typeof rrule === 'string') {
    return { freq: 'DAILY' as RecurrenceFrequency, interval: '1', until: null }
  }
  return {
    freq: rrule.freq,
    interval: rrule.interval?.toString() || '1',
    until: rrule.until ? new Date(rrule.until) : null,
  }
}

export const useEventForm = (initialDateStr?: string, event?: CalendarEvent) => {
  const addEvent = useEventStore(state => state.addEvent)
  const updateEvent = useEventStore(state => state.updateEvent)
  const updateRecurringEvent = useEventStore(state => state.updateRecurringEvent)

  // --- 初始化数据 (保持不变) ---
  const initialRrule = parseRrule(event?.rrule)
  
  const [title, setTitle] = useState(event?.title || '')
  const [location, setLocation] = useState(event?.location || '')
  const [description, setDescription] = useState(event?.description || '')
  const [url, setUrl] = useState(event?.url || '')
  
  const [startDate, setStartDate] = useState(() => 
    event ? new Date(event.startDate) : (initialDateStr ? new Date(initialDateStr) : new Date())
  )
  const [endDate, setEndDate] = useState(() => 
    event ? new Date(event.endDate) : addHours(initialDateStr ? new Date(initialDateStr) : new Date(), 1)
  )
  const [isAllDay, setIsAllDay] = useState(event?.isAllDay || false)
  
  const [selectedCalendar, setSelectedCalendar] = useState({ 
    label: event?.calendarId === 'Work' ? '工作' : event?.calendarId === 'Home' ? '家庭' : '默认日历', 
    value: event?.calendarId || 'Default', 
    color: event?.color || '#2196F3' 
  })
  
  const [rruleFreq, setRruleFreq] = useState<RecurrenceFrequency | null>(initialRrule.freq)
  const [customInterval, setCustomInterval] = useState(initialRrule.interval)
  const [customUntil, setCustomUntil] = useState<Date | null>(initialRrule.until)
  const [alarmOffset, setAlarmOffset] = useState<number | null>(event?.alarms?.[0] ?? null)

  // --- Handlers (保持不变) ---
  const handleStartDateChange = useCallback((date: Date) => {
    setStartDate(date)
    if (isBefore(endDate, date)) {
      setEndDate(addHours(date, 1))
    }
  }, [endDate])

  const getRepeatLabel = () => {
    if (!rruleFreq) return '从不'
    const unitMap: Record<string, string> = { DAILY: '天', WEEKLY: '周', MONTHLY: '月', YEARLY: '年' }
    if (customInterval === '1' && !customUntil) {
       const map: Record<string, string> = { DAILY: '每天', WEEKLY: '每周', MONTHLY: '每月', YEARLY: '每年' }
       return map[rruleFreq] || rruleFreq
    }
    let text = `每 ${customInterval} ${unitMap[rruleFreq]}`
    if (customUntil) text += ` (截止 ${format(customUntil, 'MM-dd')})`
    return text
  }

  const getAlarmLabel = () => {
    if (alarmOffset === null) return '无'
    if (alarmOffset === 0) return '日程发生时'
    if (alarmOffset < 60) return `${alarmOffset} 分钟前`
    if (alarmOffset % 1440 === 0) return `${alarmOffset / 1440} 天前`
    if (alarmOffset % 60 === 0) return `${alarmOffset / 60} 小时前`
    return `${alarmOffset} 分钟前`
  }

  const saveEvent = (onSuccess: () => void) => {
    if (!title.trim()) return // 校验失败，什么都不做
    if (isBefore(endDate, startDate) && !isAllDay) {
      Alert.alert('时间错误', '结束时间不能早于开始时间')
      return 
    }

    // 构建 RRULE
    let rrule: RecurrenceRule | undefined = undefined
    if (rruleFreq) {
      rrule = {
        freq: rruleFreq,
        interval: parseInt(customInterval) > 1 ? parseInt(customInterval) : undefined,
        until: customUntil ? customUntil.toISOString() : undefined
      }
    }

    const newEventData: CalendarEvent = {
      id: event?.id || (uuid.v4() as string),
      title: title.trim(),
      location: location.trim(),
      description: description.trim(),
      url: url.trim(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      isAllDay,
      color: selectedCalendar.color,
      calendarId: selectedCalendar.value,
      rrule,
      alarms: alarmOffset !== null ? [alarmOffset] : [],
      _isInstance: event?._isInstance,
      _originalId: event?._originalId,
    }

    // 💾 保存逻辑
    if (event) {
      // 🅰️ 编辑模式
      if (event._isInstance && event._originalId) {
        // 🚨 场景：编辑重复日程实例 -> 必须等待用户选择
        Alert.alert('修改重复日程', '您想仅修改此日程，还是修改该系列？', [
          { 
            text: '取消', 
            style: 'cancel',
            // onPress: 不做任何事，页面保持打开，不调用 onSuccess
          },
          { 
            text: '仅此日程', 
            onPress: () => {
              updateRecurringEvent(event._originalId!, event.startDate, newEventData, 'single')
              onSuccess() // ✅ 只有执行了逻辑后，才关闭页面
            }
          },
          { 
            text: '将来所有', 
            onPress: () => {
              updateRecurringEvent(event._originalId!, event.startDate, newEventData, 'future') 
              onSuccess() // ✅ 关闭页面
            }
          },
          { 
            text: '所有日程', 
            style: 'destructive',
            onPress: () => {
              updateRecurringEvent(event._originalId!, event.startDate, newEventData, 'all') 
              onSuccess() // ✅ 关闭页面
            }
          },
        ])
        return // 🚨 关键：直接返回，阻断后续的普通保存逻辑
      } 
      
      // 场景：编辑普通日程 或 母日程
      updateEvent(newEventData)
      onSuccess() // ✅ 立即关闭

    } else {
      // 🅱️ 新建模式
      addEvent(newEventData)
      onSuccess() // ✅ 立即关闭
    }
  }

  return {
    form: {
      title, setTitle,
      location, setLocation,
      description, setDescription,
      url, setUrl,
      startDate, setStartDate: handleStartDateChange,
      endDate, setEndDate,
      isAllDay, setIsAllDay,
      selectedCalendar, setSelectedCalendar,
      rruleFreq, setRruleFreq,
      customInterval, setCustomInterval,
      customUntil, setCustomUntil,
      alarmOffset, setAlarmOffset,
    },
    labels: {
      repeatLabel: getRepeatLabel(),
      alarmLabel: getAlarmLabel(),
    },
    actions: {
      saveEvent,
    }
  }
}