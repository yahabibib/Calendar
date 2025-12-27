import { useCalendarLayout } from '../../hooks/useCalendarLayout'
import {
  YEAR_COLUMNS,
  CONTAINER_PADDING,
  MINI_MONTH_PADDING_H,
  MINI_MONTH_TITLE_HEIGHT,
  MINI_MONTH_TITLE_MARGIN,
  MINI_MONTH_MARGIN_BOTTOM,
  YEAR_HEADER_HEIGHT,
} from './constants'

export const useYearLayout = () => {
  // 获取全局屏幕参数
  const { SCREEN_WIDTH, insets } = useCalendarLayout()

  // 计算基础宽度
  const availableWidth = SCREEN_WIDTH - CONTAINER_PADDING * 2
  const cellWidth = availableWidth / YEAR_COLUMNS

  // 计算核心单元格大小 (Day Size)
  const daySize = (cellWidth - MINI_MONTH_PADDING_H * 2) / 7

  // 计算高度:一个月的总高度
  const oneMonthHeight =
    MINI_MONTH_TITLE_HEIGHT +
    MINI_MONTH_TITLE_MARGIN +
    daySize * 6 + // 6行日期
    MINI_MONTH_MARGIN_BOTTOM

  // 一年的总高度
  const yearItemHeight = YEAR_HEADER_HEIGHT + oneMonthHeight * 4 + 30 // 30 底部的额外留白

  // 计算 Grid 容器的高度
  const gridHeight = daySize * 6

  return {
    cellWidth,
    daySize,
    oneMonthHeight,
    yearItemHeight,
    gridHeight,
    insets,
  }
}