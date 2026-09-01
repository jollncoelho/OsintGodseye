import { useCallback } from 'react';
import type { TerritoryIntel } from '@/types';

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  municipality?: string;
  county?: string;
  state?: string;
  region?: string;
  country?: string;
  country_code?: string;
};

type NominatimResponse = {
  display_name?: string;
  address?: NominatimAddress;
  namedetails?: Record<string, string>;
  lat?: string;
  lon?: string;
  timezone?: string;
};

type WikiSummary = {
  thumbnail?: { source: string; width: number; height: number };
  originalimage?: { source: string };
  extract?: string;
  content_urls?: { desktop?: { page?: string } };
  title?: string;
};

type OpenMeteoResponse = {
  current_weather?: {
    temperature: number;
    windspeed: number;
    weathercode: number;
    is_day: number;
  };
  elevation?: number;
  timezone?: string;
};

const WEATHER_CODES: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Rime fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
  61: 'Slight rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Freezing rain', 67: 'Freezing rain',
  71: 'Slight snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Rain showers', 81: 'Rain showers', 82: 'Violent rain showers',
  85: 'Snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm + hail', 99: 'Severe thunderstorm',
};

export function weatherDescription(code: number): string {
  return WEATHER_CODES[code] ?? 'Unknown';
}

export function useTerritoryIntel() {
  const fetchTerritory = useCallback(async (lat: number, lon: number, zoom: number = 10): Promise<TerritoryIntel> => {
    const id = `territory-${lat.toFixed(4)}-${lon.toFixed(4)}`;
    const base: TerritoryIntel = {
      id,
      kind: 'territory',
      lat,
      lon,
      displayName: 'Unknown Location',
      country: 'Unknown',
      countryCode: '??',
    };

    // High-zoom clicks get a satellite snapshot centered on the exact point
    const useSatelliteSnapshot = zoom >= 12;
    if (useSatelliteSnapshot) {
      const snapZoom = Math.min(Math.max(zoom, 14), 18);
      base.primaryImage = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${lon - 0.01}%2C${lat - 0.006}%2C${lon + 0.01}%2C${lat + 0.006}&size=400%2C240&format=jpg&f=image`;
      base.imageSource = 'satellite';
    }

    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=fr,pt,en`,
        { headers: { Accept: 'application/json', 'User-Agent': 'GodsEyeOSINT/1.0' } },
      );
      if (geoRes.ok) {
        const geo: NominatimResponse = await geoRes.json();
        const addr = geo.address ?? {};
        const city = addr.city ?? addr.town ?? addr.village ?? addr.hamlet ?? addr.municipality ?? undefined;
        const region = addr.state ?? addr.region ?? addr.county ?? undefined;
        const country = addr.country ?? 'Unknown';
        const countryCode = (addr.country_code ?? '??').toUpperCase();
        const displayName = [city, region, country].filter(Boolean).join(', ') || geo.display_name || 'Unknown Location';

        base.displayName = displayName;
        base.city = city;
        base.region = region;
        base.country = country;
        base.countryCode = countryCode;
        base.timezone = geo.timezone;

        // Wikipedia: try French first, then English fallback
        const searchName = city ?? region ?? country;
        if (searchName && searchName !== 'Unknown') {
          const wikiName = encodeURIComponent(searchName);
          for (const host of ['fr.wikipedia.org', 'en.wikipedia.org']) {
            try {
              const wikiRes = await fetch(`https://${host}/api/rest_v1/page/summary/${wikiName}`, {
                headers: { Accept: 'application/json' },
              });
              if (wikiRes.ok) {
                const wiki: WikiSummary = await wikiRes.json();
                if (wiki.extract || wiki.thumbnail) {
                  base.wikiImage = wiki.originalimage?.source ?? wiki.thumbnail?.source ?? undefined;
                  base.wikiSummary = wiki.extract ?? undefined;
                  base.wikiUrl = wiki.content_urls?.desktop?.page ?? undefined;
                  // Only use wiki image as primary if we don't have a satellite snapshot
                  if (!base.primaryImage) {
                    base.primaryImage = base.wikiImage;
                    base.imageSource = 'wikipedia';
                  }
                  break;
                }
              }
            } catch {
              // try next host
            }
          }
        }
      }
    } catch {
      // keep base data
    }

    // Weather via Open-Meteo (always works, no key)
    try {
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`,
        { headers: { Accept: 'application/json' } },
      );
      if (weatherRes.ok) {
        const w: OpenMeteoResponse = await weatherRes.json();
        if (w.current_weather) {
          base.weather = {
            temperature: w.current_weather.temperature,
            windSpeed: w.current_weather.windspeed,
            weatherCode: w.current_weather.weathercode,
            isDay: w.current_weather.is_day === 1,
          };
        }
        if (w.elevation != null) base.elevation = w.elevation;
        if (w.timezone) base.timezone = w.timezone;
      }
    } catch {
      // weather optional
    }

    return base;
  }, []);

  return { fetchTerritory };
}
