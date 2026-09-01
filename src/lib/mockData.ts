import type { Ship, CctvCamera, Satellite, Aircraft } from '@/types';
import type { OrbitalElements } from '@/lib/orbital';
import { propagate } from '@/lib/orbital';

// ---------- Military callsign / operator detection ----------
const MIL_CALLSIGNS = [
  'RCH', 'RRR', 'PAT', 'EVAC', 'REACH', 'ASCOT', 'KNIGHT', 'HAVOC',
  'VIVI', 'BART', 'JOSA', 'GAF', 'AF', 'NAVY', 'ARMY', 'FORGE',
  'DRAGN', 'HUNT', 'TITAN', 'VIPER', 'BOLT', 'HOMER', 'SHELL',
];

const MIL_ICAO_PREFIXES = ['43', '44', '45', '46', '47', '48', '49', '4d', '4e'];

export function isMilitaryFlight(callsign: string, icao24: string, origin: string): boolean {
  const cs = callsign.toUpperCase();
  if (MIL_CALLSIGNS.some((p) => cs.startsWith(p))) return true;
  const hex = icao24.toLowerCase();
  if (MIL_ICAO_PREFIXES.some((p) => hex.startsWith(p))) return true;
  const milCountries = ['United States', 'Russia', 'China', 'United Kingdom', 'France', 'Germany', 'Israel', 'NATO'];
  return milCountries.includes(origin) && /MIL|AIR FORCE|NAVY|ARMY|F-|C-17|KC-|E-|P-8|A400M/i.test(cs);
}

// ---------- Mock helicopters (civil + military) ----------
export const MOCK_HELICOPTERS: Aircraft[] = [
  { id: 'heli-1', kind: 'aircraft', icao24: 'ae0001', callsign: 'LIFEFLIGHT1', originCountry: 'United States', altitude: 1200, groundSpeed: 45, heading: 90, verticalRate: 0, onGround: false, military: false, helicopter: true, model: 'Bell 412', manufacturer: 'Bell', operator: 'EMS', registration: 'N4012', origin: 'JFK', destination: 'JFK', lat: 40.65, lon: -73.78, trail: [] },
  { id: 'heli-2', kind: 'aircraft', icao24: 'ae0002', callsign: 'POLICE7', originCountry: 'United Kingdom', altitude: 800, groundSpeed: 50, heading: 180, verticalRate: 0, onGround: false, military: false, helicopter: true, model: 'Eurocopter EC135', manufacturer: 'Airbus', operator: 'MET POLICE', registration: 'G-PSOM', origin: 'LHR', destination: 'LHR', lat: 51.50, lon: -0.12, trail: [] },
  { id: 'heli-3', kind: 'aircraft', icao24: '4d0003', callsign: 'GUARD44', originCountry: 'United States', altitude: 2500, groundSpeed: 70, heading: 270, verticalRate: 2, onGround: false, military: true, helicopter: true, model: 'UH-60 Black Hawk', manufacturer: 'Sikorsky', operator: 'US Coast Guard', registration: '7003', origin: 'IAD', destination: 'IAD', lat: 38.9, lon: -77.0, trail: [] },
  { id: 'heli-4', kind: 'aircraft', icao24: '4d0004', callsign: 'RESCUE2', originCountry: 'Germany', altitude: 1500, groundSpeed: 55, heading: 45, verticalRate: 0, onGround: false, military: false, helicopter: true, model: 'Airbus H145', manufacturer: 'Airbus', operator: 'DRF Luftrettung', registration: 'D-HMED', origin: 'MUC', destination: 'MUC', lat: 48.14, lon: 11.58, trail: [] },
  { id: 'heli-5', kind: 'aircraft', icao24: '4d0005', callsign: 'CHOPPER9', originCountry: 'United States', altitude: 3000, groundSpeed: 75, heading: 315, verticalRate: 0, onGround: false, military: true, helicopter: true, model: 'AH-64 Apache', manufacturer: 'Boeing', operator: 'US Army', registration: '7005', origin: 'DFW', destination: 'DFW', lat: 32.9, lon: -97.0, trail: [] },
  { id: 'heli-6', kind: 'aircraft', icao24: 'ae0006', callsign: 'SAR1', originCountry: 'France', altitude: 1000, groundSpeed: 60, heading: 200, verticalRate: -1, onGround: false, military: false, helicopter: true, model: 'Leonardo AW139', manufacturer: 'Leonardo', operator: 'Société Nationale de Sauvetage', registration: 'F-ZSAR', origin: 'CDG', destination: 'CDG', lat: 48.85, lon: 2.35, trail: [] },
  { id: 'heli-7', kind: 'aircraft', icao24: '4d0007', callsign: 'BLADE31', originCountry: 'United States', altitude: 600, groundSpeed: 40, heading: 90, verticalRate: 0, onGround: false, military: false, helicopter: true, model: 'Sikorsky S-76', manufacturer: 'Sikorsky', operator: 'BLADE', registration: 'N76BL', origin: 'JFK', destination: 'JFK', lat: 40.72, lon: -74.01, trail: [] },
  { id: 'heli-8', kind: 'aircraft', icao24: '4d0008', callsign: 'CHC42', originCountry: 'Norway', altitude: 1800, groundSpeed: 65, heading: 0, verticalRate: 0, onGround: false, military: false, helicopter: true, model: 'Airbus H145', manufacturer: 'Airbus', operator: 'CHC Helicopter', registration: 'LN-OCH', origin: 'OSL', destination: 'OSL', lat: 59.91, lon: 10.75, trail: [] },
];

