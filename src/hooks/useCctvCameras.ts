import { useCallback, useEffect, useRef, useState } from 'react';
import type { CctvCamera } from '@/types';
import { collectClientCameras, type CameraRecord } from '../../shared/cameras';

interface ApiResponse {
  total: number;
  cameras: CameraRecord[];
  errors?: string[];
  sources?: { key: string; count: number }[];
}

function toCctv(c: CameraRecord): CctvCamera {
  const place = c.city ? `${c.city}, ${c.country}` : c.country;
  return {
    id: c.id,
    kind: 'cctv',
    name: c.name,
    location: place,
    lat: c.lat,
    lon: c.lon,
    url: c.url,
    streamUrl: c.streamUrl,
    type: c.source,
  };
}

/**
 * Public camera layer.
 *
 * Resolution order:
 *   1. `/api/cameras`  — full multi-provider catalog (dev middleware + Vercel).
 *   2. direct browser fetch of the CORS-friendly providers (static hosting).
 * A failure at every level yields an empty list; the UI then falls back to the
 * curated MOCK_CCTV set so the layer is never silently blank.
 */
export function useCctvCameras(enabled: boolean) {
  const [cameras, setCameras] = useState<CctvCamera[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    try {
      // 1. Server aggregator
      try {
        const res = await fetch('/api/cameras', { headers: { Accept: 'application/json' } });
        if (res.ok) {
          const data: ApiResponse = await res.json();
          if (data.cameras?.length) {
            setCameras(data.cameras.map(toCctv));
            setSource('server');
            setError(data.errors?.length ? `${data.errors.length} provider(s) degraded` : null);
            return;
          }
        }
      } catch {
        /* fall through to the browser path */
      }

      // 2. Direct browser fetch (CORS-friendly providers only)
      const local = await collectClientCameras();
      if (local.cameras.length) {
        setCameras(local.cameras.map(toCctv));
        setSource('browser');
        setError(local.errors.length ? `${local.errors.length} provider(s) unreachable` : null);
        return;
      }

      setCameras([]);
      setSource(null);
      setError('No camera provider reachable');
    } catch (e) {
      setCameras([]);
      setError(e instanceof Error ? e.message : 'camera fetch failed');
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setCameras([]);
      setSource(null);
      setError(null);
      return;
    }
    void load();
    const id = setInterval(() => void load(), 120_000);
    return () => clearInterval(id);
  }, [enabled, load]);

  return { cameras, loading, error, source, refresh: load };
}
