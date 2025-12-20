// src/features/event/details/DetailHeader.tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface DetailHeaderProps {
  title: string
  color: string
}

export const DetailHeader: React.FC<DetailHeaderProps> = ({ title, color }) => {
  return (
    <View style={styles.container}>
      <View style={[styles.colorBar, { backgroundColor: color }]} />
      <Text style={styles.title}>{title}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorBar: {
    width: 6,
    height: 40, // 竖条设计，更有现代感
    borderRadius: 3,
    marginRight: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1c1c1e', // iOS 深色字
    flex: 1,
    lineHeight: 34,
  },
})
