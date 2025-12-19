import React from 'react'
import { TouchableOpacity, Text, View, StyleSheet, Switch } from 'react-native'

interface ListRowProps {
  label: string
  value?: string | React.ReactNode
  onPress?: () => void
  isLast?: boolean
  showArrow?: boolean
  renderRight?: () => React.ReactNode // 自定义右侧渲染 (如 Switch)
  colorDot?: string // 可选：前面的颜色小圆点
}

export const ListRow: React.FC<ListRowProps> = ({
  label,
  value,
  onPress,
  isLast = false,
  showArrow = true,
  renderRight,
  colorDot,
}) => {
  return (
    <TouchableOpacity
      style={[styles.row, isLast && styles.rowLast]}
      onPress={onPress}
      disabled={!onPress} // 如果没有 onPress，禁用点击效果
      activeOpacity={0.6}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.rightContainer}>
        {renderRight ? (
          renderRight()
        ) : (
          <>
            {colorDot && <View style={[styles.dot, { backgroundColor: colorDot }]} />}
            <Text style={styles.value}>{value}</Text>
            {showArrow && <Text style={styles.arrow}>›</Text>}
          </>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 44, // iOS 标准行高
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
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontSize: 17,
    color: '#8e8e93',
    marginRight: 6,
  },
  arrow: {
    fontSize: 20, // 稍微大一点，看起来像 Icon
    color: '#c7c7cc',
    fontWeight: '600',
    marginTop: -2, // 微调垂直对齐
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
})
