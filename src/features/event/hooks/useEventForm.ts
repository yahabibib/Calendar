// src/features/event/hooks/useEventForm.ts
import { useState, useCallback } from 'react'
import { Alert } from 'react-native'
import { addHours, isBefore, format } from 'date-fns'
import { useEventStore } from '../../../store/eventStore'
import { CalendarEvent, RecurrenceFrequency, RecurrenceRule } from '../../../types/event'

export const useEventForm = (initialDateStr?: string) => {
  const addEvent = useEventStore((state) => state.addEvent)

  // --- State Definitions ---
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  
  // Date Logic
  const [startDate, setStartDate] = useState(() => initialDateStr ? new Date(initialDateStr) : new Date())
  const [endDate, setEndDate] = useState(() => addHours(initialDateStr ? new Date(initialDateStr) : new Date(), 1))
  const [isAllDay, setIsAllDay] = useState(false)
  
  // Options
  const [selectedCalendar, setSelectedCalendar] = useState({ label: 'Default', value: 'Default', color: '#2196F3' })
  const [rruleFreq, setRruleFreq] = useState<RecurrenceFrequency | null>(null)
  const [customInterval, setCustomInterval] = useState('1')
  const [customUntil, setCustomUntil] = useState<Date | null>(null)
  const [alarmOffset, setAlarmOffset] = useState<number | null>(null)

  // --- Logic Handlers ---

  const handleStartDateChange = useCallback((date: Date) => {
    setStartDate(date)
    // Intelligent End Date: If new start is after end, push end to start + 1h
    if (isBefore(endDate, date)) {
      setEndDate(addHours(date, 1))
    }
  }, [endDate])

  // Helper to generate display labels
  const getRepeatLabel = () => {
    if (!rruleFreq) return 'Never'
    const unitMap: Record<string, string> = { DAILY: 'Day', WEEKLY: 'Week', MONTHLY: 'Month', YEARLY: 'Year' }
    if (customInterval === '1' && !customUntil) {
       // Simple map or capitalize
       const map: Record<string, string> = { DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly', YEARLY: 'Yearly' }
       return map[rruleFreq] || rruleFreq
    }
    let text = `Every ${customInterval} ${unitMap[rruleFreq]}`
    if (customUntil) text += ` (until ${format(customUntil, 'MM-dd')})`
    return text
  }

  const getAlarmLabel = () => {
    if (alarmOffset === null) return 'None'
    if (alarmOffset === 0) return 'At time of event'
    if (alarmOffset < 60) return `${alarmOffset} minutes before`
    if (alarmOffset % 1440 === 0) return `${alarmOffset / 1440} days before`
    if (alarmOffset % 60 === 0) return `${alarmOffset / 60} hours before`
    return `${alarmOffset} minutes before`
  }

  const saveEvent = () => {
    if (!title.trim()) {
      return false // Validation failed
    }
    if (isBefore(endDate, startDate) && !isAllDay) {
      Alert.alert('Invalid Time', 'End time cannot be before start time.')
      return false
    }

    // Build RRULE
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
    return true // Success
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