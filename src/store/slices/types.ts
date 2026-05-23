import type { StateCreator } from 'zustand';
import type { PyxieStore } from '../usePyxie';

export type PyxieSlice<T> = StateCreator<PyxieStore, [], [], T>;
