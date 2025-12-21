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
  onWeekScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void
  onHeaderScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void
  onBodyScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void
  onWeekBeginDrag: () => void
  onHeaderBeginDrag: () => void
  onBodyBeginDrag: () => void
  onScrollEnd: () => void
  onViewableItemsChanged: (info: { viewableItems: ViewToken[] }) => void
  onDateSelect: (date: string) => void
  onEventPress?: (event: CalendarEvent) => void
  onHeaderBackPress?: (date: Date) => void
  onVerticalLayout: (event: any) => void

  // ✨ 仅保留编辑状态，彻底移除 triggerPageScroll
  editingEventId?: string | null
  setEditingEventId: (id: string | null) => void
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
  // ⚠️ 确保这里没有 triggerPageScroll
}) => {
  const { width: screenWidth } = useWindowDimensions()
  const events = useEventStore(state => state.events)

  const weekListRef = useRef<FlatList>(null)
  const headerListRef = useRef<FlatList>(null)
  const bodyListRef = useRef<FlatList>(null)
  const verticalScrollRef = useRef<ScrollView>(null)

  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const activeScroll = useRef<ScrollSource>(null)

  const isWideScreen = screenWidth > 600
  const numColumns = isWideScreen ? 7 : 2
  const dayColumnWidth = (screenWidth - TIME_LABEL_WIDTH) / numColumns
  const weekDateItemWidth = screenWidth / 7
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
  const [viewportHeight, setViewportHeight] = useState(0)
  const [hasScrolledToNow, setHasScrolledToNow] = useState(false)

  const derivedHeaderHeight = useMemo(() => {
    const contentHeight = maxAllDayCount * (ALL_DAY_EVENT_HEIGHT + ALL_DAY_EVENT_GAP)
    const total = DATE_HEADER_MIN_HEIGHT + contentHeight + HEADER_VERTICAL_PADDING
    return Math.max(total, 45)
  }, [maxAllDayCount])

  const updateVisibleIndex = (bodyOffsetX: number) => {
    const index = Math.round(bodyOffsetX / dayColumnWidth)
    setVisibleStartDateIndex(prev => (prev !== index ? index : prev))
  }

  // 基础滚动联动逻辑
  const onWeekBeginDrag = useCallback(() => {
    activeScroll.current = 'week'
  }, [])
  const onWeekScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (activeScroll.current !== 'week') return
      const weekOffsetX = e.nativeEvent.contentOffset.x
      const targetBodyOffset = weekOffsetX / ratio
      bodyListRef.current?.scrollToOffset({ offset: targetBodyOffset, animated: false })
      headerListRef.current?.scrollToOffset({ offset: targetBodyOffset, animated: false })
      updateVisibleIndex(targetBodyOffset)
    },
    [ratio],
  )

  const onHeaderBeginDrag = useCallback(() => {
    activeScroll.current = 'header'
  }, [])
  const onHeaderScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (activeScroll.current !== 'header') return
      const headerOffsetX = e.nativeEvent.contentOffset.x
      bodyListRef.current?.scrollToOffset({ offset: headerOffsetX, animated: false })
      weekListRef.current?.scrollToOffset({ offset: headerOffsetX * ratio, animated: false })
      updateVisibleIndex(headerOffsetX)
    },
    [ratio],
  )

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

  const onScrollEnd = useCallback(() => {}, [])

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
        bodyListRef.current?.scrollToIndex({ index: initialIndex, animated: false })
        headerListRef.current?.scrollToIndex({ index: initialIndex, animated: false })
        weekListRef.current?.scrollToIndex({ index: initialIndex, animated: false })
      }, 100)
    }
  }, [initialIndex])

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

  const handleDateSelect = useCallback(
    (dateStr: string) => {
      onDateSelect(dateStr)
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
    editingEventId,
    setEditingEventId,
  }

  return <WeekViewContext.Provider value={value}>{children}</WeekViewContext.Provider>
}
