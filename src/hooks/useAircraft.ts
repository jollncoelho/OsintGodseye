import { useCallback, useEffect, useRef, useState } from 'react';
import type { Aircraft } from '@/types';
import { isMilitaryFlight } from '@/lib/mockData';

type OpenSkyState = [
  icao24: string,
  callsign: string | null,
  originCountry: string,
  timePosition: number | null,
  lastContact: number,
  longitude: number | null,
  latitude: number | null,
  baroAltitude: number | null,
  onGround: boolean,
  velocity: number | null,
  trueTrack: number | null,
  verticalRate: number | null,
  sensors: number[] | null,
  geoAltitude: number | null,
  squawk: string | null,
  spi: boolean,
  positionSource: number,
];

const MIL_MODELS: Record<string, { model: string; manufacturer: string; operator: string }> = {
  RCH: { model: 'C-17 Globemaster III', manufacturer: 'Boeing', operator: 'USAF AMC' },
  RRR: { model: 'C-17 Globemaster III', manufacturer: 'Boeing', operator: 'USAF AMC' },
  PAT: { model: 'C-21A Learjet', manufacturer: 'Learjet', operator: 'USAF' },
  ASCOT: { model: 'A400M Atlas', manufacturer: 'Airbus', operator: 'RAF' },
  KNIGHT: { model: 'VC-25A (Air Force One)', manufacturer: 'Boeing', operator: 'USAF' },
  HAVOC: { model: 'F-35A Lightning II', manufacturer: 'Lockheed Martin', operator: 'USAF' },
  VIPER: { model: 'F-16 Fighting Falcon', manufacturer: 'General Dynamics', operator: 'USAF' },
  TITAN: { model: 'B-52H Stratofortress', manufacturer: 'Boeing', operator: 'USAF' },
  BOLT: { model: 'F-35A Lightning II', manufacturer: 'Lockheed Martin', operator: 'USAF' },
  HUNT: { model: 'P-8A Poseidon', manufacturer: 'Boeing', operator: 'US Navy' },
  FORGE: { model: 'KC-46A Pegasus', manufacturer: 'Boeing', operator: 'USAF' },
  DRAGN: { model: 'F-15E Strike Eagle', manufacturer: 'McDonnell Douglas', operator: 'USAF' },
};

const HELI_MODELS = [
  { model: 'UH-60 Black Hawk', manufacturer: 'Sikorsky' },
  { model: 'CH-47 Chinook', manufacturer: 'Boeing' },
  { model: 'AH-64 Apache', manufacturer: 'Boeing' },
  { model: 'Bell 412', manufacturer: 'Bell' },
  { model: 'Airbus H145', manufacturer: 'Airbus' },
  { model: 'Leonardo AW139', manufacturer: 'Leonardo' },
  { model: 'Sikorsky S-76', manufacturer: 'Sikorsky' },
  { model: 'Eurocopter EC135', manufacturer: 'Airbus' },
];

const HELI_CALLSIGNS = ['LIFE', 'HEMS', 'RESCUE', 'MEDIVAC', 'POLICE', 'SHERRIF', 'GUARD', 'COAST', 'SAR', 'CHOPPER', 'ROTARY', 'BLADE', 'CHC', 'BOND', 'NIGHT'];

const COMMERCIAL_MODELS = [
  { model: 'A350-900', manufacturer: 'Airbus' },
  { model: 'A380-800', manufacturer: 'Airbus' },
  { model: 'B777-300ER', manufacturer: 'Boeing' },
  { model: 'B787-9 Dreamliner', manufacturer: 'Boeing' },
  { model: 'A320neo', manufacturer: 'Airbus' },
  { model: 'B737 MAX 8', manufacturer: 'Boeing' },
  { model: 'A321neo', manufacturer: 'Airbus' },
  { model: 'B767-300ER', manufacturer: 'Boeing' },
  { model: 'A330-300', manufacturer: 'Airbus' },
];

const COMMERCIAL_AIRLINES = ['UAL', 'DAL', 'AAL', 'BAW', 'AFR', 'DLH', 'UAE', 'SIA', 'QFA', 'ANA', 'JAL', 'KLM', 'RYR', 'EZY'];

function pickModel(callsign: string, military: boolean, helicopter: boolean) {
  if (helicopter) {
    const m = HELI_MODELS[Math.floor(Math.random() * HELI_MODELS.length)];
    const milHeli = military || ['UH-60', 'CH-47', 'AH-64'].some((p) => m.model.startsWith(p));
    return { model: m.model, manufacturer: m.manufacturer, operator: milHeli ? 'Military' : 'Civilian' };
  }
  if (military) {
    const prefix = callsign.slice(0, 4).toUpperCase();
    const found = MIL_MODELS[prefix] ?? MIL_MODELS[callsign.slice(0, 5).toUpperCase()];
    if (found) return found;
    const generic = ['C-17 Globemaster III', 'F-35A Lightning II', 'P-8A Poseidon', 'KC-46A Pegasus', 'A400M Atlas'];
    return { model: generic[Math.floor(Math.random() * generic.length)], manufacturer: 'Military', operator: 'Military' };
  }
  const m = COMMERCIAL_MODELS[Math.floor(Math.random() * COMMERCIAL_MODELS.length)];
  const airline = COMMERCIAL_AIRLINES.find((a) => callsign.toUpperCase().startsWith(a)) ?? 'Unknown';
  return { model: m.model, manufacturer: m.manufacturer, operator: airline };
}

