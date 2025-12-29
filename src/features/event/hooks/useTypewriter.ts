import { useState, useEffect, useRef } from 'react'

export const useTypewriter = () => {
  // 目标文字队列
  const queueRef = useRef<string[]>([])
  const [currentText, setCurrentText] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  // 启动打字
  const startTyping = (fullText: string, onComplete?: () => void) => {
    if (!fullText) {
      onComplete?.()
      return
    }

    setIsTyping(true)
    setCurrentText('') // 清空

    let index = 0
    const intervalId = setInterval(() => {
      index++
      setCurrentText(fullText.substring(0, index))

      if (index >= fullText.length) {
        clearInterval(intervalId)
        setIsTyping(false)
        onComplete?.()
      }
    }, 50) // 打字速度：50ms 一个字
  }

  return {
    text: currentText,
    isTyping,
    startTyping,
    reset: () => setCurrentText(''),
  }
}
