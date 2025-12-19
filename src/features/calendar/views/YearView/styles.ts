import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  yearPage: {
    paddingHorizontal: 10,
    marginBottom: 30,
  },
  yearTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
    marginLeft: 5,
    marginTop: 10,
    height: 40, // ✨ 给标题固定一个高度，方便计算
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
});