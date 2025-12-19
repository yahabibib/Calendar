import React from 'react'
import { Modal, TouchableOpacity, View, Text, ScrollView, StyleSheet } from 'react-native'
import { OptionItem } from '../../types'

interface SelectionModalProps<T> {
  visible: boolean
  title: string
  options: OptionItem<T>[]
  selectedValue: T
  onSelect: (value: T) => void
  onClose: () => void
  onCustomSelect?: () => void // 可选：如果有"自定义..."入口
  customValueToken?: any // 用于识别哪个 value 触发自定义
}

export function SelectionModal<T>({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
  onCustomSelect,
  customValueToken,
}: SelectionModalProps<T>) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>
          <ScrollView style={styles.scroll}>
            {options.map(opt => {
              const isSelected = selectedValue === opt.value
              return (
                <TouchableOpacity
                  key={opt.label}
                  style={styles.item}
                  onPress={() => {
                    if (onCustomSelect && opt.value === customValueToken) {
                      onCustomSelect()
                    } else {
                      onSelect(opt.value)
                      onClose()
                    }
                  }}>
                  <View style={styles.labelRow}>
                    {opt.color && <View style={[styles.dot, { backgroundColor: opt.color }]} />}
                    <Text style={[styles.itemText, isSelected && styles.selectedText]}>
                      {opt.label}
                    </Text>
                  </View>
                  {isSelected && <Text style={styles.check}>✓</Text>}
                </TouchableOpacity>
              )
            })}
          </ScrollView>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>取消</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#f2f2f6',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 40, // 适配全面屏底部
  },
  title: {
    fontSize: 14,
    color: '#8e8e93',
    textAlign: 'center',
    marginBottom: 12,
  },
  scroll: {
    maxHeight: 300,
  },
  item: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 17,
    color: 'black',
  },
  selectedText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  check: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelBtn: {
    marginTop: 12,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
})
