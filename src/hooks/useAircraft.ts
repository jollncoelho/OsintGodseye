import { useCallback, useEffect, useRef, useState } from 'react';
import type { Aircraft } from '@/types';
import { isMilitaryFlight } from '@/lib/mockData';

// ADSB.lol API response shape (subset of fields we use)
interface AdsbAircraft {
  hex: string;
  flight: string | null;
  r: string | null; // registration
  t: string | null; // aircraft type
  alt_baro: number | 'ground' | null;
  alt_geom: number | null; // geometric altitude (fallback)
  gs: number | null; // ground speed (knots)
  track: number | null; // true track (heading)
  true_heading: number | null; // true heading (fallback)
  baro_rate: number | null; // vertical rate (ft/min)
  lat: number | null;
  lon: number | null;
  nav_qnh: number | null;
  nav_altitude_mcp: number | null;
  nav_heading: number | null;
  dbFlags: number | null;
  desc: string | null; // aircraft description
  own_op: string | null; // owner/operator
  country: string | null;
}

interface AdsbResponse {
  ac: AdsbAircraft[] | null;
  total: number;
}

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

const HELI_CALLSIGNS = ['LIFE', 'HEMS', 'RESCUE', 'MEDIVAC', 'POLICE', 'SHERRIF', 'GUARD', 'COAST', 'SAR', 'CHOPPER', 'ROTARY', 'BLADE', 'CHC', 'BOND', 'NIGHT'];

const HELI_TYPE_CODES = ['EC135', 'H145', 'AS365', 'AW139', 'S76', 'UH60', 'CH47', 'AH64', 'B412', 'EC35', 'H125', 'H160'];

const COMMERCIAL_AIRLINES = ['UAL', 'DAL', 'AAL', 'BAW', 'AFR', 'DLH', 'UAE', 'SIA', 'QFA', 'ANA', 'JAL', 'KLM', 'RYR', 'EZY'];

const AIRPORTS = ['JFK','LAX','LHR','CDG','FRA','DXB','SIN','HND','AMS','MAD','IST','DOH','ICN','SYD','GRU','YYZ','NRT','KIX','ZRH','VIE','MUC','FCO','ATH','CPH','ARN','OSL','HEL','WAW','PRG','BRU','LIS','DUB','GLA','EDI','MAN','BOS','ORD','SFO','SEA','MIA','DFW','ATL','DEN','LAS','PHX','MSP','DTW','PHL','CLT','IAD','DCA','BWI','TPA','MCO','FLL','RSW','PBI','JAX','MEM','SLC','PDX','AUS','SAT','HOU','DAL','ABQ','BOI','BIL','RAP','FAR','BGR','PWM','BTV','SYR','ROC','BUF','ALB','PIT','CLE','CVG','IND','STL','MCI','OMA','DSM','ICT','TUL','OKC','LIT','JAN','BHM','HSV','CHA','TRI','ROA','LYH','SHD','LBE','JST','AOO','DUJ','IDI','JHW','ELZ','BFD','FKL','VIT','GKT','PUN','HZD'];

function randomRoute() {
  const a = AIRPORTS[Math.floor(Math.random() * AIRPORTS.length)];
  let b = AIRPORTS[Math.floor(Math.random() * AIRPORTS.length)];
  while (b === a) b = AIRPORTS[Math.floor(Math.random() * AIRPORTS.length)];
  return { origin: a, destination: b };
}

function isHelicopter(callsign: string, altitude: number | null, groundSpeed: number | null, typeCode: string | null): boolean {
  const cs = callsign.toUpperCase();
  if (HELI_CALLSIGNS.some((p) => cs.startsWith(p))) return true;
  if (typeCode && HELI_TYPE_CODES.some((c) => typeCode.toUpperCase().includes(c))) return true;
  if (altitude != null && groundSpeed != null && altitude < 3000 && groundSpeed < 80) {
    return Math.random() < 0.25;
  }
  return false;
}

