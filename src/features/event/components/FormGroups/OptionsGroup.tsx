// src/features/event/components/FormGroups/OptionsGroup.tsx
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { ListRow } from '../../atoms/ListRow'

interface OptionsGroupProps {
  repeatLabel: string
  onPressRepeat: () => void
  calendarLabel: string
  calendarColor: string
  onPressCalendar: () => void
  alarmLabel: string
  onPressAlarm: () => void
}

export const OptionsGroup: React.FC<OptionsGroupProps> = ({
  repeatLabel,
  onPressRepeat,
  calendarLabel,
  calendarColor,
  onPressCalendar,
  alarmLabel,
  onPressAlarm,
}) => {
  return (
    <View style={styles.group}>
      <ListRow label="Repeat" value={repeatLabel} onPress={onPressRepeat} />
      <View style={styles.separator} />

      <ListRow
        label="Calendar"
        value={calendarLabel}
        colorDot={calendarColor}
        onPress={onPressCalendar}
      />
      <View style={styles.separator} />

      <ListRow label="Alert" value={alarmLabel} onPress={onPressAlarm} isLast />
    </View>
  )
}

const styles = StyleSheet.create({
  group: {
    marginTop: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#c6c6c8',
    marginLeft: 16,
  },
})
