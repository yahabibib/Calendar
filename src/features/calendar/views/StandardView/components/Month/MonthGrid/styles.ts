import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '@/theme';

export const MONTH_TITLE_HEIGHT = 40;

const isPad = Platform.OS === 'ios' && Platform.isPad;

export const styles = StyleSheet.create({
  container: {},
  monthHeader: {
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  monthHeaderText: {
    fontSize: 22, // 稍微调小一点更精致
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'left',
    marginLeft: 12,
  },
  monthHeaderTextYear: {
    color: '#000',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center', 
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
    borderRightWidth: isPad ? 0.5 : 0,
    borderRightColor: '#E5E5EA',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCircle: {
    backgroundColor: COLORS.primary,
  },
  todayCircle: {
    backgroundColor: '#F2F2F7',
  },
  dayText: {
    fontSize: 17,
    color: '#000',
    fontWeight: '400',
    letterSpacing: -0.3,
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
    position: 'absolute',
    bottom: 6,
  },
});