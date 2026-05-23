import type { UIState, Tab } from '../types';
import { DEFAULT_UI } from '../../data/constants';
import type { PyxieSlice } from './types';

export interface UISlice {
  ui: UIState;
  setTab: (tab: Tab) => void;
}

export const createUISlice: PyxieSlice<UISlice> = (set) => ({
  ui: { ...DEFAULT_UI },
  setTab: (tab) => set((s) => ({ ui: { ...s.ui, tab, previewList: null } })),
});
