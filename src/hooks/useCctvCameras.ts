import { useCallback, useEffect, useState } from 'react';
import type { CctvCamera } from '@/types';

interface ProxyCamera {
  id: string;
  lat: number;
  lon: number;
  name: string;
  url: string;
  source: string;
  country: string;
}

interface CctvProxyResponse {
  total: number;
  cameras: ProxyCamera[];
  errors?: string[];
}

export function useCctvCameras(enabled: boolean) {
  const [cameras, setCameras] = useState<CctvCamera[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCameras = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/cctv', { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: CctvProxyResponse = await res.json();
      const parsed: CctvCamera[] = data.cameras.map((c) => ({
        id: c.id,
        kind: 'cctv' as const,
        name: c.name,
        location: c.country,
        lat: c.lat,
        lon: c.lon,
        url: `https://images.weserv.nl/?url=${encodeURIComponent(c.url)}`,
        type: c.source,
      }));
      setCameras(parsed);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'fetch failed';
      setError(msg);
      setCameras([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setCameras([]);
      return;
    }
    fetchCameras();
    const id = setInterval(fetchCameras, 60000);
    return () => clearInterval(id);
  }, [enabled, fetchCameras]);

  return { cameras, loading, error };
}