function pickModel(callsign: string, military: boolean, helicopter: boolean, typeCode: string | null, desc: string | null, ownOp: string | null) {
  if (helicopter) {
    const heliModels = [
      { model: 'UH-60 Black Hawk', manufacturer: 'Sikorsky' },
      { model: 'CH-47 Chinook', manufacturer: 'Boeing' },
      { model: 'AH-64 Apache', manufacturer: 'Boeing' },
      { model: 'Bell 412', manufacturer: 'Bell' },
      { model: 'Airbus H145', manufacturer: 'Airbus' },
      { model: 'Leonardo AW139', manufacturer: 'Leonardo' },
      { model: 'Sikorsky S-76', manufacturer: 'Sikorsky' },
      { model: 'Eurocopter EC135', manufacturer: 'Airbus' },
    ];
    const m = heliModels[Math.floor(Math.random() * heliModels.length)];
    const milHeli = military || ['UH-60', 'CH-47', 'AH-64'].some((p) => m.model.startsWith(p));
    return { model: m.model, manufacturer: m.manufacturer, operator: milHeli ? 'Military' : 'Civilian' };
  }
  if (military) {
    const prefix = callsign.slice(0, 4).toUpperCase();
    const found = MIL_MODELS[prefix] ?? MIL_MODELS[callsign.slice(0, 5).toUpperCase()];
    if (found) return found;
    if (desc) return { model: desc, manufacturer: 'Military', operator: ownOp ?? 'Military' };
    const generic = ['C-17 Globemaster III', 'F-35A Lightning II', 'P-8A Poseidon', 'KC-46A Pegasus', 'A400M Atlas'];
    return { model: generic[Math.floor(Math.random() * generic.length)], manufacturer: 'Military', operator: 'Military' };
  }
  if (desc) {
    const airline = COMMERCIAL_AIRLINES.find((a) => callsign.toUpperCase().startsWith(a)) ?? 'Unknown';
    return { model: desc, manufacturer: 'Commercial', operator: ownOp ?? airline };
  }
  const commercialModels = [
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
  const m = commercialModels[Math.floor(Math.random() * commercialModels.length)];
  const airline = COMMERCIAL_AIRLINES.find((a) => callsign.toUpperCase().startsWith(a)) ?? 'Unknown';
  return { model: m.model, manufacturer: m.manufacturer, operator: airline };
}

// dbFlags bit 0 = military aircraft per ADSB.lol database
function isMilFromDbFlags(dbFlags: number | null): boolean {
  if (dbFlags == null) return false;
  return (dbFlags & 1) !== 0;
}

function parseAdsbAircraft(ac: AdsbAircraft, militaryOnly: boolean, trailsRef: React.MutableRefObject<Map<string, [number, number][]>>): Aircraft | null {
  const { hex, flight, r, t, alt_baro, alt_geom, gs, track, true_heading, baro_rate, lat, lon, dbFlags, desc, own_op, country } = ac;
  if (lat == null || lon == null) return null;

  const callsign = (flight ?? '').trim() || hex.toUpperCase();
  const originCountry = country ?? 'Unknown';
  const military = isMilitaryFlight(callsign, hex, originCountry) || isMilFromDbFlags(dbFlags);
  const altitude = alt_baro === 'ground' ? 0 : (alt_baro ?? alt_geom);
  const heading = track ?? true_heading;
  const helicopter = isHelicopter(callsign, altitude, gs, t);

  if (militaryOnly && !military) return null;

  const id = `ac-${hex}`;
  const trail = trailsRef.current.get(id) ?? [];
  trail.push([lat, lon]);
  if (trail.length > 40) trail.shift();
  trailsRef.current.set(id, trail);

  const meta = pickModel(callsign, military, helicopter, t, desc, own_op);
  const route = randomRoute();

  return {
    id,
    kind: 'aircraft',
    icao24: hex,
    callsign,
    originCountry,
    altitude: altitude ?? (alt_baro === 'ground' ? 0 : 10000),
    groundSpeed: gs != null ? gs * 0.514444 : null, // knots → m/s
    heading: heading,
    verticalRate: baro_rate != null ? baro_rate * 0.00508 : null, // ft/min → m/s
    onGround: alt_baro === 'ground',
    military,
    helicopter,
    registration: r ?? hex.toUpperCase(),
    model: meta.model,
    manufacturer: meta.manufacturer,
    operator: meta.operator,
    origin: route.origin,
    destination: route.destination,
    lat,
    lon,
    trail: [...trail],
  };
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
      const out: Aircraft[] = [];
      const seenHex = new Set<string>();

      // 1. Fetch military flights via serverless proxy (avoids CORS)
      try {
        const milRes = await fetch('/api/adsb?endpoint=mil', { headers: { Accept: 'application/json' } });
        if (milRes.ok) {
          const milData: AdsbResponse = await milRes.json();
          const milList = milData.ac || [];
          for (const ac of milList) {
            const parsed = parseAdsbAircraft(ac, militaryOnly, trailsRef);
            if (parsed && !seenHex.has(parsed.icao24)) {
              seenHex.add(parsed.icao24);
              out.push(parsed);
            }
          }
        }
      } catch (err) {
        console.warn('ADS-B proxy /mil fetch failed:', err);
      }

      // 2. Fetch all flights in a radius around central Europe via proxy
      try {
        const allRes = await fetch('/api/adsb?lat=50&lon=10&dist=250', {
          headers: { Accept: 'application/json' },
        });
        if (allRes.ok) {
          const allData: AdsbResponse = await allRes.json();
          const allList = allData.ac || [];
          for (const ac of allList) {
            const parsed = parseAdsbAircraft(ac, militaryOnly, trailsRef);
            if (parsed && !seenHex.has(parsed.icao24)) {
              seenHex.add(parsed.icao24);
              out.push(parsed);
            }
          }
        }
      } catch (err) {
        console.warn('ADS-B proxy EU radius fetch failed:', err);
      }

      // 3. Fetch US-area flights for broader coverage via proxy
      try {
        const usRes = await fetch('/api/adsb?lat=40&lon=-90&dist=250', {
          headers: { Accept: 'application/json' },
        });
        if (usRes.ok) {
          const usData: AdsbResponse = await usRes.json();
          const usList = usData.ac || [];
          for (const ac of usList) {
            const parsed = parseAdsbAircraft(ac, militaryOnly, trailsRef);
            if (parsed && !seenHex.has(parsed.icao24)) {
              seenHex.add(parsed.icao24);
              out.push(parsed);
            }
          }
        }
      } catch (err) {
        console.warn('ADS-B proxy US radius fetch failed:', err);
      }

      if (out.length === 0) {
        throw new Error('ADSB.lol returned no aircraft — feed may be temporarily unavailable');
      }

      const capped = out.slice(0, 600);
      setAircraft(capped);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'fetch failed';
      setError(msg);
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
