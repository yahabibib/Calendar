import { StyleSheet } from 'react-native';
import { HOUR_HEIGHT, TIME_LABEL_WIDTH } from '../../../../theme/layout';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  // 左侧时间刻度列
  timeRulerColumn: {
    width: TIME_LABEL_WIDTH,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
  },
  timeLabel: {
    height: HOUR_HEIGHT,
    justifyContent: 'flex-start', // 文字靠上对齐
    alignItems: 'center',
  },
  timeText: {
    fontSize: 10,
    color: '#999',
    transform: [{ translateY: -6 }], // 微调让时间对齐横线
  },
  // 右侧日程网格区域
  gridContainer: {
    flex: 1,
    position: 'relative',
  },
  // 背景横线层
  gridLinesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  hourLine: {
    height: HOUR_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  // 7列容器
  columnsContainer: {
    flexDirection: 'row',
    flex: 1,
    height: HOUR_HEIGHT * 24, // 撑开高度
  },
  dayColumn: {
    flex: 1, 
    height: '100%',
    borderRightWidth: 0.5, // 细微的纵向分割
    borderRightColor: '#f0f0f0', 
  },
});