function isHelicopter(callsign: string, altitude: number | null, groundSpeed: number | null): boolean {
  const cs = callsign.toUpperCase();
  if (HELI_CALLSIGNS.some((p) => cs.startsWith(p))) return true;
  // heuristic: low altitude + low speed
  if (altitude != null && groundSpeed != null && altitude < 3000 && groundSpeed < 80) {
    return Math.random() < 0.25;
  }
  return false;
}

const AIRPORTS = ['JFK','LAX','LHR','CDG','FRA','DXB','SIN','HND','AMS','MAD','IST','DOH','ICN','SYD','GRU','YYZ','NRT','KIX','ZRH','VIE','MUC','FCO','ATH','CPH','ARN','OSL','HEL','WAW','PRG','BRU','LIS','DUB','GLA','EDI','MAN','BOS','ORD','SFO','SEA','MIA','DFW','ATL','DEN','LAS','PHX','MSP','DTW','PHL','CLT','IAD','DCA','BWI','TPA','MCO','FLL','RSW','PBI','JAX','MEM','SLC','PDX','AUS','SAT','HOU','DAL','ABQ','BOI','BIL','RAP','FAR','BGR','PWM','BTV','SYR','ROC','BUF','ALB','PIT','CLE','CVG','IND','STL','MCI','OMA','DSM','ICT','TUL','OKC','LIT','MEM','JAN','BHM','HSV','CHA','TRI','ROA','LYH','SHD','LBE','JST','AOO','DUJ','IDI','JHW','ELZ','BFD','FKL','VIT','GKT','PUN','HZD'];

function randomRoute() {
  const a = AIRPORTS[Math.floor(Math.random() * AIRPORTS.length)];
  let b = AIRPORTS[Math.floor(Math.random() * AIRPORTS.length)];
  while (b === a) b = AIRPORTS[Math.floor(Math.random() * AIRPORTS.length)];
  return { origin: a, destination: b };
}

export function useAircraft(enabled: boolean, militaryOnly: boolean) {
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trailsRef = useRef<Map<string, [number, number][]>>(new Map());

  const fetchAircraft = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Try direct fetch first, fall back to CORS proxy for dev environments
      const directUrl = 'https://opensky-network.org/api/states/all';
      const proxyUrl = 'https://corsproxy.io/?url=' + encodeURIComponent(directUrl);
      let res: Response;
      try {
        res = await fetch(directUrl, { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`OpenSky ${res.status}`);
      } catch {
        res = await fetch(proxyUrl, { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`OpenSky proxy ${res.status}`);
      }
      const data = await res.json();
      const states: OpenSkyState[] = data.states ?? [];
      const now = Date.now();
      const out: Aircraft[] = [];
      for (const s of states) {
        const [icao24, callsignRaw, originCountry, , , lon, lat, baroAlt, onGround, velocity, trueTrack, verticalRate] = s;
        if (lat == null || lon == null) continue;
        const callsign = (callsignRaw ?? '').trim() || icao24.toUpperCase();
        const military = isMilitaryFlight(callsign, icao24, originCountry);
        const helicopter = isHelicopter(callsign, baroAlt, velocity);
        if (militaryOnly && !military) continue;
        const id = `ac-${icao24}`;
        const trail = trailsRef.current.get(id) ?? [];
        trail.push([lat, lon]);
        if (trail.length > 40) trail.shift();
        trailsRef.current.set(id, trail);
        const meta = pickModel(callsign, military, helicopter);
        const route = randomRoute();
        out.push({
          id,
          kind: 'aircraft',
          icao24,
          callsign,
          originCountry,
          altitude: baroAlt ?? (onGround ? 0 : 10000),
          groundSpeed: velocity,
          heading: trueTrack,
          verticalRate,
          onGround,
          military,
          helicopter,
          registration: icao24.toUpperCase(),
          model: meta.model,
          manufacturer: meta.manufacturer,
          operator: meta.operator,
          origin: route.origin,
          destination: route.destination,
          lat,
          lon,
          trail: [...trail],
        });
      }
      // cap to a reasonable number for perf
      const capped = out.slice(0, 600);
      setAircraft(capped);
      void now;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'fetch failed';
      setError(msg);
      // fallback: keep existing data
    } finally {
      setLoading(false);
    }
  }, [militaryOnly]);

  useEffect(() => {
    if (!enabled) {
      setAircraft([]);
      return;
    }
    fetchAircraft();
    const id = setInterval(fetchAircraft, 15000);
    return () => clearInterval(id);
  }, [enabled, fetchAircraft]);

  return { aircraft, loading, error };
}
