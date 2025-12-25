// src/features/calendar/constants.ts
import { Dimensions, Platform } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ==========================================
// 📏 1. 基础积木高度
// ==========================================

export const NAV_BAR_HEIGHT = 44;
export const TITLE_BAR_HEIGHT = 40;
export const WEEK_DAYS_HEIGHT = 30;

// ==========================================
// 📐 2. 组合高度
// ==========================================

export const MONTH_HEADER_HEIGHT = NAV_BAR_HEIGHT + TITLE_BAR_HEIGHT + WEEK_DAYS_HEIGHT;
// ✨ 新增：周视图折叠后的头部高度 (Header折叠后剩下的部分 + WeekDateList的高度)
// 实际上 CalendarWrapper 的高度在周模式下应该等于 WeekDateList 的高度
export const WEEK_MODE_HEIGHT = 58; 

export const YEAR_HEADER_HEIGHT = NAV_BAR_HEIGHT + TITLE_BAR_HEIGHT;

// ==========================================
// 📅 3. 日历网格尺寸 (调整部分)
// ==========================================

// ✨ 修复 MonthView 留白太多：
// 之前是 0.55，现在改为 0.78 (约 3/4 屏)，让日历占据更多空间
// 减去一些头部和底部安全距离，剩下的除以 6 行
const AVAILABLE_CALENDAR_HEIGHT = SCREEN_HEIGHT * 0.78; 
export const CALENDAR_ROW_HEIGHT = Math.floor(AVAILABLE_CALENDAR_HEIGHT / 6);