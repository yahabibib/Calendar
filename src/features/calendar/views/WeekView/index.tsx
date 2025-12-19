// src/features/calendar/views/WeekView/index.tsx
import React from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { format, isValid } from 'date-fns'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { styles } from './styles'
import { HOUR_HEIGHT, TIME_LABEL_WIDTH } from '../../../../theme/layout'
import { WeekViewProvider, useWeekViewContext } from './WeekViewContext'
import { WeekDateList } from './components/WeekDateList'
import { AllDayList } from './components/AllDayList'
import { BodyList } from './components/BodyList'

// 内部组件：导航栏 (从 Context 读取数据)
const WeekViewHeader = () => {
  const { headerDate, onHeaderBackPress } = useWeekViewContext()
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        styles.headerContainer,
        {
          paddingTop: insets.top,
          zIndex: 20,
          position: 'relative',
          backgroundColor: 'white',
          paddingBottom: 8,
        },
      ]}>
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => onHeaderBackPress?.(headerDate)}>
          <Text style={styles.backArrow}>◀</Text>
          <Text style={styles.backText}>
            {isValid(headerDate) ? format(headerDate, 'M月') : ''}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.titleRow}>
        <Text style={styles.headerTitle}>
          {isValid(headerDate) ? format(headerDate, 'yyyy年 M月') : ''}
        </Text>
      </View>

      {/* Layer 1: 周历 */}
      <View style={{ flexDirection: 'row', width: '100%', marginTop: 8 }}>
        <WeekDateList />
      </View>
    </View>
  )
}

// 内部组件：全天事件栏
const WeekViewAllDayRow = () => {
  const { derivedHeaderHeight } = useWeekViewContext()
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: '#f9f9f9',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        width: '100%',
        height: derivedHeaderHeight,
        zIndex: 10,
      }}>
      <View
        style={{
          width: TIME_LABEL_WIDTH,
          height: '100%',
          backgroundColor: 'white',
          borderRightWidth: 1,
          borderRightColor: '#f0f0f0',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Text style={{ fontSize: 10, color: '#999', fontWeight: '500' }}>全天</Text>
      </View>
      <AllDayList />
    </View>
  )
}

// 内部组件：网格主体
const WeekViewBody = () => {
  const hours = Array.from({ length: 24 }).map((_, i) => i)
  // 获取 verticalScrollRef 和 onVerticalLayout
  const { verticalScrollRef, onVerticalLayout } = useWeekViewContext()

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={verticalScrollRef} // ✨ 绑定 Ref
        style={{ flex: 1 }}
        bounces={false}
        onLayout={onVerticalLayout} // ✨ 绑定 Layout 事件，报告高度
        showsVerticalScrollIndicator={false} // 可选：隐藏滚动条更美观
      >
        <View style={{ flexDirection: 'row', height: HOUR_HEIGHT * 24, width: '100%' }}>
          {/* 左侧时间轴 */}
          <View
            style={{
              width: TIME_LABEL_WIDTH,
              borderRightWidth: 1,
              borderRightColor: '#f0f0f0',
              backgroundColor: 'white',
            }}>
            {hours.map(h => (
              <View key={h} style={{ height: HOUR_HEIGHT, alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: '#999', transform: [{ translateY: -6 }] }}>
                  {h === 0 ? '' : `${h}:00`}
                </Text>
              </View>
            ))}
          </View>

          {/* 右侧动态网格 */}
          <View style={{ flex: 1 }}>
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              {hours.map(h => (
                <View
                  key={`line-${h}`}
                  style={{
                    height: HOUR_HEIGHT,
                    borderBottomWidth: 1,
                    borderBottomColor: '#f5f5f5',
                  }}
                />
              ))}
            </View>
            <BodyList />
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

// 主入口
export const WeekView: React.FC<any> = props => {
  return (
    <WeekViewProvider {...props}>
      <View style={styles.container}>
        <WeekViewHeader />
        <WeekViewAllDayRow />
        <WeekViewBody />
      </View>
    </WeekViewProvider>
  )
}
