import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { COLORS } from '@/theme'

interface Props {
  selectedDays: string[] // ['MO', 'WE']
  onChange: (days: string[]) => void
}

const DAYS = [
  { label: '一', value: 'MO' },
  { label: '二', value: 'TU' },
  { label: '三', value: 'WE' },
  { label: '四', value: 'TH' },
  { label: '五', value: 'FR' },
  { label: '六', value: 'SA' },
  { label: '日', value: 'SU' },
]

export const WeekDaySelector: React.FC<Props> = ({ selectedDays, onChange }) => {
  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter(d => d !== day))
    } else {
      // 保持 MO, TU... 的顺序，虽然逻辑上不强制，但数据好看点
      const order = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
      const newDays = [...selectedDays, day].sort((a, b) => order.indexOf(a) - order.indexOf(b))
      onChange(newDays)
    }
  }

  return (
    <View style={styles.container}>
      {DAYS.map(day => {
        const isSelected = selectedDays.includes(day.value)
        return (
          <TouchableOpacity
            key={day.value}
            style={[styles.circle, isSelected && styles.selectedCircle]}
            onPress={() => toggleDay(day.value)}
            activeOpacity={0.7}>
            <Text style={[styles.text, isSelected && styles.selectedText]}>{day.label}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eeeff1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCircle: {
    backgroundColor: COLORS.primary, //
  },
  text: {
    fontSize: 16,
    color: '#666',
  },
  selectedText: {
    color: 'white',
    fontWeight: '600',
  },
})
