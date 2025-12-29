import { addDays, setHours, setMinutes, startOfToday, addHours, format } from 'date-fns'
import uuid from 'react-native-uuid'
import { CalendarEvent } from '../types/event'

// 定义解析结果类型
// 我们不需要完整的 CalendarEvent，只需要部分字段即可
export interface AIParsedEvent extends Partial<CalendarEvent> {
  originalText: string
}

/**
 * 模拟 AI 解析服务 (Rule-Based Mock)
 * 这是一个“伪 AI”，使用正则表达式来提取时间、标题和地点。
 * 在实际生产环境中，这里应该调用 OpenAI / Claude 等 LLM API。
 */
export const AIService = {
  /**
   * 将自然语言转换为日程对象
   * @param text 用户输入的语音文本
   */
  parseText: async (text: string): Promise<AIParsedEvent> => {
    // 模拟网络延迟，让体验更真实
    await new Promise(resolve => setTimeout(resolve, 800))

    const now = new Date()
    let targetDate = startOfToday() // 默认为今天
    let isAllDay = false
    let extractedTitle = text

    // --- 1. 日期提取 (Date Extraction) ---
    
    // 关键词：明天
    if (text.includes('明天')) {
      targetDate = addDays(targetDate, 1)
      extractedTitle = extractedTitle.replace('明天', '')
    }
    // 关键词：后天
    else if (text.includes('后天')) {
      targetDate = addDays(targetDate, 2)
      extractedTitle = extractedTitle.replace('后天', '')
    }
    // 关键词：下周
    else if (text.includes('下周')) {
      targetDate = addDays(targetDate, 7) // 简单处理：下周 = 7天后
      extractedTitle = extractedTitle.replace('下周', '')
    }

    // --- 2. 时间提取 (Time Extraction) ---
    
    // 匹配 "X点" 或 "X点半" 或 "X:XX"
    // 示例匹配: "下午3点", "14:00", "9点半"
    const timeRegex = /([上下]午)?(\d{1,2})[点:：](半|(\d{2}))?/
    const timeMatch = text.match(timeRegex)

    if (timeMatch) {
      const period = timeMatch[1] // 上午/下午
      let hour = parseInt(timeMatch[2])
      let minute = 0
      
      const minutePart = timeMatch[3] // 半 或 30

      // 处理分钟
      if (minutePart === '半') {
        minute = 30
      } else if (minutePart) {
        minute = parseInt(minutePart)
      }

      // 处理上下午 (简单逻辑：下午且小时<12，则+12)
      if (period === '下午' && hour < 12) {
        hour += 12
      }
      // 没有任何前缀，但数字很小（比如“3点”），通常指下午（如果当前时间已经过了早上的话，或者是约定俗成的下午）
      // 这里简单处理：如果只说“2点”，默认为下午14点（除非明确说上午）
      else if (!period && hour < 7) {
        hour += 12 
      }

      targetDate = setHours(targetDate, hour)
      targetDate = setMinutes(targetDate, minute)
      
      // 从标题中移除时间字符串，让标题更干净
      extractedTitle = extractedTitle.replace(timeMatch[0], '')
    } else {
      // 如果没提到具体时间，默认设为全天或当前时间的下一个整点
      // 这里演示：如果没时间，设为“全天”
      // isAllDay = true 
      // 或者：默认设为明天上午9点
      targetDate = setHours(targetDate, 9)
      targetDate = setMinutes(targetDate, 0)
    }

    // --- 3. 标题与地点提取 (Title & Location Extraction) ---
    
    // 简单启发式：如果有“在”，后面可能跟地点
    let location = ''
    const locationRegex = /在(.+?)(开会|见面|吃饭|讨论|聚餐|去|做)/
    const locMatch = text.match(locationRegex)
    
    if (locMatch) {
      location = locMatch[1] // 提取地点
      // 不从标题移除，因为“在星巴克”也是标题的一部分，移除会显得句子不通顺
    }

    // 清理标题的多余空格和介词
    extractedTitle = extractedTitle
      .replace(/我想|我要|安排|一个|去/g, '') // 移除各种口语废话
      .replace(/，|,|。|\./g, ' ') // 标点转空格
      .trim()

    // 如果标题被删空了，给个默认值
    if (!extractedTitle) extractedTitle = '新建日程'

    // --- 4. 构造结果 ---
    
    // 默认时长 1 小时
    const endDate = addHours(targetDate, 1)

    return {
      id: 'temp-ai-id', // 生成临时 ID
      title: extractedTitle,
      startDate: targetDate.toISOString(),
      endDate: endDate.toISOString(),
      isAllDay,
      location,
      originalText: text,
      // 可以在这里加些默认颜色或日历ID
      color: '#2196F3', 
    }
  },
}