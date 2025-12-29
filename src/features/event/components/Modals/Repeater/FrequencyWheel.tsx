import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { RecurrenceFrequency } from '@/types/event'
import { COLORS } from '@/theme'

interface Props {
  selected: RecurrenceFrequency
  onChange: (freq: RecurrenceFrequency) => void
}

const OPTIONS: { label: string; value: RecurrenceFrequency }[] = [
  { label: '每天', value: 'DAILY' },
  { label: '每周', value: 'WEEKLY' },
  { label: '每月', value: 'MONTHLY' },
  { label: '每年', value: 'YEARLY' },
]

export const FrequencyWheel: React.FC<Props> = ({ selected, onChange }) => {
  return (
    <View style={styles.container}>
      {OPTIONS.map(opt => {
        const isSelected = selected === opt.value
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.item, isSelected && styles.selectedItem]}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.7}>
            <Text style={[styles.text, isSelected && styles.selectedText]}>{opt.label}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#eeeff1',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  item: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  selectedItem: {
    backgroundColor: COLORS.cardBg, //
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  text: {
    fontSize: 15,
    color: '#666',
  },
  selectedText: {
    color: '#000',
    fontWeight: '600',
  },
})
