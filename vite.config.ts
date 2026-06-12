import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: '/Espanol-Games/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2,json}'],
        navigateFallback: '/Espanol-Games/index.html',
      },
      manifest: {
        name: 'La Forja del Idioma',
        short_name: 'La Forja',
        description:
          'Forja tu dominio del español: gramática y vocabulario de nivel C en un juego de cartas roguelike.',
        lang: 'es',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/Espanol-Games/#/',
        scope: '/Espanol-Games/',
        background_color: '#15131F',
        theme_color: '#15131F',
        icons: [
          { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
});
