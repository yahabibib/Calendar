import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    borderRadius: 4,
    padding: 2,
    borderLeftWidth: 3,
    overflow: 'hidden',
    // 默认样式，会被 props 覆盖
    width: '100%', 
  },
  title: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
  },
  time: {
    fontSize: 9,
    color: '#555',
  },
});