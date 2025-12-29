import React from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { COLORS } from '@/theme'

// RFC5545 格式映射
const POSITIONS = [
  { label: '第一个', value: '+1' },
  { label: '第二个', value: '+2' },
  { label: '第三个', value: '+3' },
  { label: '第四个', value: '+4' },
  { label: '最后一个', value: '-1' },
]

const DAYS = [
  { label: '周一', value: 'MO' },
  { label: '周二', value: 'TU' },
  { label: '周三', value: 'WE' },
  { label: '周四', value: 'TH' },
  { label: '周五', value: 'FR' },
  { label: '周六', value: 'SA' },
  { label: '周日', value: 'SU' },
]

interface Props {
  // 格式如: "+1MO", "-1FR"
  value: string | null
  onChange: (value: string) => void
}

export const MonthPosSelector: React.FC<Props> = ({ value, onChange }) => {
  // 解析当前值，默认为 第一个(+1) 周一(MO)
  let currentPos = '+1'
  let currentDay = 'MO'

  if (value) {
    const match = value.match(/^([+-]?\d+)([A-Z]{2})$/)
    if (match) {
      currentPos = match[1]
      currentDay = match[2]
    }
  }

  const handlePosChange = (pos: string) => {
    onChange(`${pos}${currentDay}`)
  }

  const handleDayChange = (day: string) => {
    onChange(`${currentPos}${day}`)
  }

  return (
    <View style={styles.container}>
      {/* 左列：位置 */}
      <View style={styles.column}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {POSITIONS.map(pos => (
            <TouchableOpacity
              key={pos.value}
              style={[styles.item, currentPos === pos.value && styles.selectedItem]}
              onPress={() => handlePosChange(pos.value)}>
              <Text style={[styles.text, currentPos === pos.value && styles.selectedText]}>
                {pos.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.divider} />

      {/* 右列：星期 */}
      <View style={styles.column}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {DAYS.map(day => (
            <TouchableOpacity
              key={day.value}
              style={[styles.item, currentDay === day.value && styles.selectedItem]}
              onPress={() => handleDayChange(day.value)}>
              <Text style={[styles.text, currentDay === day.value && styles.selectedText]}>
                {day.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 180,
    backgroundColor: '#f2f2f6',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
  },
  column: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 10,
  },
  divider: {
    width: 1,
    backgroundColor: '#d1d1d6',
    marginVertical: 10,
  },
  item: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedItem: {
    backgroundColor: 'white', // 高亮背景
    marginHorizontal: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  text: {
    fontSize: 16,
    color: '#8e8e93',
  },
  selectedText: {
    color: COLORS.primary, //
    fontWeight: '600',
    fontSize: 17,
  },
})
