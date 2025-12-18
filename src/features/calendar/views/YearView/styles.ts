import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  yearPage: {
    paddingHorizontal: 10,
    marginBottom: 30,
    // 强制高度占满一屏或更多，保证视觉上的分页感
    minHeight: '100%',
  },
  yearTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
    marginLeft: 5,
    marginTop: 10,
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
});