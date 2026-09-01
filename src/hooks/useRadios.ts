import { useCallback, useEffect, useState } from 'react';
import type { RadioStation } from '@/types';

type ApiStation = {
  stationuuid: string;
  name: string;
  url: string;
  favicon: string;
  tags: string;
  country: string;
  bitrate: number;
  geo_lat: number;
  geo_long: number;
};

export function useRadios(enabled: boolean) {
  const [radios, setRadios] = useState<RadioStation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRadios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('https://de1.api.radio-browser.info/json/stations/topclick/120', {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`Radio ${res.status}`);
      const data: ApiStation[] = await res.json();
      const out: RadioStation[] = data
        .filter((s) => s.geo_lat != null && s.geo_long != null && s.url)
        .map((s) => ({
          id: `radio-${s.stationuuid}`,
          kind: 'radio',
          lat: s.geo_lat,
          lon: s.geo_long,
          name: s.name,
          country: s.country,
          url: s.url,
          favicon: s.favicon,
          tags: s.tags,
          bitrate: s.bitrate,
        }));
      setRadios(out);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'fetch failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setRadios([]);
      return;
    }
    fetchRadios();
  }, [enabled, fetchRadios]);

  return { radios, loading, error };
}
