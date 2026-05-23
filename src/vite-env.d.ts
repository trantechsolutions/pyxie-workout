/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module '*.md?raw' {
  const content: string;
  export default content;
}

import type { StorageAdapter } from './lib/storage';

declare global {
  interface Window {
    storage?: StorageAdapter;
  }
}

export {};
