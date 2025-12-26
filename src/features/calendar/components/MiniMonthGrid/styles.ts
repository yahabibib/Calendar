import { StyleSheet } from 'react-native';
import { COLORS } from '../../../../theme';

export const styles = StyleSheet.create({
  container: {},
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
    marginLeft: 2,
    // 颜色在组件内通过内联样式覆盖，或者在这里统一
    color: COLORS.primary, 
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // overflow: 'hidden', // 不需要 hidden，否则可能切掉边缘
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ✨ 优化：今天的样式改为浅灰底
  todayCell: {
    backgroundColor: '#F2F2F7', // 浅灰色背景
    borderRadius: 999,
  },
  // ✨ 优化：普通日期文字纯黑
  dayText: {
    fontSize: 10,
    color: '#000000', 
    fontWeight: '500',
  },
  // ✨ 优化：今天日期文字用主题色
  todayText: {
    color: COLORS.primary,
    fontWeight: '600',
  }
});