// src/features/event/details/ActionFooter.tsx
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'

interface ActionFooterProps {
  onDelete: () => void
}

export const ActionFooter: React.FC<ActionFooterProps> = ({ onDelete }) => {
  const handleDeletePress = () => {
    Alert.alert('删除日程', '确定要删除这个日程吗？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: onDelete },
    ])
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDeletePress}>
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
    borderColor: '#ff3b30', // 红色边框，更警示
  },
  deleteText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ff3b30',
  },
})
