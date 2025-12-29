import { useState, useCallback, useMemo } from 'react'
import { Alert } from 'react-native'
import { addHours, isBefore, format } from 'date-fns'
import uuid from 'react-native-uuid'
import { useEventStore } from '@/store/eventStore'
import { CalendarEvent, RecurrenceFrequency, RecurrenceRule } from '@/types/event'
import { formatRecurrence } from '@/utils/rruleFormatter'

export const useEventForm = (initialDateStr?: string, event?: Partial<CalendarEvent>) => {
  const addEvent = useEventStore(state => state.addEvent)
  const updateEvent = useEventStore(state => state.updateEvent)
  const updateRecurringEvent = useEventStore(state => state.updateRecurringEvent)

  // === 1. 基础表单状态 ===
  const [title, setTitle] = useState(event?.title || '')
  const [location, setLocation] = useState(event?.location || '')
  const [description, setDescription] = useState(event?.description || '')
  const [url, setUrl] = useState(event?.url || '')

  const [startDate, setStartDate] = useState(() =>
    event?.startDate
      ? new Date(event.startDate)
      : initialDateStr
      ? new Date(initialDateStr)
      : new Date(),
  )
  const [endDate, setEndDate] = useState(() =>
    event?.endDate
      ? new Date(event.endDate)
      : addHours(
          event?.startDate
            ? new Date(event.startDate)
            : initialDateStr
            ? new Date(initialDateStr)
            : new Date(),
          1,
        ),
  )
  const [isAllDay, setIsAllDay] = useState(event?.isAllDay || false)
  const [selectedCalendar, setSelectedCalendar] = useState({
    label:
      event?.calendarId === 'Work' ? '工作' : event?.calendarId === 'Home' ? '家庭' : '默认日历',
    value: event?.calendarId || 'Default',
    color: event?.color || '#2196F3',
  })
  const [alarmOffset, setAlarmOffset] = useState<number | null>(event?.alarms?.[0] ?? null)

  // === 2. 核心：统一的 RRule 状态管理 ===
  // 这是 UI 和逻辑的 Source of Truth
  const [rruleState, setRruleState] = useState<{
    freq: RecurrenceFrequency | null // null 表示“不重复”
    interval: string
    until: Date | null
    // 周模式字段
    byDay: string[] // ['MO', 'WE']
    // 月模式字段
    byMonthDay: number[] // [1, 15]
    // 月模式-高级字段
    isMonthByDay: boolean // true=按星期(+1MO), false=按日期(1号)
    byDayPos: string | null // "+1MO"
  }>(() => {
    // --- 初始化逻辑：从 event 解析 ---
    if (!event?.rrule) {
      return {
        freq: null,
        interval: '1',
        until: null,
        byDay: [],
        byMonthDay: [],
        isMonthByDay: false,
        byDayPos: '+1MO',
      }
    }

    // 暂不支持字符串 RRule 的完美回显，降级为 Daily
    if (typeof event.rrule === 'string') {
      return {
        freq: 'DAILY',
        interval: '1',
        until: null,
        byDay: [],
        byMonthDay: [],
        isMonthByDay: false,
        byDayPos: '+1MO',
      }
    }

    const r = event.rrule
    let isMonthByDay = false
    let byDayPos = '+1MO' // 默认值

    // 智能识别：如果是月模式且包含 byDay，说明是“每月第一个周一”这种格式
    if (r.freq === 'MONTHLY' && r.byDay && r.byDay.length > 0) {
      isMonthByDay = true
      byDayPos = r.byDay[0] // 取第一个作为初始值
    }

    return {
      freq: r.freq,
      interval: r.interval?.toString() || '1',
      until: r.until ? new Date(r.until) : null,
      byDay: r.byDay || [], // AI 生成的 ["WE"] 会直接填入这里
      byMonthDay: r.byMonthDay || [],
      isMonthByDay,
      byDayPos,
    }
  })

  // === 3. 辅助 Handler ===
  const handleStartDateChange = useCallback(
    (date: Date) => {
      setStartDate(date)
      if (isBefore(endDate, date)) setEndDate(addHours(date, 1))
    },
    [endDate],
  )

  // === 4. 动态 Label 生成 ===
  const getRepeatLabel = () => {
    const { freq, interval, until, byDay, byMonthDay, isMonthByDay, byDayPos } = rruleState

    if (!freq) return '从不'

    let text = ''
    const intVal = parseInt(interval)
    const isSingle = intVal === 1

    // 基础部分
    const unitMap: Record<string, string> = {
      DAILY: '天',
      WEEKLY: '周',
      MONTHLY: '月',
      YEARLY: '年',
    }

    if (isSingle) {
      const singleMap: Record<string, string> = {
        DAILY: '每天',
        WEEKLY: '每周',
        MONTHLY: '每月',
        YEARLY: '每年',
      }
      text = singleMap[freq] || freq
    } else {
      text = `每 ${interval} ${unitMap[freq]}`
    }

    // 扩展部分：根据高级字段补充描述
    if (freq === 'WEEKLY' && byDay.length > 0) {
      // 示例: "每周 周一、周三"
      const daysText = byDay.map(d => DAY_MAP[d] || d).join('、')
      text += ` ${daysText}`
    } else if (freq === 'MONTHLY') {
      if (!isMonthByDay && byMonthDay.length > 0) {
        // 示例: "每月 1、15号"
        text += ` ${byMonthDay.join('、')}号`
      } else if (isMonthByDay && byDayPos) {
        // 示例: "每月 第一个 周一"
        text += ` ${formatPosDay(byDayPos)}`
      }
    }

    if (until) text += ` (截止 ${format(until, 'yyyy/M/d')})`
    return text
  }

  const currentRruleObject = useMemo((): RecurrenceRule | undefined => {
    if (!rruleState.freq) return undefined

    const rrule: RecurrenceRule = {
      freq: rruleState.freq,
      interval: parseInt(rruleState.interval) > 1 ? parseInt(rruleState.interval) : undefined,
      until: rruleState.until ? rruleState.until.toISOString() : undefined,
    }

    // 注入高级字段 (逻辑与之前的 saveEvent 里一致)
    if (rruleState.freq === 'WEEKLY' && rruleState.byDay.length > 0) {
      rrule.byDay = rruleState.byDay
    } else if (rruleState.freq === 'MONTHLY') {
      if (rruleState.isMonthByDay && rruleState.byDayPos) {
        rrule.byDay = [rruleState.byDayPos]
      } else if (!rruleState.isMonthByDay && rruleState.byMonthDay.length > 0) {
        rrule.byMonthDay = rruleState.byMonthDay
      }
    }

    return rrule
  }, [rruleState]) // 只要 UI 状态变了，这个对象就变

  const repeatLabel = useMemo(() => {
    return formatRecurrence(currentRruleObject)
  }, [currentRruleObject])

  const getAlarmLabel = () => {
    if (alarmOffset === null) return '无'
    if (alarmOffset === 0) return '日程发生时'
    if (alarmOffset < 60) return `${alarmOffset} 分钟前`
    if (alarmOffset % 1440 === 0) return `${alarmOffset / 1440} 天前`
    if (alarmOffset % 60 === 0) return `${alarmOffset / 60} 小时前`
    return `${alarmOffset} 分钟前`
  }

  // === 5. 保存逻辑 ===
  const saveEvent = (onSuccess: () => void) => {
    if (!title.trim()) return
    if (isBefore(endDate, startDate) && !isAllDay) {
      Alert.alert('时间错误', '结束时间不能早于开始时间')
      return
    }

    // --- 构建 RRule 对象 ---
    let rrule: RecurrenceRule | undefined = undefined

    if (rruleState.freq) {
      rrule = {
        freq: rruleState.freq,
        interval: parseInt(rruleState.interval) > 1 ? parseInt(rruleState.interval) : undefined,
        until: rruleState.until ? rruleState.until.toISOString() : undefined,
      }

      // 根据频率注入高级字段
      if (rruleState.freq === 'WEEKLY' && rruleState.byDay.length > 0) {
        rrule.byDay = rruleState.byDay
      } else if (rruleState.freq === 'MONTHLY') {
        if (rruleState.isMonthByDay && rruleState.byDayPos) {
          // 月模式 - 按星期 (高级)
          rrule.byDay = [rruleState.byDayPos]
        } else if (!rruleState.isMonthByDay && rruleState.byMonthDay.length > 0) {
          // 月模式 - 按日期
          rrule.byMonthDay = rruleState.byMonthDay
        }
      }
    }

    const newEventData: CalendarEvent = {
      id: event?.id && !event.id.startsWith('temp-') ? event.id : (uuid.v4() as string),
      title: title.trim(),
      location: location.trim(),
      description: description.trim(),
      url: url.trim(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      isAllDay,
      color: selectedCalendar.color,
      calendarId: selectedCalendar.value,
      rrule: currentRruleObject,
      alarms: alarmOffset !== null ? [alarmOffset] : [],
      _isInstance: event?._isInstance,
      _originalId: event?._originalId,
    }

    // 区分新建/编辑 (temp-ai-id 视为新建)
    const isEditing = event && event.id && !event.id.startsWith('temp-ai-id')

    if (isEditing) {
      if (event._isInstance && event._originalId) {
        Alert.alert('修改重复日程', '您想仅修改此日程，还是修改该系列？', [
          { text: '取消', style: 'cancel' },
          {
            text: '仅此日程',
            onPress: () => {
              updateRecurringEvent(event._originalId!, event.startDate, newEventData, 'single')
              onSuccess()
            },
          },
          {
            text: '将来所有',
            onPress: () => {
              updateRecurringEvent(event._originalId!, event.startDate, newEventData, 'future')
              onSuccess()
            },
          },
          {
            text: '所有日程',
            style: 'destructive',
            onPress: () => {
              updateRecurringEvent(event._originalId!, event.startDate, newEventData, 'all')
              onSuccess()
            },
          },
        ])
        return
      }
      updateEvent(newEventData)
      onSuccess()
    } else {
      addEvent(newEventData)
      onSuccess()
    }
  }

  return {
    form: {
      title,
      setTitle,
      location,
      setLocation,
      description,
      setDescription,
      url,
      setUrl,
      startDate,
      setStartDate: handleStartDateChange,
      endDate,
      setEndDate,
      isAllDay,
      setIsAllDay,
      selectedCalendar,
      setSelectedCalendar,
      alarmOffset,
      setAlarmOffset,
    },
    // ✨ 导出新的 RRule 状态机
    rrule: {
      state: rruleState,
      setState: setRruleState,
      // 辅助：更新 state 的快捷方法
      update: (updates: Partial<typeof rruleState>) =>
        setRruleState(prev => ({ ...prev, ...updates })),
    },
    labels: {
      repeatLabel,
      alarmLabel: getAlarmLabel(),
    },
    actions: { saveEvent },
  }
}
