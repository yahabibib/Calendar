import { format } from 'date-fns'
import { RecurrenceRule } from '../types/event'

const DAY_MAP: Record<string, string> = {
  MO: '周一',
  TU: '周二',
  WE: '周三',
  TH: '周四',
  FR: '周五',
  SA: '周六',
  SU: '周日',
}

const POS_MAP: Record<string, string> = {
  '+1': '第一个',
  '+2': '第二个',
  '+3': '第三个',
  '+4': '第四个',
  '-1': '最后一个',
}

// 辅助：解析 "+1MO" -> "第一个 周一"
export const formatPosDay = (value: string): string => {
  const match = value.match(/^([+-]?\d+)([A-Z]{2})$/)
  if (!match) return value
  const pos = match[1]
  const day = match[2]
  return `${POS_MAP[pos] || pos} ${DAY_MAP[day] || day}`
}

/**
 * 将 RRule 对象转换为可读的中文描述
 */
export const formatRecurrence = (rrule?: RecurrenceRule | string | null): string => {
  // 1. 空值处理
  if (!rrule) return '从不'

  // 2. 字符串处理 (兼容旧数据或极简模式)
  if (typeof rrule === 'string') {
    return '自定义重复' // 或者你可以尝试用 rrule.toText() 解析
  }

  const { freq, interval = 1, until, byDay, byMonthDay } = rrule

  // 3. 基础频率翻译
  if (!freq) return '从不'

  let text = ''
  const intVal = typeof interval === 'string' ? parseInt(interval) : interval

  // 单位映射
  const unitMap: Record<string, string> = {
    DAILY: '天',
    WEEKLY: '周',
    MONTHLY: '月',
    YEARLY: '年',
  }

  if (intVal === 1) {
    const singleMap: Record<string, string> = {
      DAILY: '每天',
      WEEKLY: '每周',
      MONTHLY: '每月',
      YEARLY: '每年',
    }
    text = singleMap[freq] || freq
  } else {
    text = `每 ${intVal} ${unitMap[freq]}`
  }

  // 4. 高级规则拼接
  // A. 周模式 (每周一、周三)
  if (freq === 'WEEKLY' && byDay && byDay.length > 0) {
    const daysText = byDay.map(d => DAY_MAP[d] || d).join('、')
    text += ` ${daysText}`
  }
  // B. 月模式
  else if (freq === 'MONTHLY') {
    // 情况 1: 按日期 (1号、15号)
    if (byMonthDay && byMonthDay.length > 0) {
      text += ` ${byMonthDay.join('、')}号`
    }
    // 情况 2: 按位置 (+1MO)
    else if (byDay && byDay.length > 0) {
      // 可能会有多个，通常月模式UI只选一个，但这里做个 map 以防万一
      const posText = byDay.map(formatPosDay).join('、')
      text += ` ${posText}`
    }
  }

  // 5. 截止日期
  if (until) {
    text += ` (截止 ${format(new Date(until), 'yyyy年M月d日')})`
  }

  return text
}
