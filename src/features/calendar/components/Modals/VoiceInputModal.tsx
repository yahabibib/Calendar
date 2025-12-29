import React, { useState, useEffect, useCallback } from 'react'
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
// ✨ 引入 Voice 库
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice'

import { AIService, AIParsedEvent } from '@/services/AIService'
import { COLORS } from '@/theme'

interface VoiceInputModalProps {
  visible: boolean
  onClose: () => void
  onAnalyzed: (result: AIParsedEvent) => void
}

const QUICK_ACTIONS = ['明天下午3点开会', '下周五晚上7点吃饭', '提醒我取快递']

export const VoiceInputModal: React.FC<VoiceInputModalProps> = ({
  visible,
  onClose,
  onAnalyzed,
}) => {
  const [text, setText] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false) // 正在 AI 分析
  const [isRecording, setIsRecording] = useState(false) // ✨ 正在录音

  // --- ✨ 1. 初始化语音引擎 ---
  useEffect(() => {
    // 绑定事件
    Voice.onSpeechStart = onSpeechStart
    Voice.onSpeechEnd = onSpeechEnd
    Voice.onSpeechResults = onSpeechResults
    Voice.onSpeechError = onSpeechError

    return () => {
      // 卸载组件时销毁，防止内存泄漏
      Voice.destroy().then(Voice.removeAllListeners)
    }
  }, [])

  // 重置状态
  useEffect(() => {
    if (visible) {
      setText('')
      setIsAnalyzing(false)
      setIsRecording(false)
    } else {
      stopRecording() // 关闭弹窗时确保停止录音
    }
  }, [visible])

  // --- ✨ 2. 语音回调函数 ---

  const onSpeechStart = (e: any) => {
    console.log('开始录音', e)
    setIsRecording(true)
  }

  const onSpeechEnd = (e: any) => {
    console.log('录音结束', e)
    setIsRecording(false)
  }

  const onSpeechError = (e: SpeechErrorEvent) => {
    console.log('录音出错', e)
    setIsRecording(false)
    // 某些错误代码不需要报错（例如用户没说话就停止了）
    if (e.error?.code !== '7') {
      // Alert.alert('识别出错', e.error?.message);
    }
  }

  const onSpeechResults = (e: SpeechResultsEvent) => {
    console.log('识别结果:', e.value)
    // 苹果 API 会返回一个数组，第0项是置信度最高的结果
    if (e.value && e.value[0]) {
      setText(e.value[0])
    }
  }

  // --- ✨ 3. 开始/停止录音控制 ---

  const startRecording = async () => {
    setText('') // 清空之前的
    try {
      // 启动中文识别 (zh-CN)
      await Voice.start('zh-CN')
    } catch (e) {
      console.error(e)
    }
  }

  const stopRecording = async () => {
    try {
      await Voice.stop()
    } catch (e) {
      console.error(e)
    }
  }

  const handleMicPress = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  // --- 4. 提交给 AI ---

  const handleConfirm = async () => {
    if (!text.trim()) return

    setIsAnalyzing(true)
    try {
      // 如果正在录音，先停掉
      if (isRecording) await stopRecording()

      // 调用之前的 Mock AI 解析
      const result = await AIService.parseText(text)
      onAnalyzed(result)
      onClose()
    } catch (e) {
      console.error(e)
      Alert.alert('分析失败', '请重试')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleQuickAction = (actionText: string) => {
    setText(actionText)
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>🎙️ 智能创建</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>取消</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>
            {isRecording ? '正在听... (点击麦克风停止)' : '点击麦克风开始说话，或直接输入'}
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="试着说：明天下午3点在星巴克开会..."
              value={text}
              onChangeText={setText}
              multiline
              textAlignVertical="top"
            />
            {/* 分析中的遮罩层 */}
            {isAnalyzing && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator color={COLORS.primary} />
                <Text style={styles.loadingText}>AI 分析中...</Text>
              </View>
            )}
          </View>

          {/* ✨ 麦克风大按钮区域 */}
          <View style={styles.micArea}>
            <TouchableOpacity
              style={[
                styles.micBtn,
                isRecording && styles.micBtnRecording, // 录音时变红/变大
              ]}
              onPress={handleMicPress}
              activeOpacity={0.7}>
              <Text style={styles.micIcon}>{isRecording ? '⬜' : '🎙️'}</Text>
            </TouchableOpacity>
            <Text style={styles.micStatusText}>{isRecording ? '点击停止' : '点击说话'}</Text>
          </View>

          {/* 快捷测试标签 */}
          {!isRecording && (
            <View style={styles.chipsContainer}>
              {QUICK_ACTIONS.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.chip}
                  onPress={() => handleQuickAction(action)}>
                  <Text style={styles.chipText}>{action}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.confirmBtn, (!text.trim() || isAnalyzing) && styles.disabledBtn]}
            onPress={handleConfirm}
            disabled={!text.trim() || isAnalyzing}>
            <Text style={styles.confirmBtnText}>生成日程</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: { flex: 1 },
  container: {
    backgroundColor: '#f2f2f6',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#000' },
  closeText: { fontSize: 16, color: '#8e8e93' },
  hint: { fontSize: 14, color: '#8e8e93', marginBottom: 16 },
  inputContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    height: 100,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  input: { flex: 1, padding: 12, fontSize: 17, color: '#000' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  loadingText: { marginLeft: 8, color: COLORS.primary, fontSize: 15, fontWeight: '600' },

  // ✨ Mic Styles
  micArea: { alignItems: 'center', marginBottom: 20 },
  micBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary, // 默认蓝色
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 8,
  },
  micBtnRecording: {
    backgroundColor: '#ff3b30', // 录音时变红
    transform: [{ scale: 1.1 }], // 稍微放大
  },
  micIcon: { fontSize: 32, color: 'white' },
  micStatusText: { fontSize: 12, color: '#8e8e93' },

  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  chip: {
    backgroundColor: '#e5e5ea',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: { fontSize: 13, color: '#000' },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledBtn: { backgroundColor: '#c7c7cc' },
  confirmBtnText: { fontSize: 17, fontWeight: '600', color: 'white' },
})
