import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'

interface DateTimeRowProps {
  label: string
  date: Date
  onChange: (date: Date) => void
  mode?: 'date' | 'datetime' | 'time'
  minDate?: Date
  isLast?: boolean
}

export const DateTimeRow: React.FC<DateTimeRowProps> = ({
  label,
  date,
  onChange,
  mode = 'datetime',
  minDate,
  isLast = false,
}) => {
  return (
    <View style={[styles.row, isLast && styles.rowLast]}>
      <Text style={styles.label}>{label}</Text>

      {/* iOS 直接使用 compact 样式，无需任何弹窗逻辑 */}
      <DateTimePicker
        value={date}
        mode={mode}
        display="default" // iOS 14+ 自动适配为 Compact 样式 (小胶囊按钮)
        onChange={(_, d) => d && onChange(d)}
        minimumDate={minDate}
        locale="zh-CN"
        style={styles.picker}
        themeVariant="light" // 强制浅色模式，与白色背景匹配
      />
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8, // 增加一点垂直内边距，适应 Picker 高度
    minHeight: 44,
    backgroundColor: 'white',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#c6c6c8',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  label: {
    fontSize: 17,
    color: 'black',
  },
  picker: {
    // 这里的宽度不需要写死，iOS 会自适应，但如果需要靠右对齐可以微调
    // width: 190,
  },
})
