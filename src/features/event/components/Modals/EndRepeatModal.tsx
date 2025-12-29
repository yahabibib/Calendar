import React from 'react'
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Switch, // ✨ 引入 Switch
  Platform,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { COLORS } from '@/theme' //

interface Props {
  visible: boolean
  onClose: () => void
  value: Date | null
  onChange: (date: Date | null) => void
}

export const EndRepeatModal: React.FC<Props> = ({ visible, onClose, value, onChange }) => {
  // 核心修复逻辑：
  // 如果 value 为 null (永不)，DatePicker 显示当前时间作为“起步价”，
  // 但我们通过一个 Switch 来控制“是否启用”截止日期。
  const isEnabled = value !== null

  // DatePicker 必须接收有效 Date，如果 value 是 null，就用当前时间兜底
  const safeDate = value || new Date()

  const handleToggle = (enabled: boolean) => {
    if (enabled) {
      // 开启时，默认设置为今天（或者明天）
      onChange(new Date())
    } else {
      // 关闭时，设置为 null (永不)
      onChange(null)
    }
  }

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      // Android 特殊处理：点击取消会返回 undefined
      if (event.type === 'dismissed') {
        return
      }
    }
    if (selectedDate) {
      onChange(selectedDate)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>结束重复</Text>
                <TouchableOpacity onPress={onClose}>
                  <Text style={styles.doneText}>完成</Text>
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={styles.content}>
                {/* 1. 开关控制行 */}
                <View style={styles.row}>
                  <Text style={styles.label}>指定截止日期</Text>
                  <Switch
                    value={isEnabled}
                    onValueChange={handleToggle}
                    trackColor={{ false: '#767577', true: COLORS.primary }}
                  />
                </View>

                {/* 2. 日期选择器 (仅当开启时显示) */}
                {isEnabled && (
                  <View style={styles.pickerContainer}>
                    <DateTimePicker
                      value={safeDate} // ✨ 修复点：这里永远不会是 null
                      mode="date"
                      display={Platform.OS === 'ios' ? 'inline' : 'default'}
                      onChange={handleDateChange}
                      minimumDate={new Date()} // 可选：限制不能选过去的时间
                      style={styles.picker}
                      themeVariant="light"
                    />
                  </View>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: COLORS.cardBg, //
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 40, // 适配底部安全区
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5ea',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  doneText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.primary, //
  },
  content: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 12,
  },
  label: {
    fontSize: 17,
    color: '#000',
  },
  pickerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  picker: {
    // iOS inline 模式下通常不需要设置具体宽度，但在某些布局下可能需要
    width: Platform.OS === 'ios' ? '100%' : undefined,
  },
})
