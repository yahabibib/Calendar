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
  InteractionManager,
} from 'react-native'
import {
  addDays,
  addWeeks,
  startOfWeek,
  differenceInCalendarDays,
  isSameDay,
  isValid,
} from 'date-fns'
import { useEventStore } from '../../../../../../store/eventStore'
import { CalendarEvent } from '../../../../../../types/event'
import {
  TIME_LABEL_WIDTH as IMPORTED_TIME_LABEL_WIDTH,
  HOUR_HEIGHT,
} from '../../../../../../theme/layout'

// 时间轴宽度兜底
const TIME_LABEL_WIDTH = IMPORTED_TIME_LABEL_WIDTH || 52
const PAST_DAYS_RANGE = 365
const TOTAL_PAGES_ESTIMATE = 730
const ALL_DAY_EVENT_HEIGHT = 18
const ALL_DAY_EVENT_GAP = 2
const DATE_HEADER_MIN_HEIGHT = 30
const HEADER_VERTICAL_PADDING = 4

// 滚动来源标识
type ScrollSource = 'header' | 'body' | 'allDay' | null

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
  areEventsVisible: boolean

  // Refs
  headerListRef: React.RefObject<FlatList> // WeekDateList (Header)
  allDayListRef: React.RefObject<FlatList> // ✨ 新增: AllDayList
  bodyListRef: React.RefObject<FlatList> // BodyList (Grid)
  verticalScrollRef?: React.RefObject<ScrollView>

  // Scroll Handlers
  onHeaderScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void // Body -> Header (Flip)
  onBodyScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void // Body -> AllDay (Sync)
  onAllDayScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void // ✨ AllDay -> Body (Sync)

  onBodyBeginDrag: () => void
  onAllDayBeginDrag: () => void

  onScrollEnd: () => void
  onViewableItemsChanged: (info: { viewableItems: ViewToken[] }) => void

  onDateSelect: (date: string) => void
  onEventPress?: (event: CalendarEvent) => void
  onHeaderBackPress?: (date: Date) => void
  onVerticalLayout: (event: any) => void

  focusedDate: Date // 暴露给 Header 高亮用

  editingEventId?: string | null
  setEditingEventId: (id: string | null) => void
}

const WeekViewContext = createContext<WeekViewContextType | null>(null)

export const useWeekViewContext = () => {
  const context = useContext(WeekViewContext)
  if (!context) throw new Error('useWeekViewContext must be used within a WeekViewProvider')
  return context
}

interface WeekViewProviderProps {
  children: React.ReactNode
  selectedDate: string
  onDateSelect: (date: string) => void
  onEventPress?: (event: CalendarEvent) => void
  onHeaderBackPress?: (date: Date) => void
  areEventsVisible: boolean // <--- 新增
}

