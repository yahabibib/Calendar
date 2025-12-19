import React, { useState } from 'react'
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'

interface CustomAlarmModalProps {
  visible: boolean
  onClose: () => void
  onConfirm: (minutes: number) => void
}

export const CustomAlarmModal: React.FC<CustomAlarmModalProps> = ({
  visible,
  onClose,
  onConfirm,
}) => {
  const [num, setNum] = useState('10')
  const [unit, setUnit] = useState<'m' | 'h' | 'd'>('m')

  const handleConfirm = () => {
    const n = parseInt(num) || 0
    let totalMinutes = n
    if (unit === 'h') totalMinutes = n * 60
    if (unit === 'd') totalMinutes = n * 1440
    onConfirm(totalMinutes)
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />

        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelText}>取消</Text>
            </TouchableOpacity>
            <Text style={styles.title}>自定义提醒</Text>
            <TouchableOpacity onPress={handleConfirm}>
              <Text style={styles.confirmText}>完成</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <TextInput
              style={styles.input}
              value={num}
              onChangeText={setNum}
              keyboardType="number-pad"
              autoFocus
              selectTextOnFocus
            />

            <View style={styles.segments}>
              {['m', 'h', 'd'].map(u => (
                <TouchableOpacity
                  key={u}
                  style={[styles.segmentBtn, unit === u && styles.segmentBtnSelected]}
                  onPress={() => setUnit(u as any)}>
                  <Text style={[styles.segmentText, unit === u && styles.segmentTextSelected]}>
                    {u === 'm' ? '分钟' : u === 'h' ? '小时' : '天'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#c6c6c8',
  },
  cancelText: { fontSize: 17, color: '#007AFF' },
  confirmText: { fontSize: 17, color: '#007AFF', fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '600' },

  body: {
    padding: 24,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: 'white',
    width: 80,
    height: 50,
    borderRadius: 10,
    fontSize: 24,
    textAlign: 'center',
    marginRight: 16,
  },
  segments: {
    flexDirection: 'row',
    backgroundColor: '#e5e5ea',
    borderRadius: 10,
    padding: 2,
  },
  segmentBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  segmentBtnSelected: {
    backgroundColor: 'white',
    shadowColor: 'black',
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  segmentText: { fontSize: 16, color: 'black' },
  segmentTextSelected: { fontWeight: '600' },
})
