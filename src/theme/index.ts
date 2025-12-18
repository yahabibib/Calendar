export const COLORS = {
  primary: '#00adf5',    // 主色调
  secondary: '#50cebb',  // 辅助色
  background: '#F5F5F5', // 背景色
  cardBg: '#FFFFFF',     // 卡片背景
  text: '#333333',       // 正文
  textLight: '#999999',  // 浅色文字
  border: '#E0E0E0',     // 边框
  danger: '#ff4d4f',     // 警告/删除
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// 可以在这里导出通用的样式混合 (Mixins)
export const COMMON_STYLES = {
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android 阴影
  }
};