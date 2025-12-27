import { useCallback } from 'react'
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated'
import { LayoutRect } from '../views/YearView/components/MiniMonthGrid'

interface UseYearTransitionProps {
  sourceRect: LayoutRect
  screenWidth: number
  screenHeight: number
  onExitComplete?: () => void
}

export const useYearTransition = ({
  sourceRect,
  screenWidth,
  screenHeight,
  onExitComplete,
}: UseYearTransitionProps) => {
  // 1. 动画核心值：0 = 年视图(小), 1 = 标准视图(大)
  const transitionProgress = useSharedValue(0)

  // 2. 进场动画 (Year -> Month)
  const startEnterAnimation = useCallback(() => {
    // 先重置为 0
    transitionProgress.value = 0
    // 弹簧展开
    transitionProgress.value = withSpring(1, {
      mass: 0.6,
      damping: 15,
      stiffness: 120,
      overshootClamping: false,
    })
  }, [])

  // 3. 退场动画 (Month -> Year)
  const startExitAnimation = useCallback(() => {
    transitionProgress.value = withTiming(
      0,
      {
        duration: 350,
        easing: Easing.out(Easing.exp),
      },
      (finished) => {
        if (finished && onExitComplete) {
          runOnJS(onExitComplete)()
        }
      }
    )
  }, [onExitComplete])

  // 4. 样式计算 (核心数学逻辑)
  const animatedStyle = useAnimatedStyle(() => {
    // 保护：防止无坐标时的闪烁
    if (sourceRect.width === 0) {
      return { opacity: 0 } // 或者 1, 视具体需求
    }

    const scale = sourceRect.width / screenWidth
    
    // 目标中心点 (小方块中心)
    const targetCenterX = sourceRect.x + sourceRect.width / 2
    const targetCenterY = sourceRect.y + sourceRect.height / 2

    // 屏幕中心点
    const screenCenterX = screenWidth / 2
    const screenCenterY = screenHeight / 2

    // 位移计算
    const translateX = interpolate(
      transitionProgress.value,
      [0, 1],
      [targetCenterX - screenCenterX, 0]
    )
    const translateY = interpolate(
      transitionProgress.value,
      [0, 1],
      [targetCenterY - screenCenterY, 0]
    )
    
    // 缩放计算
    const activeScale = interpolate(transitionProgress.value, [0, 1], [scale, 1])
    
    // 透明度 & 圆角
    const opacity = interpolate(transitionProgress.value, [0, 0.1, 1], [0, 1, 1])
    const borderRadius = interpolate(transitionProgress.value, [0, 1], [10, 0])

    return {
      transform: [
        { translateX },
        { translateY },
        { scale: activeScale },
      ],
      opacity,
      borderRadius,
      overflow: 'hidden',
    }
  })

  return {
    animatedStyle,
    startEnterAnimation,
    startExitAnimation,
  }
}