import { Dimensions, Platform } from 'react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

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
export const YEAR_HEADER_HEIGHT = NAV_BAR_HEIGHT + TITLE_BAR_HEIGHT;

// ==========================================
// 📅 3. 核心统一高度 (The Golden Height)
// ==========================================

// ✨ 关键决策：为了保证 Morphing 动画完美，月视图的行高和周视图的头高必须完全一致。
// 我们可以根据屏幕动态计算，但必须锁定为一个定值。
// 52px - 56px 是移动端比较舒适的点击区域高度。
export const UNIFIED_ROW_HEIGHT = 56; 

// 1. 周视图模式下的行高 (固定值，为了手指好点)
export const WEEK_MODE_HEIGHT = 52; 

// 2. 月视图行高 (不再是定值，而是根据屏幕动态计算，这里只留一个默认值做兜底)
export const MIN_MONTH_ROW_HEIGHT = 52; 

// 3. 月份内部标题高度 (MonthGrid 里的 "1月")
export const MONTH_TITLE_HEIGHT = 40;