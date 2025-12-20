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
  { label: '从不', value: null },
  { label: '每天', value: 'DAILY' },
  { label: '每周', value: 'WEEKLY' },
  { label: '每月', value: 'MONTHLY' },
  { label: '每年', value: 'YEARLY' },
  { label: '自定义...', value: 'CUSTOM' },
]

const ALARM_PRESETS = [
  { label: '无', value: null },
  { label: '日程发生时', value: 0 },
  { label: '5 分钟前', value: 5 },
  { label: '15 分钟前', value: 15 },
  { label: '30 分钟前', value: 30 },
  { label: '1 小时前', value: 60 },
  { label: '1 天前', value: 1440 },
  { label: '自定义...', value: -1 },
]

const CALENDAR_OPTIONS = [
  { label: '默认日历', value: 'Default', color: '#2196F3' },
  { label: '工作', value: 'Work', color: '#FF9800' },
  { label: '家庭', value: 'Home', color: '#4CAF50' },
]

export const AddEventScreen = () => {
  const navigation = useNavigation()
  const route = useRoute<any>()
  const { initialDate } = route.params || {}

  const { form, labels, actions } = useEventForm(initialDate)
  const [modalType, setModalType] = useState<
    'repeat' | 'repeat_custom' | 'alarm' | 'alarm_custom' | 'calendar' | null
  >(null)

  // ✨ 关键修复：仅设置按钮，不修改样式属性（样式已在 AppNavigator 中静态定义）
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtnLeft}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // 扩大点击区域
        >
          <Text style={styles.headerBtnTextCancel}>取消</Text>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            if (actions.saveEvent()) navigation.goBack()
          }}
          style={styles.headerBtnRight}
          disabled={!form.title.trim()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={[styles.headerBtnTextSave, !form.title.trim() && styles.disabledText]}>
            添加
          </Text>
        </TouchableOpacity>
      ),
    })
  }, [navigation, form.title, actions])

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}>
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

      {/* Modals */}
      <SelectionModal
        visible={modalType === 'repeat'}
        title="重复频率"
        options={REPEAT_PRESETS as any}
        selectedValue={form.rruleFreq}
        onSelect={val => {
          form.setRruleFreq(val as RecurrenceFrequency | null)
          form.setCustomInterval('1')
          form.setCustomUntil(null)
        }}
        onClose={() => setModalType(null)}
        onCustomSelect={() => setModalType('repeat_custom')}
        customValueToken="CUSTOM"
      />

      <CustomRepeatModal
        visible={modalType === 'repeat_custom'}
        onClose={() => setModalType(null)}
        onConfirm={(freq, interval, until) => {
          form.setRruleFreq(freq)
          form.setCustomInterval(interval)
          form.setCustomUntil(until)
        }}
        initialFreq={form.rruleFreq}
        initialInterval={form.customInterval}
        initialUntil={form.customUntil}
      />

      <SelectionModal
        visible={modalType === 'calendar'}
        title="选择日历"
        options={CALENDAR_OPTIONS}
        selectedValue={form.selectedCalendar.value}
        onSelect={val => {
          const cal = CALENDAR_OPTIONS.find(c => c.value === val)
          if (cal) form.setSelectedCalendar(cal)
        }}
        onClose={() => setModalType(null)}
      />

      <SelectionModal
        visible={modalType === 'alarm'}
        title="提醒"
        options={ALARM_PRESETS}
        selectedValue={form.alarmOffset}
        onSelect={val => form.setAlarmOffset(val)}
        onClose={() => setModalType(null)}
        onCustomSelect={() => setModalType('alarm_custom')}
        customValueToken={-1}
      />

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
  headerBtnLeft: { paddingLeft: 0, justifyContent: 'center' }, // 这里的 padding 由 header 容器控制，设为 0 更安全
  headerBtnRight: { paddingRight: 0, justifyContent: 'center' },
  headerBtnTextCancel: { fontSize: 17, color: '#007AFF' },
  headerBtnTextSave: { fontSize: 17, color: '#007AFF', fontWeight: '600' },
  disabledText: { color: '#8e8e93', opacity: 0.5 },
})
