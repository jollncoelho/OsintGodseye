import type { Ship, CctvCamera, Aircraft } from '@/types';

// ---------- Military callsign / operator detection ----------
const MIL_CALLSIGNS = [
  'RCH', 'RRR', 'PAT', 'EVAC', 'REACH', 'ASCOT', 'KNIGHT', 'HAVOC',
  'VIVI', 'BART', 'JOSA', 'GAF', 'NAVY', 'ARMY', 'FORGE',
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
  { id: 'heli-6', kind: 'aircraft', icao24: 'ae0006', callsign: 'SAR1', originCountry: 'France', altitude: 1000, groundSpeed: 60, heading: 200, verticalRate: -1, onGround: false, military: false, helicopter: true, model: 'Leonardo AW139', manufacturer: 'Leonardo', operator: 'SNSM', registration: 'F-ZSAR', origin: 'CDG', destination: 'CDG', lat: 48.85, lon: 2.35, trail: [] },
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

// ---------- Curated camera fallback ----------
// Only used when both the /api/cameras aggregator and the direct browser
// fetch fail (e.g. fully offline). These are verified live TfL JamCam frames.
export const MOCK_CCTV: CctvCamera[] = [
  { id: 'tfl-JamCams_00001.07450', kind: 'cctv', name: 'Piccadilly Circus', location: 'London, United Kingdom', lat: 51.5096, lon: -0.13484, url: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.07450.jpg', type: 'TfL JamCam' },
  { id: 'tfl-JamCams_00001.06600', kind: 'cctv', name: 'Cromwell Rd / Earls Court Rd', location: 'London, United Kingdom', lat: 51.4946, lon: -0.1957, url: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.06600.jpg', type: 'TfL JamCam' },
  { id: 'tfl-JamCams_00001.08858', kind: 'cctv', name: 'Oxford St / Orchard St', location: 'London, United Kingdom', lat: 51.514, lon: -0.15409, url: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.08858.jpg', type: 'TfL JamCam' },
  { id: 'tfl-JamCams_00001.03675', kind: 'cctv', name: 'Blackheath Rd / Greenwich High Rd', location: 'London, United Kingdom', lat: 51.4742, lon: -0.02073, url: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.03675.jpg', type: 'TfL JamCam' },
  { id: 'tfl-JamCams_00001.09747', kind: 'cctv', name: 'Edgware Way / Broadfields Ave', location: 'London, United Kingdom', lat: 51.6216, lon: -0.27384, url: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.09747.jpg', type: 'TfL JamCam' },
  { id: 'tfl-JamCams_00001.03758', kind: 'cctv', name: 'A205 Tulse Hill / Thurlow Park Rd', location: 'London, United Kingdom', lat: 51.441, lon: -0.10633, url: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.03758.jpg', type: 'TfL JamCam' },
];
