import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '../../../../theme';

export const MONTH_TITLE_HEIGHT = 50;

// 为了在样式文件中使用 isIpad 判断，我们可以导出一个函数，或者直接在这里判断
// 但为了保持纯粹，我们尽量让样式静态化，动态部分通过 props 或行内样式传入
const isPad = Platform.OS === 'ios' && Platform.isPad;

export const styles = StyleSheet.create({
  container: {},
  monthHeader: {
    height: MONTH_TITLE_HEIGHT,
    justifyContent: 'flex-end',
    paddingBottom: 10,
  },
  monthHeaderText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'left',
    marginLeft: 5,
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
    justifyContent: 'flex-start',
    paddingTop: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
    // 竖线逻辑：iPad 显示，手机不显示
    borderRightWidth: isPad ? 0.5 : 0,
    borderRightColor: '#E5E5EA',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    fontSize: 19,
    color: '#000',
    fontWeight: '400',
    letterSpacing: -0.5,
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