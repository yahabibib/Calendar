// src/features/calendar/views/WeekView/WeekViewContext.tsx
import React, {
  createContext,
  useContext,
  useRef,
  useMemo,
  useState,
  useCallback,
  useEffect,
} from 'react'
import {
  FlatList,
  ViewToken,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ScrollView,
} from 'react-native'
import { addDays, startOfWeek, differenceInCalendarDays, isSameDay, isValid } from 'date-fns'
import { useEventStore } from '../../../../store/eventStore'
import { CalendarEvent } from '../../../../types/event'
import { TIME_LABEL_WIDTH, HOUR_HEIGHT } from '../../../../theme/layout'

const PAST_DAYS_RANGE = 365
const TOTAL_PAGES_ESTIMATE = 730
const ALL_DAY_EVENT_HEIGHT = 18
const ALL_DAY_EVENT_GAP = 2
const DATE_HEADER_MIN_HEIGHT = 30
const HEADER_VERTICAL_PADDING = 4

// 定义滚动源类型
type ScrollSource = 'week' | 'header' | 'body' | null

interface WeekViewContextType {
  dayList: Date[]
  events: CalendarEvent[]
  selectedDate: string
  headerDate: Date

  dayColumnWidth: number
  weekDateItemWidth: number
  derivedHeaderHeight: number
  isWideScreen: boolean
  initialIndex: number

  visibleStartDateIndex: number

  weekListRef: React.RefObject<FlatList>
  headerListRef: React.RefObject<FlatList>
  bodyListRef: React.RefObject<FlatList>
  verticalScrollRef?: React.RefObject<ScrollView>

  // ✨ 暴露给各组件的滚动处理函数
  onWeekScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void
  onHeaderScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void
  onBodyScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void

  // ✨ 暴露给各组件的手势状态函数
  onWeekBeginDrag: () => void
  onHeaderBeginDrag: () => void
  onBodyBeginDrag: () => void
  onScrollEnd: () => void

  onViewableItemsChanged: (info: { viewableItems: ViewToken[] }) => void
  onDateSelect: (date: string) => void
  onEventPress?: (event: CalendarEvent) => void
  onHeaderBackPress?: (date: Date) => void
  onVerticalLayout: (event: any) => void
}

const WeekViewContext = createContext<WeekViewContextType | null>(null)

export const useWeekViewContext = () => {
  const context = useContext(WeekViewContext)
  if (!context) throw new Error('useWeekViewContext must be used within a WeekViewProvider')
  return context
}

