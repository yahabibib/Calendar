import { StyleSheet } from 'react-native';
import { COLORS } from '../../../../../../theme';

export const styles = StyleSheet.create({
  container: {},
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
    marginLeft: 2,
    color: COLORS.primary, 
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCell: {
    backgroundColor: '#F2F2F7', // 浅灰色背景
    borderRadius: 999,
  },
  dayText: {
    fontSize: 10,
    color: '#000000', 
    fontWeight: '500',
  },
  todayText: {
    color: COLORS.primary,
    fontWeight: '600',
  }
});