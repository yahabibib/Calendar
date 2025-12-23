// src/features/event/details/ActionFooter.tsx
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface ActionFooterProps {
  onDelete: () => void
}

export const ActionFooter: React.FC<ActionFooterProps> = ({ onDelete }) => {
  // ♻️ 修改：移除内部的 Alert 逻辑
  // 现在的 ActionFooter 是个“哑组件”，它只负责传达“我被按了”这个动作
  // 具体的弹窗逻辑（确认删除 vs 选择删除模式）全部交给父组件 EventDetailsScreen 处理

  return (
    <View style={styles.container}>
      {/* 直接绑定 onDelete，不经过中间商 */}
      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
        <Text style={styles.deleteText}>删除日程</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 40,
  },
  deleteBtn: {
    backgroundColor: 'white',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  deleteText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ff3b30',
  },
})
