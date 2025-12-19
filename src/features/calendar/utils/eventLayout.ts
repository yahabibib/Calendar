import { differenceInMinutes, startOfDay } from 'date-fns'
import { CalendarEvent } from '../../../types/event'
import { HOUR_HEIGHT } from '../../../theme/layout'

// 扩展 CalendarEvent，增加布局所需的几何信息
export interface LayoutEvent extends CalendarEvent {
  layout: {
    top: number
    height: number
    left: number
    width: number
  }
}

/**
 * 计算单个事件的基础几何属性 (top, height)
 */
const calculateBaseLayout = (event: CalendarEvent): { top: number; height: number; startMinutes: number; endMinutes: number } => {
  const start = new Date(event.startDate)
  const end = new Date(event.endDate)
  const startDay = startOfDay(start)

  // 计算相对于当天 00:00 的分钟数
  const startMinutes = differenceInMinutes(start, startDay)
  const duration = differenceInMinutes(end, start)
  const endMinutes = startMinutes + duration

  // 映射到像素高度
  const top = (startMinutes / 60) * HOUR_HEIGHT
  const height = Math.max((duration / 60) * HOUR_HEIGHT, 15) // 最小高度 15px

  return { top, height, startMinutes, endMinutes }
}

/**
 * 核心算法：计算一列中所有事件的布局位置，自动处理重叠
 */
export const calculateEventLayout = (events: CalendarEvent[], containerWidth: number): LayoutEvent[] => {
  if (!events || events.length === 0) return []

  // 1. 预处理：计算 top/height 并排序
  const baseEvents = events
    .map(e => ({ ...e, ...calculateBaseLayout(e) }))
    .sort((a, b) => {
      if (a.startMinutes !== b.startMinutes) return a.startMinutes - b.startMinutes
      return b.endMinutes - a.endMinutes // 开始时间相同，长的在前
    })

  const result: LayoutEvent[] = []
  
  // 临时变量，用于构建簇 (Cluster)
  let cluster: typeof baseEvents = []
  let clusterEnd = 0

  // 遍历所有事件进行分组
  for (const event of baseEvents) {
    // 如果当前事件开始时间 >= 簇的结束时间，说明断开了，处理上一簇
    if (event.startMinutes >= clusterEnd && cluster.length > 0) {
      result.push(...processCluster(cluster, containerWidth))
      cluster = []
      clusterEnd = 0
    }

    // 加入当前簇
    cluster.push(event)
    if (event.endMinutes > clusterEnd) {
      clusterEnd = event.endMinutes
    }
  }

  // 处理最后一簇
  if (cluster.length > 0) {
    result.push(...processCluster(cluster, containerWidth))
  }

  return result
}

/**
 * 处理单个簇内的冲突，分配 left/width
 * 使用简单的列分配算法 (Column Packing)
 */
const processCluster = (cluster: any[], containerWidth: number): LayoutEvent[] => {
  // columns[i] 存储第 i 列当前的结束时间
  const columns: number[] = [] 
  
  const layoutEvents = cluster.map(event => {
    // 寻找第一个能放下的列（该列结束时间 <= 事件开始时间）
    let colIndex = columns.findIndex(colEnd => colEnd <= event.startMinutes)

    if (colIndex === -1) {
      // 没找到，开新列
      colIndex = columns.length
      columns.push(event.endMinutes)
    } else {
      // 找到了，更新该列结束时间
      columns[colIndex] = event.endMinutes
    }

    return {
      ...event,
      _colIndex: colIndex // 临时记录列索引
    }
  })

  // 计算总列数
  const totalColumns = columns.length
  // 每个事件的宽度
  const eventWidth = (containerWidth - 4) / totalColumns // 减去少量边距

  return layoutEvents.map(event => ({
    ...event,
    layout: {
      top: event.top,
      height: event.height,
      left: event._colIndex * eventWidth, // 左偏移
      width: eventWidth - 2 // 再留一点间隙
    }
  }))
}