import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '../../../../theme';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'white',
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  weekDayText: {
    fontSize: 12,
    color: '#999', // 默认灰色
    marginBottom: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCircle: {
    backgroundColor: COLORS.primary, // 深色高亮
  },
  // ✨ 新增：浅色高亮 (下一天)
  secondarySelectedCircle: {
    backgroundColor: COLORS.primary + '1A', // 10% 透明度的主题色
  },
  todayCircle: {
    backgroundColor: '#F2F2F7',
  },
  dayText: {
    fontSize: 17,
    color: '#000',
    fontWeight: '400',
  },
  selectedText: {
    color: 'white',
    fontWeight: '600',
  },
  todayText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  dotContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
});