// ---------- Mock ships (naval + commercial) ----------
export const MOCK_SHIPS: Ship[] = [
  { id: 'ship-1', kind: 'ship', mmsi: '367000001', name: 'USS Gerald R. Ford (CVN-78)', type: 'Aircraft Carrier', naval: true, lat: 36.95, lon: -76.32, heading: 87, speed: 22, destination: 'Norfolk Naval Base', flag: 'US', trail: [] },
  { id: 'ship-2', kind: 'ship', mmsi: '470000002', name: 'HMS Queen Elizabeth (R08)', type: 'Aircraft Carrier', naval: true, lat: 50.78, lon: -1.28, heading: 145, speed: 18, destination: 'Portsmouth', flag: 'UK', trail: [] },
  { id: 'ship-3', kind: 'ship', mmsi: '273000003', name: 'Admiral Kuznetsov', type: 'Aircraft Carrier', naval: true, lat: 69.05, lon: 33.4, heading: 200, speed: 12, destination: 'Severomorsk', flag: 'RU', trail: [] },
  { id: 'ship-4', kind: 'ship', mmsi: '412000004', name: 'Liaoning (CV-16)', type: 'Aircraft Carrier', naval: true, lat: 30.6, lon: 122.1, heading: 90, speed: 25, destination: 'Qingdao', flag: 'CN', trail: [] },
  { id: 'ship-5', kind: 'ship', mmsi: '228000005', name: 'Charles de Gaulle (R91)', type: 'Aircraft Carrier', naval: true, lat: 43.1, lon: 5.3, heading: 270, speed: 20, destination: 'Toulon', flag: 'FR', trail: [] },
  { id: 'ship-6', kind: 'ship', mmsi: '636000006', name: 'USS Zumwalt (DDG-1000)', type: 'Destroyer', naval: true, lat: 32.7, lon: -117.6, heading: 315, speed: 28, destination: 'San Diego', flag: 'US', trail: [] },
  { id: 'ship-7', kind: 'ship', mmsi: '636000007', name: 'USS Arleigh Burke (DDG-51)', type: 'Destroyer', naval: true, lat: 25.4, lon: 55.3, heading: 180, speed: 30, destination: 'Persian Gulf', flag: 'US', trail: [] },
  { id: 'ship-8', kind: 'ship', mmsi: '636000008', name: 'HMS Diamond (D34)', type: 'Destroyer', naval: true, lat: 34.6, lon: 33.0, heading: 45, speed: 26, destination: 'Mediterranean', flag: 'UK', trail: [] },
  { id: 'ship-9', kind: 'ship', mmsi: '636000009', name: 'RFN Provence (D651)', type: 'Frigate', naval: true, lat: 43.4, lon: 6.9, heading: 90, speed: 24, destination: 'Mediterranean', flag: 'FR', trail: [] },
  { id: 'ship-10', kind: 'ship', mmsi: '413000010', name: 'PLAN Nanchang (101)', type: 'Destroyer', naval: true, lat: 22.3, lon: 114.1, heading: 135, speed: 30, destination: 'South China Sea', flag: 'CN', trail: [] },
  { id: 'ship-11', kind: 'ship', mmsi: '636000011', name: 'USS Georgia (SSGN-729)', type: 'Submarine', naval: true, lat: 32.1, lon: -80.0, heading: 90, speed: 15, destination: 'Kings Bay', flag: 'US', trail: [] },
  { id: 'ship-12', kind: 'ship', mmsi: '636000012', name: 'HMS Astute (S119)', type: 'Submarine', naval: true, lat: 56.0, lon: -5.0, heading: 200, speed: 18, destination: 'Faslane', flag: 'UK', trail: [] },
  // commercial
  { id: 'ship-13', kind: 'ship', mmsi: '538008431', name: 'Ever Given', type: 'Container Ship', naval: false, lat: 30.0, lon: 32.5, heading: 35, speed: 12, destination: 'Suez Canal', flag: 'PA', trail: [] },
  { id: 'ship-14', kind: 'ship', mmsi: '636015432', name: 'Maersk Alabama', type: 'Container Ship', naval: false, lat: 11.5, lon: 45.0, heading: 90, speed: 14, destination: 'Mombasa', flag: 'DK', trail: [] },
  { id: 'ship-15', kind: 'ship', mmsi: '311000222', name: 'Cosco Shipping', type: 'Bulk Carrier', naval: false, lat: 1.3, lon: 103.8, heading: 270, speed: 10, destination: 'Singapore', flag: 'LR', trail: [] },
  { id: 'ship-16', kind: 'ship', mmsi: '235000333', name: 'HMS Protector', type: 'Survey Vessel', naval: true, lat: -60.0, lon: -65.0, heading: 180, speed: 8, destination: 'Antarctic Patrol', flag: 'UK', trail: [] },
  { id: 'ship-17', kind: 'ship', mmsi: '636000017', name: 'USS Bataan (LHD-5)', type: 'Amphibious Assault', naval: true, lat: 36.5, lon: -6.3, heading: 90, speed: 21, destination: 'Mediterranean', flag: 'US', trail: [] },
  { id: 'ship-18', kind: 'ship', mmsi: '636000018', name: 'JS Izumo (DDH-183)', type: 'Helicopter Destroyer', naval: true, lat: 35.3, lon: 139.7, heading: 135, speed: 22, destination: 'Yokosuka', flag: 'JP', trail: [] },
];

