import { useState, useCallback } from 'react'
import { Alert } from 'react-native'
import { addHours, isBefore, format } from 'date-fns'
import { useEventStore } from '../../../store/eventStore'
import { CalendarEvent, RecurrenceFrequency, RecurrenceRule } from '../../../types/event'

export const useEventForm = (initialDateStr?: string) => {
  const addEvent = useEventStore((state) => state.addEvent)

  // --- State ---
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  
  // 时间逻辑
  const [startDate, setStartDate] = useState(() => initialDateStr ? new Date(initialDateStr) : new Date())
  const [endDate, setEndDate] = useState(() => addHours(initialDateStr ? new Date(initialDateStr) : new Date(), 1))
  const [isAllDay, setIsAllDay] = useState(false)
  
  // 选项
  const [selectedCalendar, setSelectedCalendar] = useState({ label: '默认日历', value: 'Default', color: '#2196F3' })
  const [rruleFreq, setRruleFreq] = useState<RecurrenceFrequency | null>(null)
  const [customInterval, setCustomInterval] = useState('1')
  const [customUntil, setCustomUntil] = useState<Date | null>(null)
  const [alarmOffset, setAlarmOffset] = useState<number | null>(null)

  // --- Handlers ---

  const handleStartDateChange = useCallback((date: Date) => {
    setStartDate(date)
    // 智能结束时间：如果开始时间晚于结束时间，自动把结束时间推后1小时
    if (isBefore(endDate, date)) {
      setEndDate(addHours(date, 1))
    }
  }, [endDate])

  // 生成重复规则的中文描述
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

  // 生成提醒的中文描述
  const getAlarmLabel = () => {
    if (alarmOffset === null) return '无'
    if (alarmOffset === 0) return '日程发生时'
    if (alarmOffset < 60) return `${alarmOffset} 分钟前`
    if (alarmOffset % 1440 === 0) return `${alarmOffset / 1440} 天前`
    if (alarmOffset % 60 === 0) return `${alarmOffset / 60} 小时前`
    return `${alarmOffset} 分钟前`
  }

  const saveEvent = () => {
    if (!title.trim()) {
      return false // 校验失败，按钮应禁用
    }
    if (isBefore(endDate, startDate) && !isAllDay) {
      Alert.alert('时间错误', '结束时间不能早于开始时间')
      return false
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

    const newEvent: CalendarEvent = {
      id: Math.random().toString(),
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
    }

    addEvent(newEvent)
    return true // 成功
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