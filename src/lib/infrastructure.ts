import type { InfrastructureCategory, InfrastructureSite } from '@/types';

/**
 * Critical-infrastructure layer — curated global reference sites.
 *
 * Anchors the physical backbone the other layers move over: hyperscale
 * datacenters, hydro and nuclear generation, major ports and airports, launch
 * sites, refineries and large-scale mining. Locations are approximate public
 * knowledge; capacities are nameplate figures for context, not live telemetry.
 */

type Seed = Omit<InfrastructureSite, 'kind' | 'id'>;

const SEEDS: Seed[] = [
  /* ---------------- Datacenters ---------------- */
  { name: 'AWS us-east-1 (N. Virginia)', category: 'datacenter', country: 'United States', operator: 'Amazon Web Services', capacity: 'Hyperscale campus', lat: 39.04, lon: -77.49, description: 'Largest AWS region by capacity; anchor of the US-East internet topology.' },
  { name: 'Microsoft Azure West Europe', category: 'datacenter', country: 'Netherlands', operator: 'Microsoft', capacity: 'Hyperscale region', lat: 52.37, lon: 4.90, description: 'Primary European Azure region serving EMEA workloads.' },
  { name: 'Google Council Bluffs', category: 'datacenter', country: 'United States', operator: 'Google', capacity: 'Hyperscale campus', lat: 41.26, lon: -95.86, description: 'One of Google\u2019s largest US campuses, wind-powered.' },
  { name: 'Meta Luleå', category: 'datacenter', country: 'Sweden', operator: 'Meta', capacity: 'Hyperscale campus', lat: 65.58, lon: 22.15, description: 'Arctic-circle campus using free-air cooling and hydro power.' },
  { name: 'Equinix LD5 (Slough)', category: 'datacenter', country: 'United Kingdom', operator: 'Equinix', capacity: 'Carrier-neutral colocation', lat: 51.51, lon: -0.59, description: 'Major London interconnection hub for financial traffic.' },
  { name: 'Alibaba Zhangbei', category: 'datacenter', country: 'China', operator: 'Alibaba Cloud', capacity: 'Hyperscale campus', lat: 41.16, lon: 114.71, description: 'Renewable-powered campus supporting Alibaba Cloud northern region.' },
  { name: 'Switch SUPERNAP Tahoe Reno', category: 'datacenter', country: 'United States', operator: 'Switch', capacity: 'Hyperscale campus', lat: 39.53, lon: -119.81, description: 'Very large multi-tenant campus in northern Nevada.' },
  { name: 'NTT Mumbai DC', category: 'datacenter', country: 'India', operator: 'NTT', capacity: 'Tier IV colocation', lat: 19.08, lon: 72.88, description: 'Financial-sector interconnection point for South Asia.' },
  { name: 'Scaleway DC5 (Paris)', category: 'datacenter', country: 'France', operator: 'Scaleway', capacity: 'Regional cloud', lat: 48.83, lon: 2.32, description: 'French sovereign cloud region.' },
  { name: 'Vantage Sydney', category: 'datacenter', country: 'Australia', operator: 'Vantage', capacity: 'Hyperscale campus', lat: -33.80, lon: 150.99, description: 'Primary hyperscale campus serving Australia.' },

  /* ---------------- Power generation ---------------- */
  { name: 'Three Gorges Dam', category: 'dam', country: 'China', operator: 'China Yangtze Power', capacity: '22,500 MW', lat: 30.82, lon: 111.00, description: 'World\u2019s largest installed generating capacity.' },
  { name: 'Itaipu Dam', category: 'dam', country: 'Brazil / Paraguay', operator: 'Itaipu Binacional', capacity: '14,000 MW', lat: -25.41, lon: -54.59, description: 'Binational hydro plant on the Paraná river.' },
  { name: 'Grand Coulee Dam', category: 'dam', country: 'United States', operator: 'US Bureau of Reclamation', capacity: '6,809 MW', lat: 47.96, lon: -118.98, description: 'Largest US hydroelectric producer.' },
  { name: 'Aswan High Dam', category: 'dam', country: 'Egypt', operator: 'Ministry of Water Resources', capacity: '2,100 MW', lat: 23.97, lon: 32.88, description: 'Controls Nile flooding and supplies much of Egypt\u2019s power.' },
  { name: 'Kashiwazaki-Kariwa NPP', category: 'power_plant', country: 'Japan', operator: 'TEPCO', capacity: '7,965 MW', lat: 37.43, lon: 138.60, description: 'Largest nuclear generating station by nameplate capacity.' },
  { name: 'Bruce Nuclear', category: 'power_plant', country: 'Canada', operator: 'Bruce Power', capacity: '6,430 MW', lat: 44.33, lon: -81.60, description: 'Largest operating nuclear station by reactor count.' },
  { name: 'Gravelines NPP', category: 'power_plant', country: 'France', operator: 'EDF', capacity: '5,460 MW', lat: 51.02, lon: 2.14, description: 'One of Western Europe\u2019s largest nuclear plants.' },
  { name: 'Noorsdok substation cluster', category: 'substation', country: 'South Africa', operator: 'Eskom', capacity: '765 kV backbone', lat: -28.10, lon: 25.10, description: 'High-voltage node on the southern African transmission backbone.' },
  { name: 'HVDC Viking Link', category: 'substation', country: 'United Kingdom', operator: 'National Grid / Energinet', capacity: '1,400 MW', lat: 52.94, lon: 0.05, description: 'Subsea interconnector between Britain and Denmark.' },
  { name: 'Gulf Coast refinery complex', category: 'refinery', country: 'United States', operator: 'Multiple', capacity: '~3.5 mb/d', lat: 29.75, lon: -93.30, description: 'Densest refining and petrochemical cluster in North America.' },
  { name: 'Jubail Industrial City', category: 'refinery', country: 'Saudi Arabia', operator: 'SABIC / Aramco', capacity: 'Industrial mega-site', lat: 27.00, lon: 49.66, description: 'One of the largest industrial complexes in the world.' },

  /* ---------------- Ports & logistics ---------------- */
  { name: 'Port of Shanghai', category: 'port', country: 'China', operator: 'SIPG', capacity: '~49M TEU/yr', lat: 30.62, lon: 122.06, description: 'Busiest container port in the world.' },
  { name: 'Port of Singapore', category: 'port', country: 'Singapore', operator: 'MPA / PSA', capacity: '~39M TEU/yr', lat: 1.26, lon: 103.84, description: 'World\u2019s largest transshipment hub.' },
  { name: 'Port of Rotterdam', category: 'port', country: 'Netherlands', operator: 'Port of Rotterdam Authority', capacity: '~14M TEU/yr', lat: 51.95, lon: 4.05, description: 'Europe\u2019s largest port and energy gateway.' },
  { name: 'Port of Los Angeles', category: 'port', country: 'United States', operator: 'POLA', capacity: '~9.9M TEU/yr', lat: 33.73, lon: -118.26, description: 'Primary transpacific gateway for North America.' },
  { name: 'Jebel Ali Port', category: 'port', country: 'United Arab Emirates', operator: 'DP World', capacity: '~14M TEU/yr', lat: 25.01, lon: 55.06, description: 'Largest port in the Middle East.' },
  { name: 'Port of Santos', category: 'port', country: 'Brazil', operator: 'APS', capacity: '~4.8M TEU/yr', lat: -23.96, lon: -46.30, description: 'Busiest container port in Latin America.' },
  { name: 'Suez Canal', category: 'port', country: 'Egypt', operator: 'Suez Canal Authority', capacity: '~12% of world trade', lat: 30.45, lon: 32.35, description: 'Critical chokepoint between Europe and Asia.' },
  { name: 'Panama Canal', category: 'port', country: 'Panama', operator: 'ACP', capacity: '~5% of world trade', lat: 9.08, lon: -79.68, description: 'Atlantic–Pacific shortcut; freshwater-lock limited by rainfall.' },
  { name: 'Strait of Malacca', category: 'port', country: 'Malaysia / Indonesia / Singapore', operator: '—', capacity: '~30% of global trade', lat: 2.50, lon: 101.50, description: 'Narrowest point of the busiest shipping lane in the world.' },

  /* ---------------- Airports & spaceports ---------------- */
  { name: 'Hartsfield–Jackson Atlanta', category: 'airport', country: 'United States', operator: 'ATL', capacity: 'Busiest by passengers', lat: 33.64, lon: -84.43, description: 'World\u2019s busiest airport by passenger throughput.' },
  { name: 'Dubai International', category: 'airport', country: 'United Arab Emirates', operator: 'DXB', capacity: 'Busiest intl. by passengers', lat: 25.25, lon: 55.36, description: 'Largest international passenger hub.' },
  { name: 'Heathrow', category: 'airport', country: 'United Kingdom', operator: 'LHR', capacity: '~79M pax/yr', lat: 51.47, lon: -0.45, description: 'Busiest airport in Europe by passengers.' },
  { name: 'Kempegowda International', category: 'airport', country: 'India', operator: 'BLR', capacity: '~37M pax/yr', lat: 13.20, lon: 77.71, description: 'Fast-growing South Asian hub.' },
  { name: 'Cape Canaveral SFS', category: 'spaceport', country: 'United States', operator: 'USSF / NASA', capacity: 'Launch complex cluster', lat: 28.49, lon: -80.57, description: 'Primary US orbital launch range.' },
  { name: 'Kennedy Space Center LC-39', category: 'spaceport', country: 'United States', operator: 'NASA', capacity: 'Heavy-lift pads', lat: 28.61, lon: -80.60, description: 'Apollo and Shuttle heritage; SLS and Starship adjacent.' },
  { name: 'Baikonur Cosmodrome', category: 'spaceport', country: 'Kazakhstan', operator: 'Roscosmos', capacity: 'Soyuz / Proton', lat: 45.96, lon: 63.31, description: 'Oldest and largest space launch facility.' },
  { name: 'Guiana Space Centre', category: 'spaceport', country: 'France (French Guiana)', operator: 'ESA / Arianespace', capacity: 'Ariane / Vega', lat: 5.24, lon: -52.77, description: 'Europe\u2019s principal launch site near the equator.' },
  { name: 'Wenchang Space Launch Site', category: 'spaceport', country: 'China', operator: 'CNSA', capacity: 'Long March 5/7/8', lat: 19.61, lon: 110.95, description: 'Low-latitude coastal launch site for heavy-lift missions.' },
  { name: 'Starbase (Boca Chica)', category: 'spaceport', country: 'United States', operator: 'SpaceX', capacity: 'Super Heavy / Starship', lat: 25.99, lon: -97.16, description: 'Private orbital launch and landing facility.' },

  /* ---------------- Mining ---------------- */
  { name: 'Escondida', category: 'mine', country: 'Chile', operator: 'BHP', capacity: '~1.1 Mt Cu/yr', lat: -24.27, lon: -69.07, description: 'Largest copper mine in the world.' },
  { name: 'Grasberg', category: 'mine', country: 'Indonesia', operator: 'Freeport-McMoRan', capacity: 'Cu / Au', lat: -4.05, lon: 137.11, description: 'One of the largest gold and copper deposits.' },
  { name: 'Bayan Obo', category: 'mine', country: 'China', operator: 'Baotou Steel', capacity: 'Rare-earth giant', lat: 41.77, lon: 109.97, description: 'Dominant global source of rare-earth elements.' },
  { name: 'Olympic Dam', category: 'mine', country: 'Australia', operator: 'BHP', capacity: 'Cu / U / Au', lat: -30.44, lon: 136.89, description: 'World\u2019s largest known uranium deposit.' },
  { name: 'Jwaneng', category: 'mine', country: 'Botswana', operator: 'Debswana', capacity: 'Diamond', lat: -24.52, lon: 24.70, description: 'Richest diamond mine by value.' },
  { name: 'Kiruna', category: 'mine', country: 'Sweden', operator: 'LKAB', capacity: 'Iron ore', lat: 67.85, lon: 20.23, description: 'One of Europe\u2019s largest underground iron-ore mines.' },
];

export const INFRASTRUCTURE_SITES: InfrastructureSite[] = SEEDS.map((s, i) => ({
  id: `infra-${i}`,
  kind: 'infrastructure',
  ...s,
}));

export const INFRA_CATEGORY_LABEL: Record<InfrastructureCategory, string> = {
  datacenter: 'DATACENTER',
  dam: 'HYDRO DAM',
  power_plant: 'POWER PLANT',
  substation: 'GRID NODE',
  port: 'PORT / CHOKEPOINT',
  airport: 'AIRPORT',
  spaceport: 'SPACEPORT',
  refinery: 'REFINERY',
  mine: 'MINE',
};

export const INFRA_CATEGORY_COLOR: Record<InfrastructureCategory, string> = {
  datacenter: '#22d3ee',
  dam: '#2dffaa',
  power_plant: '#fbbf24',
  substation: '#a855f7',
  port: '#38bdf8',
  airport: '#f472b6',
  spaceport: '#ff8c42',
  refinery: '#fb7185',
  mine: '#c084fc',
};
