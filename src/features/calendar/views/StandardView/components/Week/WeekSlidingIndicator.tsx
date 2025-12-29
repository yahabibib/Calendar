import React from 'react'
import { StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { useWeekViewContext } from './WeekViewContext'
import { COLORS } from '@/theme'

export const WeekSlidingIndicator = () => {
  const { animBodyScrollX, animHeaderScrollX, dayColumnWidth, weekDateItemWidth, numColumns } =
    useWeekViewContext()

  const animatedStyle = useAnimatedStyle(() => {
    // 核心数学公式：
    // Body 滚动的每一像素，对应 Header 胶囊移动的距离 = (Body滚动距离 / 单天列宽) * 单个日期头宽度
    // 同时必须减去 Header 自身的滚动距离 (因为胶囊是相对于屏幕的，或者相对于 Header 容器的，这里假设它是放在 List 上层)

    if (dayColumnWidth === 0) return { transform: [{ translateX: 0 }] }

    // 计算 Body 滚动了多少“天”
    const scrolledDays = animBodyScrollX.value / dayColumnWidth

    // 映射到 Header 的像素距离
    const indicatorTranslateX = scrolledDays * weekDateItemWidth

    // 关键：因为 Header 本身也会翻页滚动，我们需要抵消 Header 的滚动值，
    // 才能让胶囊看起来是“吸附”在日期上的。
    const finalX = indicatorTranslateX - animHeaderScrollX.value

    return {
      transform: [{ translateX: finalX }],
      width: weekDateItemWidth * numColumns, // 胶囊宽度覆盖 N 列
    }
  })

  return <Animated.View style={[styles.capsule, animatedStyle]} pointerEvents="none" />
}

const styles = StyleSheet.create({
  capsule: {
    position: 'absolute',
    top: 6, // 根据 WeekDateItem 的 padding 调整
    bottom: 6,
    left: 0,
    backgroundColor: 'rgba(0, 173, 245, 0.1)', // 淡淡的主题色
    borderRadius: 20, // 胶囊圆角
    zIndex: 0, // 在文字下方
    borderWidth: 1,
    borderColor: 'rgba(0, 173, 245, 0.2)', // 稍微深一点的描边增加质感
  },
})
