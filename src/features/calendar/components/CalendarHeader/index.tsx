import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { format } from 'date-fns'
import { NAV_BAR_HEIGHT, TITLE_BAR_HEIGHT, WEEK_DAYS_HEIGHT } from '../../constants'
import { COLORS } from '../../../../theme'
import { useNavigation } from '@react-navigation/native'
import { VoiceInputModal } from '../Modals/VoiceInputModal'

interface CalendarHeaderProps {
  mode: 'year' | 'month' | 'week'
  currentDate: Date
  onGoBack: () => void
  onTitlePress?: () => void
  onAddEvent?: () => void
  expandProgress: SharedValue<number>
}

const WEEK_DAYS = ['一', '二', '三', '四', '五', '六', '日']

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  mode,
  currentDate,
  onGoBack,
  onTitlePress,
  onAddEvent,
  expandProgress,
}) => {
  const insets = useSafeAreaInsets()

  const navigation = useNavigation<any>() // ✨ 获取 navigation

  // ✨ 控制语音 Modal 的状态
  const [isVoiceModalVisible, setVoiceModalVisible] = React.useState(false)

  // ✨ 处理 AI 解析结果
  const handleVoiceAnalyzed = (promptText: string) => {
    navigation.navigate('AddEvent', { aiPrompt: promptText })
  }

  // B层 (TitleBar) 动画：Month -> Week 时折叠
  const titleAnimatedStyle = useAnimatedStyle(() => {
    // Year模式固定显示
    if (mode === 'year') {
      return { height: TITLE_BAR_HEIGHT, opacity: 1 }
    }
    // Month -> Week: 高度折叠，透明度消失
    return {
      height: interpolate(expandProgress.value, [0, 1], [0, TITLE_BAR_HEIGHT], Extrapolation.CLAMP),
      opacity: interpolate(expandProgress.value, [0, 0.6], [0, 1], Extrapolation.CLAMP),
      overflow: 'hidden',
    }
  })

  // ✨ Layer C: 静态星期栏动画
  // 修正：Month 和 Week 模式下都显示！只有 Year 模式隐藏。
  const weekDaysAnimatedStyle = useAnimatedStyle(() => {
    if (mode === 'year') {
      return { height: 0, opacity: 0 }
    }
    return {
      height: WEEK_DAYS_HEIGHT,
      opacity: 1,
    }
  })

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Layer A: 导航栏 */}
      <View style={styles.navBar}>
        <View style={styles.leftContainer}>
          {mode !== 'year' ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onGoBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.backArrow}>◀</Text>
              <Text style={styles.backText}>
                {/* 动态显示标题：Week模式显示具体月份 */}
                {mode === 'week'
                  ? format(currentDate, 'yyyy年 M月')
                  : format(currentDate, 'yyyy年')}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.yearModeTitle}>日程</Text>
          )}
        </View>

        <View style={styles.rightContainer}>
          {/* ✨✨✨ 新增：麦克风按钮 ✨✨✨ */}
          <TouchableOpacity style={styles.iconBtn} onPress={() => setVoiceModalVisible(true)}>
            <Text style={[styles.iconText, { fontSize: 20 }]}>🎙️</Text>
          </TouchableOpacity>
          {/* ✨✨✨ 结束新增 ✨✨✨ */}
          <TouchableOpacity style={[styles.iconBtn, { marginLeft: 16 }]} onPress={onAddEvent}>
            <Text style={[styles.iconText, { fontSize: 22 }]}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Layer B: 大标题栏 (仅Month/Year显示) */}
      <Animated.View style={[styles.titleBar, titleAnimatedStyle]}>
        <TouchableOpacity onPress={onTitlePress} disabled={mode === 'year'}>
          <Text style={styles.largeTitle}>
            {mode === 'year' ? format(currentDate, 'yyyy年') : format(currentDate, 'M月')}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Layer C: 静态星期栏 (一...日) */}
      {/* ✨ 关键：这里始终显示，提供坐标参考 */}
      <Animated.View style={[styles.weekDaysBar, weekDaysAnimatedStyle]}>
        {WEEK_DAYS.map((day, index) => (
          <Text key={index} style={styles.weekDayText}>
            {day}
          </Text>
        ))}
      </Animated.View>
      {/* ✨✨✨ 挂载 Modal ✨✨✨ */}
      <VoiceInputModal
        visible={isVoiceModalVisible}
        onClose={() => setVoiceModalVisible(false)}
        onAnalyzed={handleVoiceAnalyzed}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 5,
  },
  navBar: {
    height: NAV_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  leftContainer: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  backArrow: { fontSize: 18, color: COLORS.primary, marginRight: 4, fontWeight: '600' },
  backText: { fontSize: 17, color: COLORS.primary, fontWeight: '600' },
  yearModeTitle: { fontSize: 17, fontWeight: '600', color: '#000' },
  rightContainer: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 4 },
  iconText: { fontSize: 20, color: COLORS.primary },
  titleBar: { justifyContent: 'center', paddingHorizontal: 20 },
  largeTitle: { fontSize: 28, fontWeight: '800', color: '#000', letterSpacing: 0.5 },
  weekDaysBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 4,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    color: '#3C3C4399',
    fontSize: 13,
    fontWeight: '600',
  },
})
