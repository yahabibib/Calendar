import React from 'react'
import { StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { useWeekViewContext } from './WeekViewContext'

// 样式常量
const SLATE_BLUE_BG = 'rgba(84, 110, 122, 0.1)'
const SLATE_BLUE_BORDER = 'rgba(84, 110, 122, 0.15)'

// 几何常数
const CIRCLE_SIZE = 36
const CONTAINER_HEIGHT = 52
const VERTICAL_PADDING = (CONTAINER_HEIGHT - CIRCLE_SIZE) / 2 // 8px

export const WeekSlidingIndicator = () => {
  const { animBodyScrollX, animHeaderScrollX, dayColumnWidth, weekDateItemWidth, isWideScreen } =
    useWeekViewContext()

  // 如果 Context 没导出 numColumns，这里兜底计算一下
  const numColumns = isWideScreen ? 7 : 2

  const animatedStyle = useAnimatedStyle(() => {
    if (dayColumnWidth === 0) return { transform: [{ translateX: 0 }] }

    // 1. 计算 Body 滚动距离对应的 Header 像素位置
    const scrolledDays = animBodyScrollX.value / dayColumnWidth
    const indicatorTranslateX = scrolledDays * weekDateItemWidth
    const finalX = indicatorTranslateX - animHeaderScrollX.value

    // 2.  严丝合缝核心计算 
    // 计算单个格子内的单侧留白：(格子宽50 - 圆圈36) / 2 = 7px
    const sidePadding = (weekDateItemWidth - CIRCLE_SIZE) / 2

    // 修正 X 坐标：向右偏移一个左留白，让胶囊起点对齐圆圈左侧
    const adjustedX = finalX + sidePadding

    // 修正宽度：总列宽 - 左留白 - 右留白
    // 公式 = (列数 * 格子宽) - (格子宽 - 圆圈宽)
    const adjustedWidth = numColumns * weekDateItemWidth - (weekDateItemWidth - CIRCLE_SIZE)

    return {
      transform: [{ translateX: adjustedX }],
      width: adjustedWidth,
    }
  })

  return <Animated.View style={[styles.capsule, animatedStyle]} pointerEvents="none" />
}

const styles = StyleSheet.create({
  capsule: {
    position: 'absolute',
    // 绝对垂直居中
    top: VERTICAL_PADDING, // 8
    height: CIRCLE_SIZE, // 36
    borderRadius: CIRCLE_SIZE / 2, // 18 (全圆角)
    left: 0,

    // 视觉样式
    backgroundColor: SLATE_BLUE_BG,
    // borderWidth: 1,
    borderColor: SLATE_BLUE_BORDER,
    zIndex: 0,
  },
})