export const WeekViewProvider: React.FC<WeekViewProviderProps> = ({
  children,
  selectedDate,
  onDateSelect,
  onEventPress,
  onHeaderBackPress,
  areEventsVisible,
}) => {
  const { width: screenWidth } = useWindowDimensions()
  const events = useEventStore(state => state.events)

  // Refs
  const headerListRef = useRef<FlatList>(null)
  const allDayListRef = useRef<FlatList>(null)
  const bodyListRef = useRef<FlatList>(null)
  const verticalScrollRef = useRef<ScrollView>(null)
  // 防止死循环锁
  const activeScroll = useRef<ScrollSource>(null)

  const isWideScreen = screenWidth > 600
  const numColumns = isWideScreen ? 7 : 2

  // 可用宽度：屏幕宽度 - 时间轴宽度
  const availableWidth = screenWidth - TIME_LABEL_WIDTH
  // 日期列宽度
  const dayColumnWidth = availableWidth / numColumns || 0
  // header 部分每日的宽度
  const weekDateItemWidth = screenWidth / 7

  // 计算去年今年明年的日期列表、坐标原点
  const { dayList, startDateAnchor } = useMemo(() => {
    const today = new Date()
    const anchor = startOfWeek(today, { weekStartsOn: 1 })
    const start = addWeeks(anchor, -52)
    // 确保生成的列表项都是有效 Date
    const list = Array.from({ length: 728 }).map((_, i) => addDays(start, i))
    return { dayList: list, startDateAnchor: start }
  }, [])

  // 滑动窗口聚焦日期
  const [focusedDate, setFocusedDate] = useState(() => new Date(selectedDate))
  // 标题栏显示月份
  const [headerDate, setHeaderDate] = useState(() => new Date(selectedDate))
  // 全天事件最大行数
  const [maxAllDayCount, setMaxAllDayCount] = useState(0)
  //  当前可视区第一天索引
  const [visibleStartDateIndex, setVisibleStartDateIndex] = useState(0)
  // 拖拽编辑状态
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  // 视口高度
  const [viewportHeight, setViewportHeight] = useState(0)
  // 是否已定位
  const [hasScrolledToNow, setHasScrolledToNow] = useState(false)
  // 当前周索引，触发 header 翻页动画
  const currentWeekIndexRef = useRef<number>(0)

  // 全天事件行动态高度
  const derivedHeaderHeight = useMemo(() => {
    const contentHeight = maxAllDayCount * (ALL_DAY_EVENT_HEIGHT + ALL_DAY_EVENT_GAP)
    const total = DATE_HEADER_MIN_HEIGHT + contentHeight + HEADER_VERTICAL_PADDING
    return Math.max(total, 45)
  }, [maxAllDayCount])

  // 根据滚动距离算出当前是哪一天，并更新高亮
  const updateVisibleIndex = (bodyOffsetX: number) => {
    if (dayColumnWidth <= 0) return
    const index = Math.round(bodyOffsetX / dayColumnWidth)
    setVisibleStartDateIndex(prev => (prev !== index ? index : prev))

    // 更新 focusedDate
    const currentDay = dayList[index]
    if (currentDay && !isSameDay(currentDay, focusedDate)) {
      setFocusedDate(currentDay)
    }
  }

  // 检查是否跨周并翻动 Header
  const checkHeaderFlip = (x: number) => {
    if (dayColumnWidth <= 0) return
    const dayIndex = Math.round(x / dayColumnWidth)
    const currentDayDate = dayList[dayIndex]
    if (!currentDayDate) return

    const diffDays = differenceInCalendarDays(currentDayDate, startDateAnchor)
    const weekIndex = Math.floor(diffDays / 7)

    if (weekIndex !== currentWeekIndexRef.current) {
      currentWeekIndexRef.current = weekIndex
      // Header 整周翻页 (index based)
      headerListRef.current?.scrollToIndex({ index: weekIndex, animated: true })
    }
  }

  // AllDay 滚动，驱动 Body
  const onAllDayBeginDrag = useCallback(() => {
    activeScroll.current = 'allDay'
  }, [])
  const onAllDayScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (activeScroll.current !== 'allDay') return
      const x = e.nativeEvent.contentOffset.x
      // 线性同步 Body
      bodyListRef.current?.scrollToOffset({ offset: x, animated: false })
      updateVisibleIndex(x)
      // 检查是否需要翻页 Header
      checkHeaderFlip(x)
    },
    [dayColumnWidth, startDateAnchor],
  )

  // Body 滑动时，Header 不动，只更新高亮；跨周时 Header 才翻页
  const onBodyBeginDrag = useCallback(() => {
    activeScroll.current = 'body'
  }, [])
  const onBodyScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (activeScroll.current !== 'body') return
      const x = e.nativeEvent.contentOffset.x

      // 线性同步 AllDay
      allDayListRef.current?.scrollToOffset({ offset: x, animated: false })

      // 更新高亮聚焦日期
      if (dayColumnWidth > 0) {
        const index = Math.round(x / dayColumnWidth)
        const currentDay = dayList[index]
        if (currentDay && !isSameDay(currentDay, focusedDate)) {
          setFocusedDate(currentDay)
        }

        // 检查是否需要 Header 翻页
        const weekIndex = Math.floor(index / 7)
        if (weekIndex !== currentWeekIndexRef.current) {
          currentWeekIndexRef.current = weekIndex
          // Header 滚动到该周的周一
          headerListRef.current?.scrollToIndex({ index: weekIndex * 7, animated: true })
        }
      }
    },
    [dayColumnWidth, dayList, focusedDate],
  )

  // Header 翻页时，带动 Body 跳转到该周周一
  const onHeaderScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (activeScroll.current !== 'header') return
      const x = e.nativeEvent.contentOffset.x
      const { width: screenWidth } = Dimensions.get('window')

      // a. 算出当前翻到了第几周
      const weekIndex = Math.round(x / screenWidth)

      if (weekIndex !== currentWeekIndexRef.current) {
        currentWeekIndexRef.current = weekIndex

        // b. 算出目标周一的 Offset (Body)
        const targetBodyOffset = weekIndex * 7 * dayColumnWidth

        // c. 同步 Body 和 AllDay 到该周周一
        bodyListRef.current?.scrollToOffset({ offset: targetBodyOffset, animated: false })
        allDayListRef.current?.scrollToOffset({ offset: targetBodyOffset, animated: false })

        // d. 更新高亮到周一
        const targetDate = dayList[weekIndex * 7]
        if (targetDate) setFocusedDate(targetDate)
      }
    },
    [dayColumnWidth, dayList],
  )

  const onScrollEnd = useCallback(() => {}, [])

  // 更新导航栏标题、计算全天行高度
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (!viewableItems || viewableItems.length === 0) return
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

  // 初始化索引：偏移天数
  const initialIndex = useMemo(() => {
    const target = new Date(selectedDate)
    if (!isValid(target)) return 0
    return Math.max(0, differenceInCalendarDays(target, startDateAnchor))
  }, [selectedDate, startDateAnchor])

  useEffect(() => {
    if (initialIndex > 0) {
      setVisibleStartDateIndex(initialIndex)
      // 初始定位：定位到选中日期的那一周
      const weekDiff = Math.floor(initialIndex / 7)

      // 使用 InteractionManager 确保在转场动画/JS任务完成后再执行滚动
      const task = InteractionManager.runAfterInteractions(() => {
        // 这里的逻辑会在所有交互/动画结束后执行，确保列表组件已挂载且布局完成
        bodyListRef.current?.scrollToIndex({ index: initialIndex, animated: false })
        allDayListRef.current?.scrollToIndex({ index: initialIndex, animated: false })
        // Header 滚到该周周一
        headerListRef.current?.scrollToIndex({ index: weekDiff * 7, animated: false })

        currentWeekIndexRef.current = weekDiff
      })

      return () => task.cancel()
    }
  }, [initialIndex])

  // 垂直时间线定位逻辑 (保持不变)
  useEffect(() => {
    if (viewportHeight > 0 && !hasScrolledToNow && verticalScrollRef.current) {
      const now = new Date()
      const totalMinutes = now.getHours() * 60 + now.getMinutes()
      const lineY = (totalMinutes / 60) * HOUR_HEIGHT
      let targetOffset = lineY - viewportHeight / 2
      const contentHeight = HOUR_HEIGHT * 24
      const maxOffset = contentHeight - viewportHeight
      targetOffset = Math.max(0, Math.min(targetOffset, maxOffset))
      verticalScrollRef.current.scrollTo({ y: targetOffset, animated: false })
      setHasScrolledToNow(true)
    }
  }, [viewportHeight, hasScrolledToNow])

  // 处理用户点击日期联动
  const handleDateSelect = useCallback(
    (dateStr: string) => {
      console.log(`🔵 [WeekViewContext] handleDateSelect 触发: ${dateStr}`)
      onDateSelect(dateStr)
      const d = new Date(dateStr)
      setFocusedDate(d) // 立即高亮

      // 计算从时间原点到选中日期的偏移天数（dayList对应的索引）
      const diff = differenceInCalendarDays(d, startDateAnchor)
      const index = Math.max(0, diff)
      // 对应的周索引（偏移周数）
      const weekIndex = Math.floor(diff / 7)

      console.log(`  Diff Days: ${diff}`)
      console.log(`  Week Index: ${weekIndex}`)
      console.log(`  Header Scroll To Index (Monday): ${weekIndex * 7}`)

      // body 滚动到具体那一天
      bodyListRef.current?.scrollToIndex({ index, animated: true })
      allDayListRef.current?.scrollToIndex({ index, animated: true })

      // header 滚动到该周的周一（对齐MonthBody中的计算日历布局）
      headerListRef.current?.scrollToIndex({ index: weekIndex * 7, animated: true })

      currentWeekIndexRef.current = weekIndex
    },
    [startDateAnchor, onDateSelect],
  )

  // 初始化滚动到当前时间
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
    areEventsVisible,

    // Refs
    headerListRef,
    allDayListRef,
    bodyListRef,
    verticalScrollRef,

    // Handlers
    onHeaderScroll,
    onBodyScroll,
    onAllDayScroll,
    onBodyBeginDrag,
    onAllDayBeginDrag,

    onScrollEnd,
    onViewableItemsChanged,
    onDateSelect: handleDateSelect,
    onEventPress,
    onHeaderBackPress,
    onVerticalLayout,
    editingEventId,
    setEditingEventId,
    focusedDate,
  }

  return <WeekViewContext.Provider value={value}>{children}</WeekViewContext.Provider>
}