export const WeekViewProvider: React.FC<any> = ({
  children,
  selectedDate,
  onDateSelect,
  onEventPress,
  onHeaderBackPress,
}) => {
  const { width: screenWidth } = useWindowDimensions()
  const events = useEventStore(state => state.events)

  const weekListRef = useRef<FlatList>(null)
  const headerListRef = useRef<FlatList>(null)
  const bodyListRef = useRef<FlatList>(null)
  const verticalScrollRef = useRef<ScrollView>(null)

  // ✨ 核心锁：记录当前谁是“司机”
  const activeScroll = useRef<ScrollSource>(null)

  const isWideScreen = screenWidth > 600
  const numColumns = isWideScreen ? 7 : 2
  const dayColumnWidth = (screenWidth - TIME_LABEL_WIDTH) / numColumns
  const weekDateItemWidth = screenWidth / 7

  // 比例系数：Body 滚 1px，Week 滚多少 px
  const ratio = weekDateItemWidth / dayColumnWidth

  const { dayList, startDateAnchor } = useMemo(() => {
    const today = new Date()
    const anchor = startOfWeek(today, { weekStartsOn: 1 })
    const start = addDays(anchor, -PAST_DAYS_RANGE)
    const list = Array.from({ length: TOTAL_PAGES_ESTIMATE }).map((_, i) => addDays(start, i))
    return { dayList: list, startDateAnchor: start }
  }, [])

  const [headerDate, setHeaderDate] = useState(() => new Date(selectedDate))
  const [maxAllDayCount, setMaxAllDayCount] = useState(0)
  const [visibleStartDateIndex, setVisibleStartDateIndex] = useState(0)

  // ✨ 2. 状态：记录 ScrollView 的视口高度
  const [viewportHeight, setViewportHeight] = useState(0)
  // ✨ 3. 状态：标记是否已经完成过初始定位 (避免重复跳动)
  const [hasScrolledToNow, setHasScrolledToNow] = useState(false)

  const derivedHeaderHeight = useMemo(() => {
    const contentHeight = maxAllDayCount * (ALL_DAY_EVENT_HEIGHT + ALL_DAY_EVENT_GAP)
    const total = DATE_HEADER_MIN_HEIGHT + contentHeight + HEADER_VERTICAL_PADDING
    return Math.max(total, 45)
  }, [maxAllDayCount])

  // --- 通用：更新高亮索引 ---
  const updateVisibleIndex = (bodyOffsetX: number) => {
    const index = Math.round(bodyOffsetX / dayColumnWidth)
    setVisibleStartDateIndex(prev => (prev !== index ? index : prev))
  }

  // --- 1. WeekList 驱动 ---
  const onWeekBeginDrag = useCallback(() => {
    activeScroll.current = 'week'
  }, [])
  const onWeekScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (activeScroll.current !== 'week') return // 没锁住就不执行

      const weekOffsetX = e.nativeEvent.contentOffset.x
      const targetBodyOffset = weekOffsetX / ratio // 反向计算 Body 的偏移量

      bodyListRef.current?.scrollToOffset({ offset: targetBodyOffset, animated: false })
      headerListRef.current?.scrollToOffset({ offset: targetBodyOffset, animated: false })

      updateVisibleIndex(targetBodyOffset)
    },
    [ratio],
  )

  // --- 2. HeaderList 驱动 ---
  const onHeaderBeginDrag = useCallback(() => {
    activeScroll.current = 'header'
  }, [])
  const onHeaderScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (activeScroll.current !== 'header') return

      const headerOffsetX = e.nativeEvent.contentOffset.x
      // Header 和 Body 是 1:1 的关系
      bodyListRef.current?.scrollToOffset({ offset: headerOffsetX, animated: false })
      weekListRef.current?.scrollToOffset({ offset: headerOffsetX * ratio, animated: false })

      updateVisibleIndex(headerOffsetX)
    },
    [ratio],
  )

  // --- 3. BodyList 驱动 ---
  const onBodyBeginDrag = useCallback(() => {
    activeScroll.current = 'body'
  }, [])
  const onBodyScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (activeScroll.current !== 'body') return

      const bodyOffsetX = e.nativeEvent.contentOffset.x

      headerListRef.current?.scrollToOffset({ offset: bodyOffsetX, animated: false })
      weekListRef.current?.scrollToOffset({ offset: bodyOffsetX * ratio, animated: false })

      updateVisibleIndex(bodyOffsetX)
    },
    [ratio],
  )

  // --- 4. 滚动结束清理 ---
  const onScrollEnd = useCallback(() => {
    // 可以在 momentum 结束时清理，也可以保留最后状态，通常不需要强制设为 null，
    // 只要 BeginDrag 正确设置即可。但为了安全，可以在完全静止后重置（可选）。
    // activeScroll.current = null
  }, [])

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (!viewableItems || viewableItems.length === 0) return
      const firstItem = viewableItems[0]
      if (firstItem?.item && isValid(firstItem.item)) {
        setHeaderDate(firstItem.item)
      }
      let maxCount = 0
      viewableItems.forEach(viewToken => {
        const date = viewToken.item as Date
        if (isValid(date)) {
          const count = events.filter(
            e => e.isAllDay && isSameDay(new Date(e.startDate), date),
          ).length
          if (count > maxCount) maxCount = count
        }
      })
      setMaxAllDayCount(prev => (prev !== maxCount ? maxCount : prev))
    },
    [events],
  )

  const initialIndex = useMemo(() => {
    const target = new Date(selectedDate)
    if (!isValid(target)) return 0
    return Math.max(0, differenceInCalendarDays(target, startDateAnchor))
  }, [selectedDate, startDateAnchor])

  useEffect(() => {
    if (initialIndex > 0) {
      setVisibleStartDateIndex(initialIndex)
      setTimeout(() => {
        // 加长一点延时，作为 fallback
        bodyListRef.current?.scrollToIndex({ index: initialIndex, animated: false })
        headerListRef.current?.scrollToIndex({ index: initialIndex, animated: false })
        weekListRef.current?.scrollToIndex({ index: initialIndex, animated: false })
      }, 100)
    }
  }, [initialIndex])

  useEffect(() => {
    // 条件：必须要拿到高度，且尚未执行过初始定位
    if (viewportHeight > 0 && !hasScrolledToNow && verticalScrollRef.current) {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinutes = now.getMinutes()
      const totalMinutes = currentHour * 60 + currentMinutes

      // A. 计算红线的精确 Y 坐标
      const lineY = (totalMinutes / 60) * HOUR_HEIGHT

      // B. 尝试将红线置于屏幕中间
      let targetOffset = lineY - viewportHeight / 2

      // C. 计算内容总高度 (24小时)
      const contentHeight = HOUR_HEIGHT * 24
      const maxOffset = contentHeight - viewportHeight

      // D. 边界限制 (Clamping)
      // 顶部不能小于 0
      // 底部不能超过 maxOffset
      targetOffset = Math.max(0, Math.min(targetOffset, maxOffset))

      // 执行滚动 (animated: false 保证进入时瞬间到位，体验更好)
      verticalScrollRef.current.scrollTo({ y: targetOffset, animated: false })

      // 标记已完成
      setHasScrolledToNow(true)
    }
  }, [viewportHeight, hasScrolledToNow])

  const handleDateSelect = useCallback(
    (dateStr: string) => {
      onDateSelect(dateStr)
      // 编程式跳转时，临时清空锁，或者手动调用三个 scroll
      // 为防止 onScroll 干扰，我们直接全量设置
      const d = new Date(dateStr)
      const diff = differenceInCalendarDays(d, startDateAnchor)
      const index = Math.max(0, diff)

      bodyListRef.current?.scrollToIndex({ index, animated: true })
      headerListRef.current?.scrollToIndex({ index, animated: true })
      weekListRef.current?.scrollToIndex({ index, animated: true })
    },
    [startDateAnchor, onDateSelect],
  )

  const onVerticalLayout = useCallback(
    (event: any) => {
      const { height } = event.nativeEvent.layout
      if (height > 0 && height !== viewportHeight) {
        setViewportHeight(height)
      }
    },
    [viewportHeight],
  )

  const value = {
    dayList,
    events,
    selectedDate,
    headerDate,
    dayColumnWidth,
    weekDateItemWidth,
    derivedHeaderHeight,
    isWideScreen,
    visibleStartDateIndex,
    initialIndex,

    weekListRef,
    headerListRef,
    bodyListRef,
    verticalScrollRef,

    // 导出新的 handlers
    onWeekScroll,
    onHeaderScroll,
    onBodyScroll,
    onWeekBeginDrag,
    onHeaderBeginDrag,
    onBodyBeginDrag,
    onScrollEnd,

    onViewableItemsChanged,
    onDateSelect: handleDateSelect,
    onEventPress,
    onHeaderBackPress,
    onVerticalLayout,
  }

  return <WeekViewContext.Provider value={value}>{children}</WeekViewContext.Provider>
}
