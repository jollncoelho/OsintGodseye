import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['leaflet', 'react-leaflet', 'maplibre-gl'],
  },
  server: {
    proxy: {
      '/api/adsb': {
        target: 'https://api.adsb.lol',
        changeOrigin: true,
        rewrite: (path) => {
          const url = new URL(path, 'https://api.adsb.lol');
          const endpoint = url.searchParams.get('endpoint');
          if (endpoint === 'mil') return '/v2/mil';
          const lat = url.searchParams.get('lat');
          const lon = url.searchParams.get('lon');
          const dist = url.searchParams.get('dist') || '250';
          return `/v2/lat/${lat}/lon/${lon}/dist/${dist}`;
        },
      },
    },
  },
});
