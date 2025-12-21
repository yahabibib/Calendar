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
 * 辅助函数：计算单个事件的基础垂直位置 (top, height)
 * 将时间转换为像素值
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
  // 设定最小高度，防止时间太短点不到 (例如 15分钟 = 15px)
  const height = Math.max((duration / 60) * HOUR_HEIGHT, 15)

  return { top, height, startMinutes, endMinutes }
}

/**
 * 处理单个重叠簇 (Cluster) 的布局
 * 使用“列填充”算法：尽可能靠左排列，若冲突则开新列
 */
const processCluster = (cluster: any[], containerWidth: number): LayoutEvent[] => {
  if (!containerWidth || containerWidth <= 0 || isNaN(containerWidth)) {
      // 可以在这里返回默认布局，或者直接 map
      // 这里简单处理：假设宽度为 0，避免除以 0
      return cluster.map(event => ({
          ...event,
          layout: { top: event.top, height: event.height, left: 0, width: 0 }
      }))
  }
  // columns 数组存储每一列的“当前结束时间”
  // columns[0] = 600 表示第 0 列被占用到 10:00
  const columns: number[] = [] 
  
  // 1. 分配列索引 (Packing)
  const eventsWithColumn = cluster.map(event => {
    // 寻找第一个能放下的列（该列结束时间 <= 当前事件开始时间）
    let colIndex = columns.findIndex(colEnd => colEnd <= event.startMinutes)

    if (colIndex === -1) {
      // 没找到空闲列，创建新列
      colIndex = columns.length
      columns.push(event.endMinutes)
    } else {
      // 找到了，更新该列的结束时间
      columns[colIndex] = event.endMinutes
    }

    return {
      ...event,
      _colIndex: colIndex // 临时记录分配到的列号
    }
  })

  // 2. 计算几何属性
  // 整个簇的总列数
  const totalColumns = columns.length

  const safeColumns = totalColumns > 0 ? totalColumns : 1
  
  // 每个事件的宽度 (留 1px 间隙更美观)
  const eventWidth = containerWidth / safeColumns

  return eventsWithColumn.map(event => ({
    ...event,
    layout: {
      top: event.top,
      height: event.height,
      // 左偏移 = 列号 * 单列宽度
      left: event._colIndex * eventWidth, 
      // 宽度 = 单列宽度 - 间隙
      width: eventWidth - 1 
    }
  }))
}

/**
 * 主函数：计算一列中所有事件的布局
 */
export const calculateEventLayout = (events: CalendarEvent[], containerWidth: number): LayoutEvent[] => {
  if (!events || events.length === 0) return []

  // 1. 预处理：计算基础位置并按开始时间排序
  // 排序对于贪心算法至关重要，确保从早到晚依次落位
  const baseEvents = events
    .map(e => ({ ...e, ...calculateBaseLayout(e) }))
    .sort((a, b) => {
      if (a.startMinutes !== b.startMinutes) return a.startMinutes - b.startMinutes
      return b.endMinutes - a.endMinutes // 开始时间相同，长的在前
    })

  const result: LayoutEvent[] = []
  
  // 2. 分组 (Clustering)
  // 将互相重叠的事件打包成一个簇，每个簇独立计算布局
  let cluster: typeof baseEvents = []
  let clusterEnd = -1

  for (const event of baseEvents) {
    // 如果当前事件开始时间 >= 簇的结束时间，说明断开了（无重叠），
    // 结算上一簇，并开始新簇
    if (cluster.length > 0 && event.startMinutes >= clusterEnd) {
      result.push(...processCluster(cluster, containerWidth))
      cluster = []
      clusterEnd = -1
    }

    // 加入当前簇
    cluster.push(event)
    // 更新簇的最晚结束时间
    if (event.endMinutes > clusterEnd) {
      clusterEnd = event.endMinutes
    }
  }

  // 结算最后一簇
  if (cluster.length > 0) {
    result.push(...processCluster(cluster, containerWidth))
  }

  return result
}