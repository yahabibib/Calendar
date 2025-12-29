// src/features/event/components/AIGlowingBorder.tsx
import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native'
import { COLORS } from '@/theme'

interface Props {
  visible: boolean
  status?: 'thinking' | 'writing' | 'success' | 'error' | 'idle'
}

const { width, height } = Dimensions.get('window')

export const AIGlowingBorder: React.FC<Props> = ({ visible, status = 'idle' }) => {
  // 使用两个动画值来创建多层次的流光感
  const layer1Opacity = useRef(new Animated.Value(0)).current
  const layer2Opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const isActive = visible && (status === 'thinking' || status === 'writing')

    if (isActive) {
      // 定义基础动画配置
      const createLoop = (animValue: Animated.Value, duration: number, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animValue, {
              toValue: 1,
              duration: duration,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true, // 使用原生驱动提升性能
            }),
            Animated.timing(animValue, {
              toValue: 0.3, // 不完全消失，保持微光
              duration: duration,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        )
      }

      // 启动两个略微错开的动画循环，营造流动感
      // 层1：较慢，偏蓝
      const loop1 = createLoop(layer1Opacity, 2000, 0)
      // 层2：较快，偏紫/青，延迟启动
      const loop2 = createLoop(layer2Opacity, 1500, 500)

      Animated.parallel([loop1, loop2]).start()
    } else {
      // 停止并重置
      layer1Opacity.stopAnimation()
      layer2Opacity.stopAnimation()
      layer1Opacity.setValue(0)
      layer2Opacity.setValue(0)
    }
  }, [visible, status])

  if (!visible || status === 'idle') return null

  // 错误状态显示醒目的红色边框，无动画
  if (status === 'error') {
    return <View style={[styles.fullScreenOverlay, styles.errorBorder]} pointerEvents="none" />
  }

  // 成功状态闪一下绿色 (可选，目前需求没强调，暂不实现复杂效果)
  if (status === 'success') return null

  // AI 处理状态：双层流光
  return (
    // pointerEvents="none" 是关键：让点击穿透这个遮罩层
    <View style={styles.fullScreenContainer} pointerEvents="none">
      {/* Layer 1: 外层光晕 (偏蓝/青) - 较宽较虚 */}
      <Animated.View
        style={[
          styles.glowingLayer,
          {
            borderColor: '#00C6FF', // 青蓝色
            borderWidth: 6,
            opacity: layer1Opacity.interpolate({
              inputRange: [0, 1],
              outputRange: [0.2, 0.6], // 透明度区间
            }),
            // 可以添加 scale 让它有轻微的扩散感 (可选)
            // transform: [{ scale: layer1Opacity.interpolate({ inputRange:[0,1], outputRange:[1, 1.02] }) }]
          },
        ]}
      />

      {/* Layer 2: 内层核心光流 (偏紫/蓝) - 较窄较实 */}
      <Animated.View
        style={[
          styles.glowingLayer,
          {
            borderColor: '#5A4FCF', //由于没有渐变库，用一个中间色模拟 Apple 的蓝紫渐变
            borderWidth: 3,
            opacity: layer2Opacity,
          },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  // 容器撑满全屏，但自身不阻挡事件
  fullScreenContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999, // 确保在最上层
    elevation: 10, // Android层级
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 具体的发光层
  glowingLayer: {
    // 让边框稍微超出屏幕一点点，制造边界溢出的光感
    width: width + 10,
    height: height + 10,
    position: 'absolute',
    borderRadius: 20, // 稍微圆角
    backgroundColor: 'transparent',
    // 这里可以加 shadow 来增强光晕感 (iOS明显)
    shadowColor: '#00C6FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  errorBorder: {
    borderColor: COLORS.danger,
    borderWidth: 4,
    opacity: 0.8,
  },
  fullScreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    backgroundColor: 'transparent',
    borderRadius: 0,
  },
})
