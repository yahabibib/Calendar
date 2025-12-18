import { create } from 'zustand';
import { Platform, Dimensions } from 'react-native';

interface UIState {
  isIpad: boolean;
  // 未来可以在这里扩展其他 UI 状态，例如:
  // orientation: 'portrait' | 'landscape';
  // themeMode: 'light' | 'dark';
}

export const useUIStore = create<UIState>((set) => ({
  // 初始化时直接计算一次即可，Platform.isPad 在应用生命周期内通常不变
  isIpad: Platform.OS === 'ios' && Platform.isPad,
}));