import { addHours } from 'date-fns'
import { CalendarEvent } from '../types/event' //

// ✨ 请在这里填入你的通义千问 API Key (或者从环境变量读取)
const API_KEY = 'sk-da35de0bbfc943e18e8fe64b7a66851a'

// ✨ 通义千问兼容 OpenAI 的接口地址
const API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'

// 定义返回类型，复用 CalendarEvent 的结构
export interface AIParsedEvent extends Partial<CalendarEvent> {
  originalText: string
}

export type AIParseResult = AIParsedEvent | { error: string }

export const AIService = {
  /**
   * 将自然语言转换为日程对象 (调用通义千问)
   * @param text 用户输入的语音文本
   */
  parseText: async (text: string): Promise<AIParseResult> => {
    // 1. 获取当前时间上下文
    const now = new Date()
    const nowStr = now.toLocaleString('zh-CN', { hour12: false })
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

    console.log('🤖 AI 正在思考:', text)

    // 2. 构建 System Prompt (提示词工程)
    const systemPrompt = `
你是一个智能日程助手。当前时间是：${nowStr}，时区：${timeZone}。
请根据用户的输入，提取日程信息并返回严格的 JSON 格式。

要求：
1. **title**: 提炼简洁的标题。
2. **startDate/endDate**: ISO 8601 格式 (YYYY-MM-DDTHH:mm:ss)。如果不指定时长，默认 1 小时。
3. **isAllDay**: 只有明确提到“全天”或未指定具体时间点时为 true。
4. **location**: 提取地点。
5. **description**: 提取备注。⚠️ **严格清洗规则**：
   - 请剔除所有已经被解析为【时间】、【地点】、【重复规则】或【提醒/闹钟】的文本。
   - 只保留真正的会议内容或待办细节。
   - 示例：用户说“提醒我开会”，description 应为空，因为“提醒”进了 alarms，“开会”进了 title。
6. **alarms**: 提取提醒时间。返回一个数字数组，表示【日程开始前多少分钟】响铃。
   - 示例："提前10分钟" -> [10]
   - 示例："准时" -> [0]
   - 示例："提前1小时" -> [60]
   - 示例："提前一天" -> [1440]
   - 如果未提及，返回空数组 []。
7. **rrule**: 如果包含重复规则，请返回如下 JSON 对象结构（严禁返回字符串）：
   - 基础字段: 
     - "freq": "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"
     - "interval": 数字 (默认1)
     - "until": ISO时间字符串 (可选)
     - "count": 数字 (可选)
   - 高级字段 (根据语义选择):
     - "byDay": 字符串数组。
       - 周模式下: ["MO", "TU", "WE", "TH", "FR", "SA", "SU"]
       - 月模式下支持位置: ["+1MO"](第1个周一), ["-1FR"](最后1个周五)
     - "byMonthDay": 数字数组，如 [1, 15] 表示1号和15号
     - "byMonth": 数字数组，如 [1, 12] 表示1月和12月
   - 示例 A: "每两周的周一和周三" -> { "freq": "WEEKLY", "interval": 2, "byDay": ["MO", "WE"] }
   - 示例 B: "每月最后一个周五" -> { "freq": "MONTHLY", "byDay": ["-1FR"] }
   - 示例 C: "每年五月一日" -> { "freq": "YEARLY", "byMonth": [5], "byMonthDay": [1] }
8. 不要返回任何 Markdown 格式，只返回纯 JSON 字符串。
    `.trim()

    try {
      // 3. 发起请求
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: 'qwen-plus', // 推荐 qwen-plus，对复杂指令遵循更好
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text },
          ],
          temperature: 0.1, // 低随机性
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'AI 请求失败')
      }

      // 4. 解析结果
      const content = data.choices[0]?.message?.content || '{}'
      const cleanJson = content.replace(/```json|```/g, '').trim()

      console.log('📦 AI 返回数据:', cleanJson)

      const parsed = JSON.parse(cleanJson)

      // 1. 如果 AI 显式返回了 error 字段
      if (parsed.error) {
        return { error: parsed.error }
      }

      // 2. 如果解析出的数据太少（没有标题且没有时间），视为无效
      if (!parsed.title && !parsed.startDate) {
        return { error: '无法提取有效的日程信息' }
      }

      // 5. 兜底与格式化
      let startDate = parsed.startDate ? new Date(parsed.startDate) : addHours(now, 1)
      let endDate = parsed.endDate ? new Date(parsed.endDate) : addHours(startDate, 1)

      return {
        id: 'temp-ai-id',
        title: parsed.title || '新建日程',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        isAllDay: parsed.isAllDay || false,
        location: parsed.location || '',
        description: parsed.description || '',
        rrule: parsed.rrule || undefined, // 直接透传对象
        alarms: parsed.alarms || [],
        originalText: text,
        color: '#2196F3',
      }
    } catch (error) {
      console.error('❌ AI 解析错误:', error)
      return { error: error.message || 'AI 服务暂时不可用' }
    }
  },
}
