import { useSharedValue, withSpring, useDerivedValue, interpolate, Extrapolation, runOnUI } from 'react-native-reanimated';
import { Dimensions } from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;

// 🔧 配置项：根据你的 UI 设计调整这些值
const WEEK_ROW_HEIGHT = 52; // 单行高度 (周视图高度)
const MONTH_MAX_HEIGHT = 320; // 月视图总高度 (或者动态计算)

export const useCalendarLayout = (initialMode: 'week' | 'month' | 'year') => {
  // 1. 核心驱动值：0 = Week, 1 = Month
  // 使用数值 0-1 方便做插值 (Interpolation)
  const expandProgress = useSharedValue(initialMode === 'month' ? 1 : 0);

  // 2. 容器高度动画
  const containerHeight = useDerivedValue(() => {
    return interpolate(
      expandProgress.value,
      [0, 1],
      [WEEK_ROW_HEIGHT, MONTH_MAX_HEIGHT],
      Extrapolation.CLAMP
    );
  });

  // 3. 透明度/显隐动画
  // 当 progress < 0.5 时，我们认为更接近周视图
  const isWeekModeActive = useDerivedValue(() => expandProgress.value < 0.5);

  // 4. 切换模式动作
  const toggleMode = (targetMode: 'week' | 'month') => {
    'worklet'; // 标记为 UI 线程运行
    if (targetMode === 'month') {
      expandProgress.value = withSpring(1, {
        mass: 1,
        damping: 15,
        stiffness: 100,
        overshootClamping: false,
      });
    } else {
      expandProgress.value = withSpring(0, {
        mass: 1,
        damping: 15,
        stiffness: 100,
        overshootClamping: false,
      });
    }
  };

  return {
    expandProgress,
    containerHeight,
    isWeekModeActive,
    toggleMode,
    WEEK_ROW_HEIGHT,
    MONTH_MAX_HEIGHT,
  };
};