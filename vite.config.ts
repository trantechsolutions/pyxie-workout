import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg', 'icons/icon-maskable.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Pyxie — Pet Calisthenics',
        short_name: 'Pyxie',
        description: 'A retro pixel-art calisthenics pet. Train daily to evolve your creature through five stages.',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0a0418',
        theme_color: '#0a0418',
        categories: ['fitness', 'health', 'games', 'lifestyle'],
        icons: [
          { src: 'icons/icon.svg',             sizes: 'any',     type: 'image/svg+xml', purpose: 'any' },
          { src: 'icons/icon-maskable.svg',    sizes: 'any',     type: 'image/svg+xml', purpose: 'maskable' },
          { src: 'icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png',     purpose: 'any' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'pyxie-fonts' }
          }
        ]
      }
    })
  ],
  build: {
    target: 'es2022',
    sourcemap: false
  }
});
