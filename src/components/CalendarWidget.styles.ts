import { StyleSheet } from 'react-native';
import { COLORS } from '../theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  headerContainer: {
    backgroundColor: 'white',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
    paddingBottom: 10,
  },
  navRow: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  yearButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yearArrow: {
    fontSize: 18,
    color: COLORS.primary,
    marginRight: 4,
    fontWeight: '600',
  },
  yearText: {
    fontSize: 17,
    color: COLORS.primary,
    fontWeight: '600',
  },
  arrowIcon: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  titleRow: {
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  monthTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5,
  },
  weekRow: {
    flexDirection: 'row',
    marginTop: 5,
  },
  weekText: {
    textAlign: 'center',
    color: '#3C3C4399',
    fontSize: 13,
    fontWeight: '600',
  },
});