// ---------- Mock CCTV cameras (public, snapshot-style) ----------
export const MOCK_CCTV: CctvCamera[] = [
  { id: 'cctv-1', kind: 'cctv', name: 'Times Square 4K', location: 'New York, USA', lat: 40.7589, lon: -73.9851, snapshot: 'https://images.unsplash.com/photo-1496442226666-8d9ee9b0a3c3?w=640', type: 'Traffic' },
  { id: 'cctv-2', kind: 'cctv', name: 'Tokyo Crossing', location: 'Shibuya, Japan', lat: 35.6595, lon: 139.7005, snapshot: 'https://images.unsplash.com/photo-1542051841857-5f90071a0ce6?w=640', type: 'Traffic' },
  { id: 'cctv-3', kind: 'cctv', name: 'London Eye', location: 'London, UK', lat: 51.5033, lon: -0.1196, snapshot: 'https://images.unsplash.com/photo-1486299267070-8063ce286789?w=640', type: 'Landmark' },
  { id: 'cctv-4', kind: 'cctv', name: 'Dubai Marina', location: 'Dubai, UAE', lat: 25.0772, lon: 55.1393, snapshot: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=640', type: 'Harbor' },
  { id: 'cctv-5', kind: 'cctv', name: 'Hong Kong Harbour', location: 'Hong Kong', lat: 22.2783, lon: 114.1747, snapshot: 'https://images.unsplash.com/photo-1536599018102-05f5fae29c5b?w=640', type: 'Harbor' },
  { id: 'cctv-6', kind: 'cctv', name: 'Sydney Harbour', location: 'Sydney, Australia', lat: -33.8568, lon: 151.2153, snapshot: 'https://images.unsplash.com/photo-1506973035872-a4ec9b43f43c?w=640', type: 'Harbor' },
  { id: 'cctv-7', kind: 'cctv', name: 'Moscow Red Square', location: 'Moscow, Russia', lat: 55.7539, lon: 37.6208, snapshot: 'https://images.unsplash.com/photo-1547448415-e9f5b28e570d?w=640', type: 'Landmark' },
  { id: 'cctv-8', kind: 'cctv', name: 'Singapore Strait', location: 'Singapore', lat: 1.2655, lon: 104.0, snapshot: 'https://images.unsplash.com/photo-1525629203673-4f8b85e5c9e8?w=640', type: 'Maritime' },
  { id: 'cctv-9', kind: 'cctv', name: 'Panama Canal', location: 'Panama', lat: 9.0809, lon: -79.6804, snapshot: 'https://images.unsplash.com/photo-1596436823999-30b7d7b8b8b8?w=640', type: 'Maritime' },
  { id: 'cctv-10', kind: 'cctv', name: 'San Francisco Bay', location: 'San Francisco, USA', lat: 37.8199, lon: -122.4783, snapshot: 'https://images.unsplash.com/photo-1501594907352-04c9d3d1e9c1?w=640', type: 'Harbor' },
];

// ---------- Satellite orbital elements (TLE-derived, simplified) ----------
export const SAT_ELEMENTS: OrbitalElements[] = [
  {
    name: 'ISS (Zarya)',
    category: 'ISS',
    inc: (51.64 * Math.PI) / 180,
    raan: (210.5 * Math.PI) / 180,
    ecc: 0.0006,
    a: 6778,
    argp: (180 * Math.PI) / 180,
    M0: (90 * Math.PI) / 180,
    epoch: Date.now(),
    period: 92.68,
  },
  {
    name: 'Starlink-30456',
    category: 'Starlink',
    inc: (53.05 * Math.PI) / 180,
    raan: (300.2 * Math.PI) / 180,
    ecc: 0.0001,
    a: 6921,
    argp: (45 * Math.PI) / 180,
    M0: (200 * Math.PI) / 180,
    epoch: Date.now(),
    period: 95.4,
  },
  {
    name: 'Starlink-30211',
    category: 'Starlink',
    inc: (53.02 * Math.PI) / 180,
    raan: (120.7 * Math.PI) / 180,
    ecc: 0.0002,
    a: 6925,
    argp: (90 * Math.PI) / 180,
    M0: (30 * Math.PI) / 180,
    epoch: Date.now(),
    period: 95.6,
  },
  {
    name: 'GPS IIF-12 (USA-251)',
    category: 'GPS',
    inc: (55.0 * Math.PI) / 180,
    raan: (60.3 * Math.PI) / 180,
    ecc: 0.01,
    a: 26560,
    argp: (270 * Math.PI) / 180,
    M0: (150 * Math.PI) / 180,
    epoch: Date.now(),
    period: 718,
  },
  {
    name: 'GPS III-4 (USA-309)',
    category: 'GPS',
    inc: (55.5 * Math.PI) / 180,
    raan: (180.1 * Math.PI) / 180,
    ecc: 0.009,
    a: 26560,
    argp: (10 * Math.PI) / 180,
    M0: (300 * Math.PI) / 180,
    epoch: Date.now(),
    period: 720,
  },
  {
    name: 'NOAA-21 (Weather)',
    category: 'Weather',
    inc: (98.7 * Math.PI) / 180,
    raan: (350.4 * Math.PI) / 180,
    ecc: 0.0015,
    a: 7228,
    argp: (60 * Math.PI) / 180,
    M0: (15 * Math.PI) / 180,
    epoch: Date.now(),
    period: 101.3,
  },
  {
    name: 'Sentinel-2A (Earth Obs)',
    category: 'Recon',
    inc: (98.62 * Math.PI) / 180,
    raan: (100.2 * Math.PI) / 180,
    ecc: 0.0001,
    a: 7167,
    argp: (90 * Math.PI) / 180,
    M0: (75 * Math.PI) / 180,
    epoch: Date.now(),
    period: 100.6,
  },
  {
    name: 'Hubble Space Telescope',
    category: 'Recon',
    inc: (28.47 * Math.PI) / 180,
    raan: (85.1 * Math.PI) / 180,
    ecc: 0.0003,
    a: 6920,
    argp: (120 * Math.PI) / 180,
    M0: (40 * Math.PI) / 180,
    epoch: Date.now(),
    period: 95.4,
  },
  {
    name: 'Tiangong Space Station',
    category: 'ISS',
    inc: (41.47 * Math.PI) / 180,
    raan: (40.0 * Math.PI) / 180,
    ecc: 0.0004,
    a: 6773,
    argp: (200 * Math.PI) / 180,
    M0: (110 * Math.PI) / 180,
    epoch: Date.now(),
    period: 92.2,
  },
];

export function buildSatellites(now: number): Satellite[] {
  return SAT_ELEMENTS.map((el, i) => {
    const pos = propagate(el, now);
    return {
      id: `sat-${i}`,
      kind: 'satellite' as const,
      name: el.name,
      category: el.category,
      lat: pos.lat,
      lon: pos.lon,
      altitude: pos.alt,
      velocity: pos.velocity,
      heading: pos.heading,
      trail: [],
    };
  });
}

export function buildSatellitesWithTrails(now: number, trailSteps = 30, stepMs = 60000): Satellite[] {
  return SAT_ELEMENTS.map((el, i) => {
    const pos = propagate(el, now);
    const trail: [number, number][] = [];
    for (let s = trailSteps; s >= 0; s--) {
      const t = now - s * stepMs;
      const p = propagate(el, t);
      trail.push([p.lat, p.lon]);
    }
    return {
      id: `sat-${i}`,
      kind: 'satellite' as const,
      name: el.name,
      category: el.category,
      lat: pos.lat,
      lon: pos.lon,
      altitude: pos.alt,
      velocity: pos.velocity,
      heading: pos.heading,
      trail,
    };
  });
}
