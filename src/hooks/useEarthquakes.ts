import { useCallback, useEffect, useState } from 'react';
import type { Earthquake } from '@/types';

type UsgsFeature = {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    depth?: number;
  };
  geometry: {
    coordinates: [number, number, number]; // [lon, lat, depth]
  };
};

type UsgsResponse = {
  features: UsgsFeature[];
};

export function useEarthquakes(enabled: boolean) {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEarthquakes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson',
        { headers: { Accept: 'application/json' } },
      );
      if (!res.ok) throw new Error(`USGS ${res.status}`);
      const data: UsgsResponse = await res.json();
      const out: Earthquake[] = data.features.map((f) => ({
        id: f.id,
        lat: f.geometry.coordinates[1],
        lon: f.geometry.coordinates[0],
        magnitude: f.properties.mag,
        depth: f.geometry.coordinates[2],
        place: f.properties.place,
        time: new Date(f.properties.time).toISOString(),
      }));
      setEarthquakes(out);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'fetch failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setEarthquakes([]);
      return;
    }
    fetchEarthquakes();
    const id = setInterval(fetchEarthquakes, 300000); // refresh every 5 min
    return () => clearInterval(id);
  }, [enabled, fetchEarthquakes]);

  return { earthquakes, loading, error };
}
