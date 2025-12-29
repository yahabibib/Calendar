import React, { useState, useEffect } from 'react'
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native'
import { FrequencyWheel } from './Repeater/FrequencyWheel'
import { MonthDayGrid } from './Repeater/MonthDayGrid'
import { MonthPosSelector } from './Repeater/MonthPosSelector'
import { WeekDaySelector } from './Repeater/WeekDaySelector'
import { COLORS } from '@/theme'

// 引入上一步 Hook 中定义的类型 (需要确保 Hook 或 Types 文件导出了它，这里我们直接复用 Hook 的 state 结构)
// 为了方便，这里简单定义一下 Props 接口
interface RruleState {
  freq: any
  interval: string
  byDay: string[]
  byMonthDay: number[]
  isMonthByDay: boolean
  byDayPos: string | null
}

interface Props {
  visible: boolean
  onClose: () => void
  rruleState: RruleState
  onChange: (newState: Partial<RruleState>) => void
}

export const CustomRepeatModal: React.FC<Props> = ({ visible, onClose, rruleState, onChange }) => {
  // --- 1. 内部草稿状态 (Draft State) ---
  const [draft, setDraft] = useState<RruleState>(rruleState)

  // 每次打开时，重置草稿为外部真实状态
  useEffect(() => {
    if (visible) {
      setDraft(rruleState)
    }
  }, [visible, rruleState])

  // --- 2. 辅助更新函数 ---
  const updateDraft = (updates: Partial<RruleState>) => {
    setDraft(prev => ({ ...prev, ...updates }))
  }

  // 处理频率切换 (切换频率时重置某些高级字段，防止数据污染)
  const handleFreqChange = (newFreq: any) => {
    updateDraft({
      freq: newFreq,
      // 切换频率时，通常建议重置高级规则，除非你想做复杂的保留逻辑
      // 这里简单处理：保留 interval，重置所有高级选择
      byDay: [],
      byMonthDay: [],
      isMonthByDay: false,
      // 月模式默认值
      byDayPos: newFreq === 'MONTHLY' ? '+1MO' : null,
    })
  }

  // 处理保存
  const handleSave = () => {
    onChange(draft)
    onClose()
  }

  // --- 3. 渲染间隔输入 (简单的加减号) ---
  const renderIntervalInput = () => {
    const val = parseInt(draft.interval) || 1
    const unitMap: Record<string, string> = {
      DAILY: '天',
      WEEKLY: '周',
      MONTHLY: '月',
      YEARLY: '年',
    }
    const unit = unitMap[draft.freq] || '天'

    return (
      <View style={styles.intervalRow}>
        <Text style={styles.label}>重复间隔</Text>
        <View style={styles.stepper}>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => updateDraft({ interval: Math.max(1, val - 1).toString() })}>
            <Text style={styles.stepBtnText}>-</Text>
          </TouchableOpacity>

          <Text style={styles.intervalText}>
            每 {val} {unit}
          </Text>

          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => updateDraft({ interval: (val + 1).toString() })}>
            <Text style={styles.stepBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          {/* 点击背景关闭 (可选) */}
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>

          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.cancelText}>取消</Text>
              </TouchableOpacity>
              <Text style={styles.title}>自定义重复</Text>
              <TouchableOpacity onPress={handleSave}>
                <Text style={styles.saveText}>完成</Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
              {/* 1. 频率选择 */}
              <FrequencyWheel selected={draft.freq || 'DAILY'} onChange={handleFreqChange} />

              {/* 2. 间隔选择 */}
              {renderIntervalInput()}

              <View style={styles.divider} />

              {/* 3. 动态区域：周选择 */}
              {draft.freq === 'WEEKLY' && (
                <View>
                  <Text style={styles.sectionTitle}>在这些星期重复</Text>
                  <WeekDaySelector
                    selectedDays={draft.byDay}
                    onChange={days => updateDraft({ byDay: days })}
                  />
                </View>
              )}

              {/* 4. 动态区域：月选择 */}
              {draft.freq === 'MONTHLY' && (
                <View>
                  {/* Tab 切换 */}
                  <View style={styles.tabContainer}>
                    <TouchableOpacity
                      style={[styles.tab, !draft.isMonthByDay && styles.activeTab]}
                      onPress={() => updateDraft({ isMonthByDay: false })}>
                      <Text style={[styles.tabText, !draft.isMonthByDay && styles.activeTabText]}>
                        按日期
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.tab, draft.isMonthByDay && styles.activeTab]}
                      onPress={() => updateDraft({ isMonthByDay: true })}>
                      <Text style={[styles.tabText, draft.isMonthByDay && styles.activeTabText]}>
                        按星期
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* 面板内容 */}
                  {!draft.isMonthByDay ? (
                    <MonthDayGrid
                      selectedDays={draft.byMonthDay}
                      onChange={days => updateDraft({ byMonthDay: days })}
                    />
                  ) : (
                    <MonthPosSelector
                      value={draft.byDayPos}
                      onChange={pos => updateDraft({ byDayPos: pos })}
                    />
                  )}
                </View>
              )}
            </View>
          </View>
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
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: COLORS.cardBg, //
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border, //
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text, //
  },
  cancelText: {
    fontSize: 17,
    color: COLORS.textLight, //
  },
  saveText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.primary, //
  },
  content: {
    padding: 20,
  },
  // Interval Styles
  intervalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#eeeff1',
    padding: 12,
    borderRadius: 10,
  },
  label: {
    fontSize: 16,
    color: COLORS.text, //
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 2,
  },
  stepBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f2f6',
    borderRadius: 6,
  },
  stepBtnText: {
    fontSize: 20,
    color: COLORS.primary, //
    lineHeight: 22,
  },
  intervalText: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: '500',
    minWidth: 60,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#eeeff1',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    color: COLORS.textLight, //
    marginBottom: 12,
  },
  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#eeeff1',
    borderRadius: 8,
    padding: 2,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#000',
    fontWeight: '600',
  },
})
