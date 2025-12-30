import { create } from 'zustand';
import { Platform, Dimensions } from 'react-native';

interface UIState {
  isIpad: boolean;
}

export const useUIStore = create<UIState>((set) => ({
  // 初始化时直接计算一次即可，Platform.isPad 在应用生命周期内通常不变
  isIpad: Platform.OS === 'ios' && Platform.isPad,
}));