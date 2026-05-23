/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

import type { StorageAdapter } from './lib/storage';

declare global {
  interface Window {
    storage?: StorageAdapter;
  }
}

export {};
