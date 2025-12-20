import React from 'react'
import { View, Switch, StyleSheet } from 'react-native'
import { ListRow } from '../../atoms/ListRow'
import { DateTimeRow } from '../../atoms/DateTimeRow'

interface TimeDurationGroupProps {
  isAllDay: boolean
  onToggleAllDay: (val: boolean) => void
  startDate: Date
  onStartDateChange: (d: Date) => void
  endDate: Date
  onEndDateChange: (d: Date) => void
}

export const TimeDurationGroup: React.FC<TimeDurationGroupProps> = ({
  isAllDay,
  onToggleAllDay,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
}) => {
  return (
    <View style={styles.group}>
      <ListRow
        label="全天"
        renderRight={() => <Switch value={isAllDay} onValueChange={onToggleAllDay} />}
      />
      <View style={styles.separator} />

      <DateTimeRow
        label="开始"
        date={startDate}
        onChange={onStartDateChange}
        mode={isAllDay ? 'date' : 'datetime'}
      />

      <View style={styles.separator} />

      <DateTimeRow
        label="结束"
        date={endDate}
        onChange={onEndDateChange}
        mode={isAllDay ? 'date' : 'datetime'}
        minDate={startDate}
        isLast
      />
    </View>
  )
}
// styles 保持不变
const styles = StyleSheet.create({
  group: {
    marginTop: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#c6c6c8', marginLeft: 16 },
})
