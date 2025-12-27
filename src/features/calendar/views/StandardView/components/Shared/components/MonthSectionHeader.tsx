import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { format } from 'date-fns'
import { COLORS } from '@/theme'
import { MONTH_TITLE_HEIGHT } from '../../Month/constants'

interface MonthSectionHeaderProps {
  currentDate: Date
  paddingLeft: number
  style?: any // 允许外部传入透明度等动画样式
}

export const MonthSectionHeader: React.FC<MonthSectionHeaderProps> = ({
  currentDate,
  paddingLeft,
  style,
}) => {
  const monthLabel = format(currentDate, 'M月')
  const isJanuary = monthLabel === '1月'
  const displayLabel = isJanuary ? format(currentDate, 'yyyy年 M月') : monthLabel

  return (
    <View style={[styles.header, { paddingLeft, height: MONTH_TITLE_HEIGHT }, style]}>
      <Text style={[styles.headerText, isJanuary && styles.headerTextYear]}>{displayLabel}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  headerText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 12,
  },
  headerTextYear: {
    color: '#000',
  },
})
