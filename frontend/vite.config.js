import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Lets the service worker run against the dev server too (`npm run dev`), not
      // just a production build - otherwise offline behavior can only be tested via
      // `vite build && vite preview`.
      devOptions: { enabled: true, type: 'module' },
      includeAssets: ['favicon.png'],
      manifest: {
        name: 'TrainMitra',
        short_name: 'TrainMitra',
        description: 'Live train delay reports, status updates, and schedules for Indian Railways passengers.',
        theme_color: '#f97316',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The main JS bundle is a single ~2.4MB chunk (pre-existing, unrelated to
        // this feature - see the "chunks larger than 500kB" build warning), which
        // exceeds Workbox's default 2MB precache limit.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Train schedule/search/route lookups are read-only GETs, so caching them
        // is safe; everything else (auth, reports, votes) is left untouched and
        // always hits the network.
        runtimeCaching: [
          {
            urlPattern: ({ url, request }) => request.method === 'GET' && url.pathname.includes('/trains'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'train-schedules',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
  },
})
