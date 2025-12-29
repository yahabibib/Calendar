import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { COLORS } from '@/theme'

interface Props {
  selectedDays: number[]
  onChange: (days: number[]) => void
}

export const MonthDayGrid: React.FC<Props> = ({ selectedDays, onChange }) => {
  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter(d => d !== day))
    } else {
      onChange([...selectedDays, day].sort((a, b) => a - b))
    }
  }

  return (
    <View style={styles.grid}>
      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
        const isSelected = selectedDays.includes(day)
        return (
          <TouchableOpacity
            key={day}
            style={[styles.cell, isSelected && styles.selectedCell]}
            onPress={() => toggleDay(day)}
            activeOpacity={0.6}>
            <Text style={[styles.text, isSelected && styles.selectedText]}>{day}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginHorizontal: -4, // 抵消 cell 的 padding
  },
  cell: {
    width: '14.28%', // 7列布局 (100% / 7)
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  selectedCell: {
    backgroundColor: COLORS.primary, //
    borderRadius: 20,
  },
  text: {
    fontSize: 16,
    color: COLORS.text, //
  },
  selectedText: {
    color: 'white',
    fontWeight: '600',
  },
})
