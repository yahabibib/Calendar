import { useMemo } from 'react'
import { useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { 
  MONTH_HEADER_HEIGHT, 
  WEEK_MODE_HEIGHT, 
} from '../constants'
import { MONTH_TITLE_HEIGHT } from '../components/MonthGrid/styles'

export interface CalendarLayout {
  screenWidth: number
  screenHeight: number
  monthRowHeight: number   // 动态计算月视图行高
  weekRowHeight: number    // 周视图固定行高
  monthContentHeight: number // 月视图总内容高度
  headerHeight: number     // 顶部总高度
  insets: { top: number; bottom: number }   // 安全区域
}

export const useCalendarLayout = () => {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  // 计算动态月视图行高
  const dynamicMonthRowHeight = useMemo(() => {
    // 剩余空间 = 屏幕高 - 顶部安全区 - 导航头 - 底部安全区 - 底部Padding(20) - 月标题
    const availableSpace =
      SCREEN_HEIGHT -
      insets.top -
      MONTH_HEADER_HEIGHT -
      insets.bottom -
      20 -
      MONTH_TITLE_HEIGHT

    // 均分 6 行
    const calculatedHeight = availableSpace / 6

    // 兜底策略：不能小于周视图的高度
    return Math.max(calculatedHeight, WEEK_MODE_HEIGHT)
  }, [SCREEN_HEIGHT, insets.top, insets.bottom])

  // 计算月视图内容总高度：6行高度 + 标题高度 + 底部Padding
  const MONTH_CONTENT_HEIGHT = useMemo(() => {
    return dynamicMonthRowHeight * 6 + MONTH_TITLE_HEIGHT + 20
  }, [dynamicMonthRowHeight])

  return {
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    insets,
    dynamicMonthRowHeight, 
    MONTH_CONTENT_HEIGHT,
    WEEK_MODE_HEIGHT,
    MONTH_HEADER_HEIGHT,
    MONTH_TITLE_HEIGHT
  }
}