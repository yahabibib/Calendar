import React from 'react'
import { View, StyleSheet, Text } from 'react-native'
import { ListRow } from '../../atoms/ListRow'
import { COLORS } from '@/theme'

interface RepeatGroupProps {
  repeatLabel: string
  onPressRepeat: () => void
  endRepeatLabel?: string | null
  onPressEndRepeat?: () => void
  isAdvanced?: boolean 
}

export const RepeatGroup: React.FC<RepeatGroupProps> = ({
  repeatLabel,
  onPressRepeat,
  endRepeatLabel,
  onPressEndRepeat,
  isAdvanced,
}) => {
  return (
    <View style={styles.group}>
      <ListRow
        label="重复"
        value={
          <Text style={[styles.valueText, isAdvanced && styles.advancedText]}>{repeatLabel}</Text>
        }
        onPress={onPressRepeat}
        isLast={!endRepeatLabel}
      />

      {endRepeatLabel && (
        <>
          <View style={styles.separator} />
          <ListRow
            label="结束重复"
            value={endRepeatLabel}
            onPress={onPressEndRepeat}
            isLast={true}
          />
        </>
      )}
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
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#c6c6c8', marginLeft: 16 },
  valueText: {
    fontSize: 17,
    color: '#8e8e93', // 默认灰色
  },
  advancedText: {
    color: COLORS.primary, 
    fontWeight: '500',
  },
})
