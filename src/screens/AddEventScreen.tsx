import React, { useState, useEffect, useLayoutEffect } from 'react'
import {
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { format } from 'date-fns'

// Theme & Types
import { COLORS } from '../theme'
import { CalendarEvent } from '../types/event'

// Hooks
import { useEventForm } from '../features/event/hooks/useEventForm'
// ✨ 引入打字机 Hook (注意你说的路径)
import { useTypewriter } from '../features/event/hooks/useTypewriter'

// Services
import { AIService } from '../services/AIService'

// Components
import { TitleLocationGroup } from '../features/event/components/FormGroups/TitleLocationGroup'
import { TimeDurationGroup } from '../features/event/components/FormGroups/TimeDurationGroup'
import { RepeatGroup } from '../features/event/components/FormGroups/RepeatGroup'
import { OptionsGroup } from '../features/event/components/FormGroups/OptionsGroup'
import { MetaGroup } from '../features/event/components/FormGroups/MetaGroup'

// Modals
import { CustomRepeatModal } from '../features/event/components/Modals/CustomRepeatModal'
import { EndRepeatModal } from '../features/event/components/Modals/EndRepeatModal'
import { SelectionModal } from '../features/event/components/Modals/SelectionModal'

// ✨ 引入流光边框组件
import { AIGlowingBorder } from '../features/event/components/AIGlowingBorder'

// 定义路由参数
type RouteParams = {
  initialDate?: string
  event?: Partial<CalendarEvent>
  aiPrompt?: string // ✨ 新增
}

export const AddEventScreen = () => {
  const navigation = useNavigation()
  const route = useRoute<any>()

  // 解构参数
  const { initialDate, event, aiPrompt } = (route.params || {}) as RouteParams

  // 表单 Hook
  const { form, rrule, labels, actions } = useEventForm(initialDate, event)

  // ✨ AI 状态管理
  const [aiStatus, setAiStatus] = useState<'idle' | 'thinking' | 'writing' | 'success' | 'error'>(
    'idle',
  )
  const [aiErrorMessage, setAiErrorMessage] = useState('')

  // ✨ 打字机 Hooks (分别为标题和备注准备)
  const titleTypewriter = useTypewriter()
  const descTypewriter = useTypewriter()

  // Modal 状态
  const [modalType, setModalType] = useState<
    'repeat_custom' | 'alarm' | 'alarm_custom' | 'calendar' | 'end_repeat' | null
  >(null)

  // --- ✨ AI 核心处理逻辑 ---
  useEffect(() => {
    // 只有当存在 aiPrompt 且状态为 idle 时才触发 (防止重复触发)
    if (aiPrompt && aiStatus === 'idle') {
      handleAIProcess(aiPrompt)
    }
  }, [aiPrompt])

  const handleAIProcess = async (prompt: string) => {
    setAiStatus('thinking') // 1. 进入思考 (流光开始)

    // 模拟一个小延迟让用户看清动画 (可选，增加仪式感)
    await new Promise(r => setTimeout(r, 800))

    try {
      // 2. 调用 API
      const result = await AIService.parseText(prompt)

      // 3. 检查是否有错误 (User input was nonsense)
      if ('error' in result) {
        throw new Error(result.error || '无法识别日程信息')
      }

      // 到这里说明解析成功，类型断言为 AIParsedEvent
      const parsedEvent = result as any

      setAiStatus('writing') // 4. 进入书写状态

      // 5. 瞬间填充非文字字段 (时间、地点、重复规则)
      // 这些不需要打字机效果，直接上屏
      if (parsedEvent.startDate) form.setStartDate(new Date(parsedEvent.startDate))
      if (parsedEvent.endDate) form.setEndDate(new Date(parsedEvent.endDate))
      if (parsedEvent.isAllDay !== undefined) form.setIsAllDay(parsedEvent.isAllDay)
      if (parsedEvent.location) form.setLocation(parsedEvent.location)

      // 填充 RRule (如果 Hook 支持 update)
      if (parsedEvent.rrule) {
        // 这里假设你的 useEventForm 返回的 rrule.update 能处理部分更新
        // 如果 parsedEvent.rrule 是对象，直接传；如果是字符串，可能需要适配
        // 注意：这里需要确保 AIService 返回的结构与 rrule.update 兼容
        // 如果不兼容，暂时先不填，或者需要手动映射
        // rrule.update(parsedEvent.rrule)
      }

      // 6. 启动打字机动画链 (标题 -> 备注)
      const targetTitle = parsedEvent.title || '新建日程'
      const targetDesc = parsedEvent.description || ''

      titleTypewriter.startTyping(targetTitle, () => {
        // 标题打完了，如果有备注，接着打备注
        if (targetDesc) {
          descTypewriter.startTyping(targetDesc, () => {
            setAiStatus('success') // 全部完成
          })
        } else {
          setAiStatus('success')
        }
      })
    } catch (error: any) {
      setAiStatus('error')
      setAiErrorMessage(error.message)

      // 兜底：把用户说的话填入备注，方便手动修改，标题给个默认提示
      titleTypewriter.startTyping('无法识别')
      descTypewriter.startTyping(`原始内容：${prompt}`, () => {
        // 即使报错，字打完后也视为一种结束
      })
    }
  }

  // ✨ 动态显示值逻辑
  // 如果正在打字，优先显示打字机的内容；否则显示表单真实值
  const displayTitle =
    aiStatus === 'writing' || aiStatus === 'error' ? titleTypewriter.text : form.title
  const displayDesc =
    aiStatus === 'writing' || aiStatus === 'error' ? descTypewriter.text : form.description

  // ✨ 监听打字机更新，实时同步回 form
  // 这样当用户在打字过程中突然点击保存，也能保存当前已打出的内容
  useEffect(() => {
    if (aiStatus === 'writing' || aiStatus === 'error') {
      if (titleTypewriter.text) form.setTitle(titleTypewriter.text)
      if (descTypewriter.text) form.setDescription(descTypewriter.text)
    }
  }, [titleTypewriter.text, descTypewriter.text])

  // 导航栏配置 (保持之前的优化)
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={{ fontSize: 17, color: COLORS.text }}>取消</Text>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => actions.saveEvent(() => navigation.goBack())}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          // ✨ 如果 AI 正在思考，禁用保存按钮防止误触
          disabled={aiStatus === 'thinking'}>
          <Text
            style={{
              fontSize: 17,
              fontWeight: '600',
              color: aiStatus === 'thinking' ? COLORS.textLight : COLORS.primary,
            }}>
            添加
          </Text>
        </TouchableOpacity>
      ),
      title: event?.id && !event.id.startsWith('temp-') ? '编辑日程' : '新建日程',
    })
  }, [navigation, actions, event?.id, aiStatus])

  // 辅助变量
  const showEndRepeat = rrule.state.freq !== null
  const cleanRepeatLabel = labels.repeatLabel.split(' (截止')[0]
  const endRepeatLabel = rrule.state.until ? format(rrule.state.until, 'yyyy年M月d日') : '永不'

  // 日历选项 Mock
  const calendarOptions = [
    { label: '工作', value: 'Work', color: '#2196F3' },
    { label: '家庭', value: 'Home', color: '#4CAF50' },
    { label: '默认日历', value: 'Default', color: '#9E9E9E' },
  ]

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* ✨ 状态提示条 (Thinking / Error) */}
      {aiStatus === 'thinking' && (
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>AI 正在思考...</Text>
        </View>
      )}
      {aiStatus === 'error' && (
        <View style={[styles.statusBar, { backgroundColor: '#ffebee' }]}>
          <Text style={[styles.statusText, { color: COLORS.danger }]}>
            {aiErrorMessage || '无法识别，已保留原始内容'}
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {/* 1. 标题与地点 (套上流光边框) */}
          <AIGlowingBorder
            visible={aiStatus === 'thinking' || aiStatus === 'writing'}
            status={aiStatus === 'error' ? 'error' : 'thinking'}>
            <TitleLocationGroup
              title={displayTitle} // ✨ 使用动态值
              onChangeTitle={form.setTitle}
              location={form.location}
              onChangeLocation={form.setLocation}
              // 在生成过程中禁用输入，防止光标跳动
              // editable={aiStatus !== 'thinking' && aiStatus !== 'writing'} // 如果 TitleLocationGroup 支持 props 透传
            />
          </AIGlowingBorder>

          {/* 2. 时间与全天 */}
          <TimeDurationGroup
            isAllDay={form.isAllDay}
            onToggleAllDay={form.setIsAllDay}
            startDate={form.startDate}
            endDate={form.endDate}
            onChangeStartDate={form.setStartDate}
            onChangeEndDate={form.setEndDate}
          />

          {/* 3. 重复设置 */}
          <RepeatGroup
            repeatLabel={cleanRepeatLabel}
            onPressRepeat={() => setModalType('repeat_custom')}
            endRepeatLabel={showEndRepeat ? endRepeatLabel : null}
            onPressEndRepeat={() => setModalType('end_repeat')}
          />

          {/* 4. 选项 */}
          <OptionsGroup
            calendarLabel={form.selectedCalendar.label}
            calendarColor={form.selectedCalendar.color}
            onPressCalendar={() => setModalType('calendar')}
            alarmLabel={labels.alarmLabel}
            onPressAlarm={() => setModalType('alarm')}
            url={form.url}
            onChangeUrl={form.setUrl}
          />

          {/* 5. 备注 (也套上流光边框，虽然通常 AI 是一起生成的，视觉上统一) */}
          <AIGlowingBorder
            visible={aiStatus === 'thinking' || aiStatus === 'writing'}
            status={aiStatus === 'error' ? 'error' : 'thinking'}>
            <MetaGroup
              description={displayDesc} // ✨ 使用动态值
              onChangeDescription={form.setDescription}
            />
          </AIGlowingBorder>
        </ScrollView>

        {/* --- Modals 保持不变 --- */}
        <CustomRepeatModal
          visible={modalType === 'repeat_custom'}
          onClose={() => setModalType(null)}
          rruleState={rrule.state}
          onChange={rrule.update}
        />
        <EndRepeatModal
          visible={modalType === 'end_repeat'}
          onClose={() => setModalType(null)}
          value={rrule.state.until}
          onChange={date => rrule.update({ until: date })}
        />
        <SelectionModal
          visible={modalType === 'calendar'}
          title="选择日历"
          options={calendarOptions}
          selectedValue={form.selectedCalendar.value}
          onSelect={val => {
            const cal = calendarOptions.find(c => c.value === val)
            if (cal) form.setSelectedCalendar(cal)
            setModalType(null)
          }}
          onClose={() => setModalType(null)}
        />
        {/* 简化的 Alarm Modal */}
        <SelectionModal
          visible={modalType === 'alarm'}
          title="提醒"
          options={[
            { label: '无', value: 'null' },
            { label: '日程发生时', value: '0' },
            { label: '15 分钟前', value: '15' },
            { label: '1 小时前', value: '60' },
            { label: '1 天前', value: '1440' },
          ]}
          selectedValue={form.alarmOffset === null ? 'null' : form.alarmOffset.toString()}
          onSelect={val => {
            form.setAlarmOffset(val === 'null' ? null : parseInt(val))
            setModalType(null)
          }}
          onClose={() => setModalType(null)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f2f6',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 20,
    paddingHorizontal: 16, // 确保有边距给流光边框显示
  },
  statusBar: {
    padding: 8,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
})
