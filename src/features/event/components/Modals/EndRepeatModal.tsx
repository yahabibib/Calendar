import React, { useState, useEffect } from 'react'
import { Modal, View, Text, StyleSheet, TouchableOpacity, Switch, Platform } from 'react-native'
import { addMonths } from 'date-fns'
import { DateTimeRow } from '../../atoms/DateTimeRow'

interface EndRepeatModalProps {
  visible: boolean
  onClose: () => void
  onConfirm: (until: Date | null) => void
  initialUntil: Date | null
}

export const EndRepeatModal: React.FC<EndRepeatModalProps> = ({
  visible,
  onClose,
  onConfirm,
  initialUntil,
}) => {
  const [until, setUntil] = useState<Date | null>(null)

  useEffect(() => {
    if (visible) {
      setUntil(initialUntil)
    }
  }, [visible, initialUntil])

  const handleConfirm = () => {
    onConfirm(until)
    onClose()
  }

  const handleToggle = (isNever: boolean) => {
    if (isNever) {
      setUntil(null)
    } else {
      setUntil(initialUntil || addMonths(new Date(), 1))
    }
  }

  return (
    // ✨ 修复：移除 transparent，依靠 pageSheet 原生样式
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Text style={styles.backText}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.title}>结束重复</Text>
          <TouchableOpacity onPress={handleConfirm} style={styles.headerBtn}>
            <Text style={styles.confirmText}>完成</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <View style={[styles.row, until === null && styles.rowLast]}>
              <Text style={styles.label}>永不结束</Text>
              <Switch value={until === null} onValueChange={handleToggle} />
            </View>

            {until !== null && (
              <>
                <View style={styles.separator} />
                <DateTimeRow
                  label="截止日期"
                  date={until}
                  onChange={setUntil}
                  mode="date"
                  minDate={new Date()}
                  isLast
                />
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f2f2f6',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#c6c6c8',
  },
  backText: { fontSize: 17, color: '#007AFF' },
  confirmText: { fontSize: 17, color: '#007AFF', fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '600' },
  headerBtn: { padding: 4 },

  content: { paddingTop: 24 },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 48,
    paddingVertical: 8,
  },
  rowLast: { borderBottomWidth: 0 },
  label: { fontSize: 17, color: 'black' },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#c6c6c8',
    marginLeft: 16,
  },
})
