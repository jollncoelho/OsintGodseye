import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { collectCameras } from './shared/cameras';
import { collectVessels } from './shared/vessels';
import { adsbPath, fetchAdsb, type AdsbEndpoint } from './shared/adsb';

/**
 * Dev-only implementation of the `/api/*` serverless routes so `npm run dev`
 * behaves exactly like the deployed Vercel functions. Without this the camera
 * layer 404s in development — which is precisely why the webcams appeared
 * broken.
 */
function apiDevServer(): Plugin {
  const send = (res: ServerResponse, status: number, body: string, cache = 'no-store') => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', cache);
    res.end(body);
  };

  const handleCameras = async (res: ServerResponse) => {
    try {
      const payload = await collectCameras();
      console.log(
        `[api/cameras] ${payload.total} cameras · ` +
          payload.sources.map((s) => `${s.key}=${s.count}`).join(' '),
      );
      send(res, 200, JSON.stringify(payload), 'public, max-age=60');
    } catch (err) {
      send(
        res,
        502,
        JSON.stringify({
          total: 0,
          cameras: [],
          errors: [err instanceof Error ? err.message : 'failed'],
          sources: [],
        }),
      );
    }
  };

  const handleVessels = async (res: ServerResponse) => {
    try {
      const payload = await collectVessels();
      console.log(
        `[api/vessels] ${payload.vessels.length} live AIS targets` +
          (payload.errors.length ? ` · ${payload.errors.length} degraded` : ''),
      );
      send(res, 200, JSON.stringify({ ...payload, total: payload.vessels.length }), 'public, max-age=45');
    } catch (err) {
      send(
        res,
        502,
        JSON.stringify({
          total: 0,
          vessels: [],
          errors: [err instanceof Error ? err.message : 'failed'],
        }),
      );
    }
  };

  /**
   * Dev mirror of `api/adsb.ts`: provider failover plus a short cache.
   * Without the cache every browser refresh re-hit the upstream and quickly
   * tripped its rate limit, which is what emptied the aircraft layer in dev.
   */
  const adsbCache = new Map<string, { ts: number; body: string }>();
  const ADSB_TTL_MS = 30_000;

  const handleAdsb = async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? '', 'http://localhost');
    const endpoint = url.searchParams.get('endpoint') === 'mil' ? 'mil' : 'area';
    const lat = url.searchParams.get('lat') ?? '50';
    const lon = url.searchParams.get('lon') ?? '10';
    const dist = url.searchParams.get('dist') ?? '250';

    const path = adsbPath(endpoint as AdsbEndpoint, lat, lon, dist);
    const cached = adsbCache.get(path);
    if (cached && Date.now() - cached.ts < ADSB_TTL_MS) {
      send(res, 200, cached.body, 'public, max-age=30');
      return;
    }

    const result = await fetchAdsb(path);
    if (result.ok) {
      adsbCache.set(path, { ts: Date.now(), body: result.body });
      console.log(`[api/adsb] ${path} served by ${result.provider}`);
      send(res, 200, result.body, 'public, max-age=30');
      return;
    }

    console.warn(`[api/adsb] all providers failed: ${result.errors.join(' | ')}`);
    if (cached) {
      send(res, 200, cached.body, 'public, max-age=10');
      return;
    }
    send(res, 502, result.body);
  };

  return {
    name: 'osint-api-dev-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?')[0];
        if (path === '/api/cameras') {
          void handleCameras(res);
          return;
        }
        if (path === '/api/adsb') {
          void handleAdsb(req, res);
          return;
        }
        if (path === '/api/vessels') {
          void handleVessels(res);
          return;
        }
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), apiDevServer()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    include: ['leaflet', 'react-leaflet'],
    /**
     * MapLibre GL resolves its worker with `new URL('./maplibre-gl-worker.mjs',
     * import.meta.url)`. Prebundling rewrites that module into `.vite/deps/`,
     * where no such worker file exists — the worker 404s and every
     * worker-dependent feature (terrain, hillshade, vector tiles) silently
     * fails. It is pure ESM, so it does not need prebundling anyway.
     */
    exclude: ['maplibre-gl'],
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'maplibre': ['maplibre-gl'],
          'leaflet': ['leaflet', 'react-leaflet'],
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
  },
});
