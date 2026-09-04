import type { StrategicPoint } from '@/types';

export const STRATEGIC_POINTS: StrategicPoint[] = [
  // Nuclear power plants
  { id: 'nuc-1', name: 'Tihange NPP', category: 'nuclear', lat: 50.5167, lon: 5.2833, description: '3-reactor plant, 3,008 MW', status: 'Active' },
  { id: 'nuc-2', name: 'Doel NPP', category: 'nuclear', lat: 51.3317, lon: 4.2450, description: '4-reactor plant, 2,931 MW', status: 'Active' },
  { id: 'nuc-3', name: 'Zaporizhzhia NPP', category: 'nuclear', lat: 47.5089, lon: 34.5900, description: 'Largest NPP in Europe, 6 reactors', status: 'CONTESTED — Russian occupation' },
  { id: 'nuc-4', name: 'Chernobyl Exclusion Zone', category: 'nuclear', lat: 51.2763, lon: 30.2219, description: 'Site of 1986 disaster, Units 1-4', status: 'Decommissioned — Monitored' },
  { id: 'nuc-5', name: 'Fukushima Daiichi', category: 'nuclear', lat: 37.4215, lon: 141.0325, description: 'Site of 2011 disaster, 6 reactors', status: 'Decommissioning' },
  { id: 'nuc-6', name: 'Kursk NPP', category: 'nuclear', lat: 51.6650, lon: 36.7100, description: '4 RBMK reactors, 2,000 MW', status: 'Active — Near Ukraine border' },
  { id: 'nuc-7', name: 'Cattenom NPP', category: 'nuclear', lat: 49.4072, lon: 6.2533, description: '4-reactor plant, 5,200 MW', status: 'Active' },
  { id: 'nuc-8', name: 'Paks NPP', category: 'nuclear', lat: 46.5714, lon: 18.8556, description: '4 VVER reactors, 2,000 MW', status: 'Active' },
  { id: 'nuc-9', name: 'Kudankulam NPP', category: 'nuclear', lat: 8.2447, lon: 77.7100, description: 'Largest NPP in India, VVER-1000', status: 'Active' },
  { id: 'nuc-10', name: 'Yongbyon Nuclear Complex', category: 'nuclear', lat: 39.8000, lon: 125.7500, description: 'DPRK primary nuclear facility', status: 'Active — Monitored' },
  { id: 'nuc-11', name: 'Natanz Enrichment Site', category: 'nuclear', lat: 33.7222, lon: 51.7272, description: 'Iranian uranium enrichment facility', status: 'Active — Monitored' },
  { id: 'nuc-12', name: 'Bushehr NPP', category: 'nuclear', lat: 28.8294, lon: 50.8464, description: 'Iran\'s only nuclear power plant', status: 'Active' },

  // Military bases
  { id: 'base-1', name: 'Ramstein Air Base', category: 'military_base', lat: 49.4378, lon: 7.6003, description: 'USAF major hub, NATO operations', status: 'Active — NATO' },
  { id: 'base-2', name: 'Incirlik Air Base', category: 'military_base', lat: 37.0000, lon: 35.4333, description: 'USAF forward base, NATO southern flank', status: 'Active — NATO' },
  { id: 'base-3', name: 'Guantanamo Bay NSGB', category: 'military_base', lat: 19.9390, lon: -75.1480, description: 'US naval station, detention facility', status: 'Active — US' },
  { id: 'base-4', name: 'Diego Garcia', category: 'military_base', lat: -7.3147, lon: 72.4153, description: 'US-UK joint military base, Indian Ocean', status: 'Active — US/UK' },
  { id: 'base-5', name: 'Grafenwöhr Training Area', category: 'military_base', lat: 49.7000, lon: 11.9000, description: 'US Army training area, Bavaria', status: 'Active — US Army' },
  { id: 'base-6', name: 'Sevastopol Naval Base', category: 'military_base', lat: 44.6166, lon: 33.5253, description: 'Russian Black Sea Fleet HQ (annexed Crimea)', status: 'Active — Russia' },
  { id: 'base-7', name: 'Tartus Naval Base', category: 'military_base', lat: 34.8870, lon: 35.8867, description: 'Russian naval facility, Syria', status: 'Active — Russia' },
  { id: 'base-8', name: 'Djibouti — Camp Lemonnier', category: 'military_base', lat: 11.5470, lon: 43.1450, description: 'US AFRICOM base, counter-terror ops', status: 'Active — US' },
  { id: 'base-9', name: 'Gwadar Naval Base', category: 'military_base', lat: 25.1217, lon: 62.3258, description: 'Pakistan Navy, CPEC strategic port', status: 'Active — Pakistan' },
  { id: 'base-10', name: 'Yokosuka Naval Base', category: 'military_base', lat: 35.2886, lon: 139.6681, description: 'US 7th Fleet HQ, Japan', status: 'Active — US Navy' },

  // Conflict zones
  { id: 'conf-1', name: 'Eastern Ukraine — Donbas Front', category: 'conflict_zone', lat: 48.0159, lon: 37.8028, description: 'Active front line, Russian-Ukrainian war', status: 'ACTIVE CONFLICT' },
  { id: 'conf-2', name: 'Gaza Strip', category: 'conflict_zone', lat: 31.3547, lon: 34.3088, description: 'Israeli-Palestinian conflict zone', status: 'ACTIVE CONFLICT' },
  { id: 'conf-3', name: 'Sudan — Khartoum', category: 'conflict_zone', lat: 15.5007, lon: 32.5599, description: 'RSF-SAF civil war', status: 'ACTIVE CONFLICT' },
  { id: 'conf-4', name: 'Myanmar Civil War', category: 'conflict_zone', lat: 21.9162, lon: 95.9560, description: 'Junta vs. resistance forces', status: 'ACTIVE CONFLICT' },
  { id: 'conf-5', name: 'Yemen — Marib', category: 'conflict_zone', lat: 15.4625, lon: 45.3247, description: 'Houthi-Saudi coalition conflict', status: 'ACTIVE CONFLICT' },
  { id: 'conf-6', name: 'Sahel — Mali', category: 'conflict_zone', lat: 16.7666, lon: -3.0026, description: 'Jihadist insurgency, coup-affected region', status: 'ACTIVE CONFLICT' },
  { id: 'conf-7', name: 'South China Sea — Spratlys', category: 'conflict_zone', lat: 10.0000, lon: 114.0000, description: 'Territorial disputes, militarized reefs', status: 'TENSION — MONITORED' },
  { id: 'conf-8', name: 'Taiwan Strait', category: 'conflict_zone', lat: 24.0000, lon: 120.0000, description: 'PRC-Taiwan military tension zone', status: 'TENSION — MONITORED' },
  { id: 'conf-9', name: 'Syria — Idlib', category: 'conflict_zone', lat: 35.5600, lon: 36.5600, description: 'Last rebel-held enclave', status: 'ACTIVE CONFLICT' },
  { id: 'conf-10', name: 'Red Sea — Houthi Attacks', category: 'conflict_zone', lat: 14.0000, lon: 42.0000, description: 'Shipping attacks, maritime threat', status: 'ACTIVE CONFLICT' },
];
