import { Dimensions } from 'react-native';

const { height: windowHeight, width: windowWidth } = Dimensions.get('window');

export const CALENDAR_ROW_HEIGHT = 55;
export const HOUR_HEIGHT = 60; 
export const TIME_LABEL_WIDTH = 50; 
export const ALL_DAY_HEADER_HEIGHT = 40; // 全天行高度

// 时间轴的宽度
export const TIME_AXIS_WIDTH = 50

export const DAY_COLUMN_WIDTH = (windowWidth - TIME_AXIS_WIDTH) / 1 // 如果是一天一页