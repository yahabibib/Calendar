import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native'
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useEventStore } from '../store/eventStore'
import { RootStackParamList } from '../types/navigation'
import { COLORS, SPACING, COMMON_STYLES } from '../theme'

export const AddEventScreen = () => {
  const navigation = useNavigation()

  // 1. 获取路由参数
  const route = useRoute<RouteProp<RootStackParamList, 'AddEvent'>>()
  const eventToEdit = route.params?.event // 如果有这个值，说明是编辑模式

  const { addEvent, updateEvent } = useEventStore() // 取出 updateEvent

  // 2. 初始化 State：如果有 eventToEdit，就用它的值；否则用默认值
  const [title, setTitle] = useState(eventToEdit?.title || '')
  const [location, setLocation] = useState(eventToEdit?.location || '')
  const [description, setDescription] = useState(eventToEdit?.description || '')
  const [isAllDay, setIsAllDay] = useState(eventToEdit?.isAllDay || false)

  const [startDate, setStartDate] = useState(
    eventToEdit ? new Date(eventToEdit.startTime) : new Date(),
  )
  const [endDate, setEndDate] = useState(
    eventToEdit ? new Date(eventToEdit.endTime) : new Date(Date.now() + 3600000),
  )

  // 提交逻辑
  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('提示', '请输入日程标题')
      return
    }

    const eventData = {
      // 3. 关键逻辑：编辑模式沿用旧 ID，新增模式生成新 ID
      id: eventToEdit ? eventToEdit.id : Date.now().toString(),
      title,
      location,
      description,
      isAllDay,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
    }

    if (eventToEdit) {
      updateEvent(eventData) // 更新
    } else {
      addEvent(eventData) // 新增
    }

    navigation.goBack()
  }

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 (自定义右侧保存按钮) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerButton}>取消</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{eventToEdit ? '编辑日程' : '新建日程'}</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.headerButton, { fontWeight: 'bold' }]}>保存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* 标题输入 */}
        <TextInput
          style={styles.inputTitle}
          placeholder="请输入标题"
          value={title}
          onChangeText={setTitle}
          placeholderTextColor={COLORS.textLight}
        />

        {/* 核心配置区域 */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>全天</Text>
            <Switch value={isAllDay} onValueChange={setIsAllDay} />
          </View>

          <View style={styles.divider} />

          {/* 开始时间选择器 */}
          <View style={styles.row}>
            <Text style={styles.label}>开始</Text>
            <DateTimePicker
              value={startDate}
              mode={isAllDay ? 'date' : 'datetime'}
              display="default"
              onChange={(e, date) => date && setStartDate(date)}
              style={{ width: 190 }} // iOS 样式调整
              themeVariant="light"
            />
          </View>

          <View style={styles.divider} />

          {/* 结束时间选择器 */}
          <View style={styles.row}>
            <Text style={styles.label}>结束</Text>
            <DateTimePicker
              value={endDate}
              mode={isAllDay ? 'date' : 'datetime'}
              display="default"
              onChange={(e, date) => date && setEndDate(date)}
              style={{ width: 190 }}
              themeVariant="light"
            />
          </View>
        </View>

        {/* 更多信息 */}
        <View style={styles.section}>
          <TextInput
            style={styles.inputRow}
            placeholder="地点"
            value={location}
            onChangeText={setLocation}
          />
          <View style={styles.divider} />
          <TextInput
            style={[styles.inputRow, { height: 100 }]}
            placeholder="备注"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top" // Android 对齐
          />
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // iOS 风格背景灰
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60, // 适配刘海屏，粗略值，可用 SafeAreaView 优化
    paddingBottom: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerButton: {
    fontSize: 17,
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  inputTitle: {
    backgroundColor: 'white',
    padding: 16,
    fontSize: 18,
    marginBottom: 20,
  },
  section: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    paddingLeft: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingRight: 16,
  },
  inputRow: {
    paddingVertical: 16,
    paddingRight: 16,
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 0,
  },
})
