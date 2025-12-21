import React from 'react'
import { View, StyleSheet } from 'react-native'
import { ListRow } from '../../atoms/ListRow'

interface RepeatGroupProps {
  repeatLabel: string
  onPressRepeat: () => void
  endRepeatLabel?: string | null
  onPressEndRepeat?: () => void
}

export const RepeatGroup: React.FC<RepeatGroupProps> = ({
  repeatLabel,
  onPressRepeat,
  endRepeatLabel,
  onPressEndRepeat,
}) => {
  return (
    <View style={styles.group}>
      <ListRow
        label="重复"
        value={repeatLabel}
        onPress={onPressRepeat}
        // 如果有“结束重复”，这一行就不是最后一行（需要底部分割线）
        isLast={!endRepeatLabel}
      />

      {/* 动态渲染：只有开启重复后才显示这一行 */}
      {endRepeatLabel && (
        <>
          <View style={styles.separator} />
          <ListRow
            label="结束重复"
            value={endRepeatLabel}
            onPress={onPressEndRepeat}
            // 这是最后一行，不需要底部分割线，且圆角由外层 group 裁剪
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
    overflow: 'hidden', // ✨ 关键：确保内部子 View 无论怎么变，边角都被切圆
  },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#c6c6c8', marginLeft: 16 },
})
