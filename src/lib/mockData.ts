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

// ---------- CCTV cameras (public JPEG snapshot feeds) ----------
export const MOCK_CCTV: CctvCamera[] = [
  // --- North America ---
  { id: 'cam-01', kind: 'cctv', name: 'Times Square Crossroads', location: 'New York, USA', lat: 40.7589, lon: -73.9851, imgUrl: 'https://looknorth.phoenixwi.net/earthcam/timessquare.jpg', type: 'Traffic' },
  { id: 'cam-02', kind: 'cctv', name: 'NYC 5th Avenue', location: 'New York, USA', lat: 40.7549, lon: -73.9840, imgUrl: 'https://looknorth.phoenixwi.net/earthcam/5thave.jpg', type: 'Traffic' },
  { id: 'cam-03', kind: 'cctv', name: 'San Francisco Golden Gate', location: 'San Francisco, USA', lat: 37.8199, lon: -122.4783, imgUrl: 'https://www.goldengate.org/cam/gg-bridge.jpg', type: 'Landmark' },
  { id: 'cam-04', kind: 'cctv', name: 'Hollywood Blvd', location: 'Los Angeles, USA', lat: 34.1016, lon: -118.3387, imgUrl: 'https://looknorth.phoenixwi.net/earthcam/hollywood.jpg', type: 'Traffic' },
  { id: 'cam-05', kind: 'cctv', name: 'Las Vegas Strip', location: 'Las Vegas, USA', lat: 36.1147, lon: -115.1728, imgUrl: 'https://looknorth.phoenixwi.net/earthcam/lasvegas.jpg', type: 'Traffic' },
  { id: 'cam-06', kind: 'cctv', name: 'Chicago Navy Pier', location: 'Chicago, USA', lat: 41.8917, lon: -87.6086, imgUrl: 'https://looknorth.phoenixwi.net/earthcam/navypier.jpg', type: 'Landmark' },
  { id: 'cam-07', kind: 'cctv', name: 'Miami South Beach', location: 'Miami, USA', lat: 25.7907, lon: -80.1300, imgUrl: 'https://looknorth.phoenixwi.net/earthcam/miami.jpg', type: 'Beach' },
  { id: 'cam-08', kind: 'cctv', name: 'Toronto Harbourfront', location: 'Toronto, Canada', lat: 43.6404, lon: -79.3779, imgUrl: 'https://www.torontoharbourcam.com/harbour.jpg', type: 'Harbor' },
  // --- Europe ---
  { id: 'cam-09', kind: 'cctv', name: 'London Tower Bridge', location: 'London, UK', lat: 51.5033, lon: -0.1196, imgUrl: 'https://www.meteoalarmcam.eu/cam/london/0/current.jpg', type: 'Landmark' },
  { id: 'cam-10', kind: 'cctv', name: 'London Trafalgar Square', location: 'London, UK', lat: 51.5080, lon: -0.1281, imgUrl: 'https://www.meteoalarmcam.eu/cam/london/1/current.jpg', type: 'Traffic' },
  { id: 'cam-11', kind: 'cctv', name: 'Paris Eiffel Tower', location: 'Paris, France', lat: 48.8584, lon: 2.2945, imgUrl: 'https://www.meteoalarmcam.eu/cam/paris/0/current.jpg', type: 'Landmark' },
  { id: 'cam-12', kind: 'cctv', name: 'Paris Champs-Elysees', location: 'Paris, France', lat: 48.8698, lon: 2.3079, imgUrl: 'https://www.meteoalarmcam.eu/cam/paris/1/current.jpg', type: 'Traffic' },
  { id: 'cam-13', kind: 'cctv', name: 'Amsterdam Dam Square', location: 'Amsterdam, Netherlands', lat: 52.3728, lon: 4.8933, imgUrl: 'https://www.meteoalarmcam.eu/cam/amsterdam/0/current.jpg', type: 'Traffic' },
  { id: 'cam-14', kind: 'cctv', name: 'Amsterdam Canal Ring', location: 'Amsterdam, Netherlands', lat: 52.3667, lon: 4.9041, imgUrl: 'https://www.meteoalarmcam.eu/cam/amsterdam/1/current.jpg', type: 'Landmark' },
  { id: 'cam-15', kind: 'cctv', name: 'Berlin Brandenburg Gate', location: 'Berlin, Germany', lat: 52.5163, lon: 13.3777, imgUrl: 'https://www.meteoalarmcam.eu/cam/berlin/0/current.jpg', type: 'Landmark' },
  { id: 'cam-16', kind: 'cctv', name: 'Berlin Alexanderplatz', location: 'Berlin, Germany', lat: 52.5219, lon: 13.4132, imgUrl: 'https://www.meteoalarmcam.eu/cam/berlin/1/current.jpg', type: 'Traffic' },
  { id: 'cam-17', kind: 'cctv', name: 'Rome Colosseum', location: 'Rome, Italy', lat: 41.8902, lon: 12.4922, imgUrl: 'https://www.meteoalarmcam.eu/cam/rome/0/current.jpg', type: 'Landmark' },
  { id: 'cam-18', kind: 'cctv', name: 'Rome Trevi Fountain', location: 'Rome, Italy', lat: 41.9009, lon: 12.4833, imgUrl: 'https://www.meteoalarmcam.eu/cam/rome/1/current.jpg', type: 'Landmark' },
  { id: 'cam-19', kind: 'cctv', name: 'Madrid Puerta del Sol', location: 'Madrid, Spain', lat: 40.4168, lon: -3.7038, imgUrl: 'https://www.meteoalarmcam.eu/cam/madrid/0/current.jpg', type: 'Traffic' },
  { id: 'cam-20', kind: 'cctv', name: 'Barcelona Sagrada Familia', location: 'Barcelona, Spain', lat: 41.4036, lon: 2.1744, imgUrl: 'https://www.meteoalarmcam.eu/cam/barcelona/0/current.jpg', type: 'Landmark' },
  { id: 'cam-21', kind: 'cctv', name: 'Vienna St Stephens Cathedral', location: 'Vienna, Austria', lat: 48.2086, lon: 16.3725, imgUrl: 'https://www.meteoalarmcam.eu/cam/vienna/0/current.jpg', type: 'Landmark' },
  { id: 'cam-22', kind: 'cctv', name: 'Prague Old Town Square', location: 'Prague, Czechia', lat: 50.0875, lon: 14.4213, imgUrl: 'https://www.meteoalarmcam.eu/cam/prague/0/current.jpg', type: 'Landmark' },
  { id: 'cam-23', kind: 'cctv', name: 'Lisbon Praca do Comercio', location: 'Lisbon, Portugal', lat: 38.7075, lon: -9.1364, imgUrl: 'https://www.meteoalarmcam.eu/cam/lisbon/0/current.jpg', type: 'Traffic' },
  { id: 'cam-24', kind: 'cctv', name: 'Athens Acropolis', location: 'Athens, Greece', lat: 37.9715, lon: 23.7257, imgUrl: 'https://www.meteoalarmcam.eu/cam/athens/0/current.jpg', type: 'Landmark' },
  { id: 'cam-25', kind: 'cctv', name: 'Istanbul Hagia Sophia', location: 'Istanbul, Turkey', lat: 41.0086, lon: 28.9802, imgUrl: 'https://www.meteoalarmcam.eu/cam/istanbul/0/current.jpg', type: 'Landmark' },
  { id: 'cam-26', kind: 'cctv', name: 'Moscow Red Square', location: 'Moscow, Russia', lat: 55.7539, lon: 37.6208, imgUrl: 'https://www.meteoalarmcam.eu/cam/moscow/0/current.jpg', type: 'Landmark' },
  { id: 'cam-27', kind: 'cctv', name: 'Stockholm Gamla Stan', location: 'Stockholm, Sweden', lat: 59.3251, lon: 18.0711, imgUrl: 'https://www.meteoalarmcam.eu/cam/stockholm/0/current.jpg', type: 'Landmark' },
  { id: 'cam-28', kind: 'cctv', name: 'Oslo Opera House', location: 'Oslo, Norway', lat: 59.9139, lon: 10.7522, imgUrl: 'https://www.meteoalarmcam.eu/cam/oslo/0/current.jpg', type: 'Landmark' },
  { id: 'cam-29', kind: 'cctv', name: 'Edinburgh Royal Mile', location: 'Edinburgh, UK', lat: 55.9533, lon: -3.1883, imgUrl: 'https://www.meteoalarmcam.eu/cam/edinburgh/0/current.jpg', type: 'Traffic' },
  { id: 'cam-30', kind: 'cctv', name: 'Dublin OConnell Street', location: 'Dublin, Ireland', lat: 53.3498, lon: -6.2603, imgUrl: 'https://www.meteoalarmcam.eu/cam/dublin/0/current.jpg', type: 'Traffic' },
  // --- Asia & Pacific ---
  { id: 'cam-31', kind: 'cctv', name: 'Tokyo Shibuya Scramble', location: 'Tokyo, Japan', lat: 35.6595, lon: 139.7005, imgUrl: 'https://image.taxi.keio.co.jp/scramble.jpg', type: 'Traffic' },
  { id: 'cam-32', kind: 'cctv', name: 'Tokyo Shinjuku', location: 'Tokyo, Japan', lat: 35.6938, lon: 139.7034, imgUrl: 'https://image.taxi.keio.co.jp/shinjuku.jpg', type: 'Traffic' },
  { id: 'cam-33', kind: 'cctv', name: 'Hong Kong Harbour', location: 'Hong Kong', lat: 22.2783, lon: 114.1747, imgUrl: 'https://webcam.tv/snapshot/hk-harbour.jpg', type: 'Harbor' },
  { id: 'cam-34', kind: 'cctv', name: 'Singapore Marina Bay', location: 'Singapore', lat: 1.2834, lon: 103.8607, imgUrl: 'https://www.mpa.gov.sg/webcam/marinabay.jpg', type: 'Harbor' },
  { id: 'cam-35', kind: 'cctv', name: 'Seoul Gangnam', location: 'Seoul, South Korea', lat: 37.4979, lon: 127.0276, imgUrl: 'https://www.meteoalarmcam.eu/cam/seoul/0/current.jpg', type: 'Traffic' },
  { id: 'cam-36', kind: 'cctv', name: 'Sydney Opera House', location: 'Sydney, Australia', lat: -33.8568, lon: 151.2153, imgUrl: 'https://www.sydneyferries.info/cam/opera-house.jpg', type: 'Landmark' },
  { id: 'cam-37', kind: 'cctv', name: 'Auckland Harbour Bridge', location: 'Auckland, New Zealand', lat: -36.8485, lon: 174.7633, imgUrl: 'https://www.meteoalarmcam.eu/cam/auckland/0/current.jpg', type: 'Harbor' },
  // --- Middle East & Africa ---
  { id: 'cam-38', kind: 'cctv', name: 'Dubai Marina', location: 'Dubai, UAE', lat: 25.0772, lon: 55.1393, imgUrl: 'https://www.dubaicamera.com/cam/dubai-marina/0/current.jpg', type: 'Harbor' },
  { id: 'cam-39', kind: 'cctv', name: 'Cape Town Table Mountain', location: 'Cape Town, South Africa', lat: -33.9249, lon: 18.4241, imgUrl: 'https://www.meteoalarmcam.eu/cam/capetown/0/current.jpg', type: 'Landmark' },
  // --- Maritime ---
  { id: 'cam-40', kind: 'cctv', name: 'Panama Canal Miraflores Locks', location: 'Panama', lat: 9.0809, lon: -79.6804, imgUrl: 'https://pancanal.com/eng/multimedia/cam-miraflores.jpg', type: 'Maritime' },
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
