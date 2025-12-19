import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {},
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
    marginLeft: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden', // 确保多余的行不会溢出
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCell: {
    backgroundColor: '#ff3b30',
    borderRadius: 999,
  },
  dayText: {
    fontSize: 10,
    color: '#333',
    fontWeight: '500',
  },
  todayText: {
    color: 'white',
    fontWeight: 'bold',
  }
});