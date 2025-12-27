import React, { useEffect, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { differenceInMinutes, startOfDay } from 'date-fns'
import { COLORS } from '../../../../../../theme'
import { HOUR_HEIGHT } from '../../../../../../theme/layout'

export const CurrentTimeIndicator = () => {
  const [now, setNow] = useState(new Date())

  // 每分钟更新一次位置
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const start = startOfDay(now)
  const minutes = differenceInMinutes(now, start)
  const top = (minutes / 60) * HOUR_HEIGHT

  return (
    <View style={[styles.container, { top }]} pointerEvents="none">
      {/* 左侧大圆点 (亮色/呼吸灯效果) */}
      <View style={styles.circleOuter}>
        <View style={styles.circleInner} />
      </View>

      {/* 贯穿的横线 */}
      <View style={styles.line} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0, // 确保横向撑满 DayColumn
    height: 12, // 给一点高度容纳圆点，防止被裁切
    marginTop: -6, // 负 margin 让 line 居中对齐 top 位置
    zIndex: 999, // ✨ 确保浮在所有日程块的最上层
    flexDirection: 'row',
    alignItems: 'center',
  },
  circleOuter: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'white', // 白边防止和背景混淆
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -4, // 让圆点中心挂在左边框上
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  circleInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary, // 主题色核心
  },
  line: {
    flex: 1,
    height: 2, // 稍微加粗一点
    backgroundColor: COLORS.primary,
    opacity: 1, // 亮色，不透明
  },
})
