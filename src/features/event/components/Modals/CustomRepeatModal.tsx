import React, { useState, useEffect } from 'react'
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Platform,
} from 'react-native'
import { RecurrenceFrequency } from '../../../../types/event'
import { DateTimeRow } from '../../atoms/DateTimeRow'
import { addHours } from 'date-fns'

interface CustomRepeatModalProps {
  visible: boolean
  onClose: () => void
  onConfirm: (freq: RecurrenceFrequency, interval: string, until: Date | null) => void
  initialFreq?: RecurrenceFrequency | null
  initialInterval?: string
  initialUntil?: Date | null
}

const FREQ_OPTIONS: RecurrenceFrequency[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']
const FREQ_LABELS: Record<RecurrenceFrequency, string> = {
  DAILY: '天',
  WEEKLY: '周',
  MONTHLY: '月',
  YEARLY: '年',
}

export const CustomRepeatModal: React.FC<CustomRepeatModalProps> = ({
  visible,
  onClose,
  onConfirm,
  initialFreq,
  initialInterval,
  initialUntil,
}) => {
  const [freq, setFreq] = useState<RecurrenceFrequency>('DAILY')
  const [interval, setInterval] = useState('1')
  const [until, setUntil] = useState<Date | null>(null)

  useEffect(() => {
    if (visible) {
      setFreq(initialFreq || 'DAILY')
      setInterval(initialInterval || '1')
      setUntil(initialUntil)
    }
  }, [visible, initialFreq, initialInterval, initialUntil])

  const handleConfirm = () => {
    onConfirm(freq, interval, until)
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Text style={styles.backText}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.title}>自定义重复</Text>
          <TouchableOpacity onPress={handleConfirm} style={styles.headerBtn}>
            <Text style={styles.confirmText}>完成</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* 频率 & 间隔 */}
          <View style={styles.section}>
            <View style={styles.row}>
              <Text style={styles.label}>频率</Text>
              <View style={styles.freqRow}>
                {FREQ_OPTIONS.map(f => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.freqChip, freq === f && styles.freqChipSelected]}
                    onPress={() => setFreq(f)}>
                    <Text style={[styles.freqText, freq === f && styles.freqTextSelected]}>
                      {FREQ_LABELS[f]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.row}>
              <Text style={styles.label}>每隔</Text>
              <View style={styles.intervalRow}>
                <TextInput
                  style={styles.intervalInput}
                  value={interval}
                  onChangeText={setInterval}
                  keyboardType="number-pad"
                  maxLength={3}
                  selectTextOnFocus
                />
                <Text style={styles.unitText}>{FREQ_LABELS[freq]}</Text>
              </View>
            </View>
          </View>

          {/* 结束条件 */}
          <View style={styles.section}>
            <DateTimeRow
              label="结束重复"
              date={until || new Date()}
              onChange={setUntil}
              mode="date"
            />
            <View style={styles.separator} />

            {/* ✨ Switch 垂直居中修复版 */}
            <View style={[styles.row, { borderBottomWidth: 0, paddingVertical: 10 }]}>
              <Text style={styles.label}>永不结束</Text>
              {/* 使用 View 包裹并 justify-center 确保双重保险 */}
              <View style={{ justifyContent: 'center' }}>
                <Switch
                  value={until === null}
                  onValueChange={val => setUntil(val ? null : addHours(new Date(), 24))}
                />
              </View>
            </View>
          </View>
        </ScrollView>
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
    marginBottom: 24,
    overflow: 'hidden',
  },

  // ✨ 通用行样式优化：移除固定高度，使用 minHeight + padding
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // 垂直居中核心
    paddingHorizontal: 16,
    minHeight: 48, // 保证最小高度，但允许 Switch 撑开
    paddingVertical: 8, // 增加呼吸感
  },

  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#c6c6c8',
    marginLeft: 16,
  },
  label: { fontSize: 17, color: 'black' },

  freqRow: { flexDirection: 'row' },
  freqChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#e5e5ea',
    marginLeft: 8,
  },
  freqChipSelected: { backgroundColor: '#007AFF' },
  freqText: { fontSize: 15, color: 'black' },
  freqTextSelected: { color: 'white', fontWeight: '500' },

  intervalRow: { flexDirection: 'row', alignItems: 'center' },
  intervalInput: {
    width: 60,
    height: 36,
    backgroundColor: '#e5e5ea',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 17,
    marginRight: 8,
  },
  unitText: { fontSize: 17, color: '#8e8e93' },
})
