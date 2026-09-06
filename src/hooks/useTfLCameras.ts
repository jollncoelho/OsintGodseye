import { useEffect, useState } from 'react';
import type { CctvCamera } from '@/types';

type TfLPlace = {
  id: string;
  lat: number;
  lon: number;
  commonName: string;
  additionalProperties?: { key: string; value: string }[];
};

export async function fetchTfLCameras(): Promise<CctvCamera[]> {
  try {
    const targetUrl = encodeURIComponent('https://api.tfl.gov.uk/Place/Type/JamCam');
    const proxyUrl = `https://api.allorigins.win/raw?url=${targetUrl}`;

    const res = await fetch(proxyUrl, {
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return [];
    const data: TfLPlace[] = await res.json();

    return (data || [])
      .map((cam): CctvCamera | null => {
        const rawImageUrl =
          cam.additionalProperties?.find((p) => p.key === 'imageUrl')?.value ?? '';
        if (!cam.lat || !cam.lon || !rawImageUrl) return null;
        return {
          id: `tfl-${cam.id}`,
          kind: 'cctv',
          name: cam.commonName || 'London JamCam',
          location: 'London, UK',
          lat: cam.lat,
          lon: cam.lon,
          imgUrl: `https://wsrv.nl/?url=${encodeURIComponent(rawImageUrl)}`,
          type: 'JamCam',
        };
      })
      .filter((c): c is CctvCamera => c !== null);
  } catch (err) {
    console.error('Erreur de chargement des flux TfL:', err);
    return [];
  }
}

export function useTfLCameras(enabled: boolean) {
  const [cameras, setCameras] = useState<CctvCamera[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setCameras([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchTfLCameras()
      .then((cams) => {
        if (!cancelled) {
          setCameras(cams);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { cameras, loading, error };
}
