import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 5,
    marginBottom: 20,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
    marginLeft: 2,
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
  },
})
