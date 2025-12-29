import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated, Easing } from 'react-native'
import { COLORS } from '@/theme'

interface Props {
  visible: boolean
  children: React.ReactNode
  status?: 'thinking' | 'success' | 'error'
}

export const AIGlowingBorder: React.FC<Props> = ({ visible, children, status = 'thinking' }) => {
  const animatedValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible && status === 'thinking') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false, // 颜色渐变不支持 Native Driver
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
      ).start()
    } else {
      animatedValue.setValue(0)
      animatedValue.stopAnimation()
    }
  }, [visible, status])

  // 颜色插值：模拟流光
  const borderColor = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [
      'rgba(0, 173, 245, 0.1)', // 浅蓝
      'rgba(180, 50, 255, 0.6)', // 紫色 (Apple Intelligence 风格)
      'rgba(0, 173, 245, 0.1)', // 浅蓝
    ],
  })

  const borderWidth = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 4], // 呼吸边框宽度
  })

  // 如果不可见，直接返回 children
  if (!visible) return <>{children}</>

  // 错误状态显示红色
  const finalBorderColor = status === 'error' ? COLORS.danger : borderColor

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.borderContainer,
          {
            borderColor: finalBorderColor,
            borderWidth: status === 'thinking' ? borderWidth : 2,
          },
        ]}
      />
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    margin: -4, // 抵消 padding，让边框包围内容
    padding: 4,
  },
  borderContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    zIndex: 1,
    pointerEvents: 'none', // 确保不挡住点击
  },
})
