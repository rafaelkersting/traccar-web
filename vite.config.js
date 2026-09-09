import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import branding from './branding.js';
import {
  DEFAULT_SYSTEM_THEME,
  SYSTEM_THEME_STORAGE_KEY,
  SYSTEM_THEMES,
} from './src/common/theme/systemThemes.js';

const systemThemeBootstrap = Object.freeze({
  defaultTheme: DEFAULT_SYSTEM_THEME,
  storageKey: SYSTEM_THEME_STORAGE_KEY,
  themeIds: SYSTEM_THEMES.map((item) => item.id),
});

const systemThemeBootstrapPlugin = {
  name: 'system-theme-bootstrap',
  transformIndexHtml: (html) =>
    html.replace('__SYSTEM_THEME_BOOTSTRAP__', JSON.stringify(systemThemeBootstrap)),
};

export default defineConfig(() => ({
  server: {
    port: 3000,
    proxy: {
      '/api/socket': 'ws://localhost:8082',
      '/api': 'http://localhost:8082',
    },
  },
  build: {
    outDir: 'build',
    chunkSizeWarningLimit: 1100,
  },
  plugins: [
    systemThemeBootstrapPlugin,
    svgr(),
    react(),
    VitePWA({
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png'],
      workbox: {
        navigateFallbackDenylist: [/^\/api/],
        globPatterns: ['**/*.{js,css,html,woff,woff2,mp3}'],
      },
      manifest: {
        short_name: branding.name,
        name: branding.name,
        theme_color: '${colorPrimary}',
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
    viteStaticCopy({
      targets: [
        { src: 'node_modules/@mapbox/mapbox-gl-rtl-text/dist/mapbox-gl-rtl-text.js', dest: '' },
      ],
    }),
  ],
}));
