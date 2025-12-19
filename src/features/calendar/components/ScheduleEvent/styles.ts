import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    // 移除 absolute, top, height 等布局属性，只保留外观属性
    borderRadius: 4,
    padding: 4,
    justifyContent: 'flex-start',
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  title: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  time: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
  },
})