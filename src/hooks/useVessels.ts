import { useCallback, useEffect, useRef, useState } from 'react';
import type { Ship } from '@/types';
import { collectClientVessels, type VesselRecord } from '../../shared/vessels';

interface ApiResponse {
  total: number;
  vessels: VesselRecord[];
  errors?: string[];
}

function toShip(v: VesselRecord): Ship {
  return {
    id: `ais-${v.mmsi}`,
    kind: 'ship',
    mmsi: v.mmsi,
    name: v.name,
    type: v.type,
    naval: v.naval,
    heading: v.heading,
    speed: v.speed,
    destination: v.destination || '—',
    flag: v.callsign || '—',
    lat: v.lat,
    lon: v.lon,
    trail: [],
  };
}

/**
 * Live AIS vessel layer.
 *
 * Resolution order mirrors the camera layer:
 *   1. `/api/vessels` — server aggregator (dev middleware + Vercel).
 *   2. direct browser fetch — Digitraffic sends `Access-Control-Allow-Origin: *`,
 *      so this works on plain static hosting too.
 * An empty result means the caller keeps its curated fallback set.
 *
 * Positions are re-polled once a minute, matching the upstream update cadence.
 */
export function useVessels(enabled: boolean) {
  const [vessels, setVessels] = useState<Ship[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    try {
      try {
        const res = await fetch('/api/vessels', { headers: { Accept: 'application/json' } });
        if (res.ok) {
          const data: ApiResponse = await res.json();
          if (data.vessels?.length) {
            setVessels(data.vessels.map(toShip));
            setSource('server');
            setError(data.errors?.length ? data.errors[0] : null);
            return;
          }
        }
      } catch {
        /* fall through to the browser path */
      }

      const local = await collectClientVessels();
      if (local.vessels.length) {
        setVessels(local.vessels.map(toShip));
        setSource('browser');
        setError(local.errors.length ? local.errors[0] : null);
        return;
      }

      setVessels([]);
      setSource(null);
      setError('AIS feed unreachable');
    } catch (e) {
      setVessels([]);
      setError(e instanceof Error ? e.message : 'vessel fetch failed');
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setVessels([]);
      setSource(null);
      setError(null);
      return;
    }
    void load();
    const id = setInterval(() => void load(), 60_000);
    return () => clearInterval(id);
  }, [enabled, load]);

  return { vessels, loading, error, source, refresh: load };
}
