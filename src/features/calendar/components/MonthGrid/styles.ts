import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '../../../../theme';
import { CALENDAR_ROW_HEIGHT } from '../../constants'; // ✨ 引入统一高度

export const MONTH_TITLE_HEIGHT = 40;

const isPad = Platform.OS === 'ios' && Platform.isPad;

export const styles = StyleSheet.create({
  container: {},
  monthHeader: {
    height: MONTH_TITLE_HEIGHT,
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
    // height: CALENDAR_ROW_HEIGHT, 
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
    borderRightWidth: isPad ? 0.5 : 0,
    borderRightColor: '#E5E5EA',
  },
  dayCircle: {
    width: 36, // 统一为 36
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCircle: {
    backgroundColor: COLORS.primary, // 改回主题色，或保持黑色看您喜好
  },
  todayCircle: {
    backgroundColor: '#F2F2F7',
  },
  // ✨ 字体样式 (标准版)
  dayText: {
    fontSize: 17, // 统一为 17
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
    bottom: 6, // 统一点点的位置
  },
});