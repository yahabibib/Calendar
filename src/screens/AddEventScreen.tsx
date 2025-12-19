// src/screens/AddEventScreen.tsx
import React, { useState, useLayoutEffect } from 'react'
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'

// Hooks & Types
import { useEventForm } from '../features/event/hooks/useEventForm'
import { RecurrenceFrequency } from '../types/event'

// Components
import { TitleLocationGroup } from '../features/event/components/FormGroups/TitleLocationGroup'
import { TimeDurationGroup } from '../features/event/components/FormGroups/TimeDurationGroup'
import { OptionsGroup } from '../features/event/components/FormGroups/OptionsGroup'
import { MetaGroup } from '../features/event/components/FormGroups/MetaGroup'

// Modals
import { SelectionModal } from '../features/event/components/Modals/SelectionModal'
import { CustomRepeatModal } from '../features/event/components/Modals/CustomRepeatModal'
import { CustomAlarmModal } from '../features/event/components/Modals/CustomAlarmModal'

// Constants
const REPEAT_PRESETS = [
  { label: 'Never', value: null },
  { label: 'Daily', value: 'DAILY' },
  { label: 'Weekly', value: 'WEEKLY' },
  { label: 'Monthly', value: 'MONTHLY' },
  { label: 'Yearly', value: 'YEARLY' },
  { label: 'Custom...', value: 'CUSTOM' },
]

const ALARM_PRESETS = [
  { label: 'None', value: null },
  { label: 'At time of event', value: 0 },
  { label: '5 minutes before', value: 5 },
  { label: '15 minutes before', value: 15 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '1 day before', value: 1440 },
  { label: 'Custom...', value: -1 },
]

const CALENDAR_OPTIONS = [
  { label: 'Default', value: 'Default', color: '#2196F3' },
  { label: 'Work', value: 'Work', color: '#FF9800' },
  { label: 'Home', value: 'Home', color: '#4CAF50' },
]

export const AddEventScreen = () => {
  const navigation = useNavigation()
  const route = useRoute<any>()
  const { initialDate } = route.params || {}

  // 1. Initialize Logic Hook
  const { form, labels, actions } = useEventForm(initialDate)

  // 2. UI Control State (Modals)
  const [modalType, setModalType] = useState<
    'repeat' | 'repeat_custom' | 'alarm' | 'alarm_custom' | 'calendar' | null
  >(null)

  // 3. Header Configuration
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'New Event',
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            if (actions.saveEvent()) navigation.goBack()
          }}
          style={styles.headerBtn}
          disabled={!form.title.trim()}>
          <Text style={[styles.checkIcon, !form.title.trim() && styles.disabledIcon]}>✓</Text>
        </TouchableOpacity>
      ),
      headerStyle: { backgroundColor: '#f2f2f6', shadowOpacity: 0 },
    })
  }, [navigation, form.title, actions])

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <TitleLocationGroup
          title={form.title}
          onChangeTitle={form.setTitle}
          location={form.location}
          onChangeLocation={form.setLocation}
        />

        <TimeDurationGroup
          isAllDay={form.isAllDay}
          onToggleAllDay={form.setIsAllDay}
          startDate={form.startDate}
          onStartDateChange={form.setStartDate}
          endDate={form.endDate}
          onEndDateChange={form.setEndDate}
        />

        <OptionsGroup
          repeatLabel={labels.repeatLabel}
          onPressRepeat={() => setModalType('repeat')}
          calendarLabel={form.selectedCalendar.label}
          calendarColor={form.selectedCalendar.color}
          onPressCalendar={() => setModalType('calendar')}
          alarmLabel={labels.alarmLabel}
          onPressAlarm={() => setModalType('alarm')}
        />

        <MetaGroup
          url={form.url}
          onChangeUrl={form.setUrl}
          description={form.description}
          onChangeDescription={form.setDescription}
        />
      </ScrollView>

      {/* --- Modals --- */}

      {/* 1. Repeat Selection */}
      <SelectionModal
        visible={modalType === 'repeat'}
        title="Repeat"
        options={REPEAT_PRESETS as any}
        selectedValue={form.rruleFreq}
        onSelect={val => {
          form.setRruleFreq(val as RecurrenceFrequency | null)
          // Reset custom fields when picking a preset
          form.setCustomInterval('1')
          form.setCustomUntil(null)
        }}
        onClose={() => setModalType(null)}
        onCustomSelect={() => setModalType('repeat_custom')}
        customValueToken="CUSTOM"
      />

      {/* 2. Custom Repeat Config */}
      <CustomRepeatModal
        visible={modalType === 'repeat_custom'}
        onClose={() => setModalType(null)} // Or back to 'repeat'
        onConfirm={(freq, interval, until) => {
          form.setRruleFreq(freq)
          form.setCustomInterval(interval)
          form.setCustomUntil(until)
        }}
        initialFreq={form.rruleFreq}
        initialInterval={form.customInterval}
        initialUntil={form.customUntil}
      />

      {/* 3. Calendar Selection */}
      <SelectionModal
        visible={modalType === 'calendar'}
        title="Calendar"
        options={CALENDAR_OPTIONS}
        selectedValue={form.selectedCalendar.value}
        onSelect={val => {
          const cal = CALENDAR_OPTIONS.find(c => c.value === val)
          if (cal) form.setSelectedCalendar(cal)
        }}
        onClose={() => setModalType(null)}
      />

      {/* 4. Alarm Selection */}
      <SelectionModal
        visible={modalType === 'alarm'}
        title="Alert"
        options={ALARM_PRESETS}
        selectedValue={form.alarmOffset}
        onSelect={val => form.setAlarmOffset(val)}
        onClose={() => setModalType(null)}
        onCustomSelect={() => setModalType('alarm_custom')}
        customValueToken={-1}
      />

      {/* 5. Custom Alarm Config */}
      <CustomAlarmModal
        visible={modalType === 'alarm_custom'}
        onClose={() => setModalType(null)}
        onConfirm={minutes => form.setAlarmOffset(minutes)}
      />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f6' },
  headerBtn: { padding: 8 },
  closeIcon: { fontSize: 22, color: '#8e8e93', fontWeight: 'bold' },
  checkIcon: { fontSize: 24, color: '#007AFF', fontWeight: 'bold' },
  disabledIcon: { color: '#d1d1d6' },
})
