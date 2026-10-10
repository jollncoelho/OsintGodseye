export type EntityKind =
  | 'aircraft'
  | 'ship'
  | 'satellite'
  | 'radio'
  | 'cctv'
  | 'cyber'
  | 'incident'
  | 'infrastructure';

export type BaseEntity = {
  id: string;
  kind: EntityKind;
  lat: number;
  lon: number;
};

export type Aircraft = BaseEntity & {
  kind: 'aircraft';
  icao24: string;
  callsign: string;
  originCountry: string;
  altitude: number | null; // meters
  groundSpeed: number | null; // m/s
  heading: number | null; // degrees
  verticalRate: number | null; // m/s
  onGround: boolean;
  military: boolean;
  helicopter: boolean;
  origin?: string;
  destination?: string;
  model?: string;
  manufacturer?: string;
  registration?: string;
  operator?: string;
  trail: [number, number][];
};

export type Ship = BaseEntity & {
  kind: 'ship';
  mmsi: string;
  name: string;
  type: string;
  naval: boolean;
  heading: number;
  speed: number; // knots
  destination: string;
  flag: string;
  trail: [number, number][];
};

/** Orbital constellation group — drives the four satellite layers. */
export type SatelliteGroup = 'comms' | 'military' | 'navigation' | 'earthobs';

export type Satellite = BaseEntity & {
  kind: 'satellite';
  name: string;
  category: string; // constellation / programme label, e.g. "Starlink"
  group: SatelliteGroup;
  norad?: string;
  operator?: string;
  purpose?: string;
  altitude: number; // km
  velocity: number; // km/s
  heading: number;
  trail: [number, number][];
};

export type RadioStation = BaseEntity & {
  kind: 'radio';
  name: string;
  country: string;
  url: string;
  favicon: string;
  tags: string;
  bitrate: number;
};

export type CctvCamera = BaseEntity & {
  kind: 'cctv';
  name: string;
  location: string;
  url: string;
  type: string;
  /** Optional HLS live stream when the provider publishes one. */
  streamUrl?: string;
};

export type CyberCategory =
  | 'malware'
  | 'ransomware'
  | 'ddos'
  | 'phishing'
  | 'apt'
  | 'botnet';

export type CyberThreat = BaseEntity & {
  kind: 'cyber';
  vector: string;
  targetOrg: string;
  targetCountry: string;
  targetCode: string;
  category: CyberCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  events: number;
  lastSeen: string;
  description: string;
};

export type IncidentCategory =
  | 'conflict'
  | 'protest'
  | 'disaster'
  | 'accident'
  | 'terror'
  | 'crime'
  | 'cyber'
  | 'other';

export type GlobalIncident = BaseEntity & {
  kind: 'incident';
  title: string;
  category: IncidentCategory;
  severity: number; // 1..5
  country: string;
  countryCode: string;
  time: string;
  source: string;
  url?: string;
};

export type InfrastructureCategory =
  | 'datacenter'
  | 'dam'
  | 'power_plant'
  | 'substation'
  | 'port'
  | 'airport'
  | 'spaceport'
  | 'refinery'
  | 'mine';

export type InfrastructureSite = BaseEntity & {
  kind: 'infrastructure';
  name: string;
  category: InfrastructureCategory;
  country: string;
  operator?: string;
  capacity?: string;
  description: string;
};

export type TerritoryIntel = {
  id: string;
  kind: 'territory';
  lat: number;
  lon: number;
  displayName: string;
  city?: string;
  region?: string;
  country: string;
  countryCode: string;
  timezone?: string;
  elevation?: number;
  weather?: {
    temperature: number;
    windSpeed: number;
    weatherCode: number;
    isDay: boolean;
  };
  primaryImage?: string;
  imageSource?: 'satellite' | 'wikipedia';
  wikiImage?: string;
  wikiSummary?: string;
  wikiUrl?: string;
};

export type LayerKey =
  | 'civAircraft'
  | 'milAircraft'
  | 'helicopters'
  | 'civShips'
  | 'milShips'
  | 'satComms'
  | 'satMilitary'
  | 'satNav'
  | 'satEarthObs'
  | 'cables'
  | 'cctv'
  | 'radios'
  | 'strategic'
  | 'infrastructure'
  | 'earthquakes'
  | 'incidents'
  | 'cyber'
  | 'terminator';

export type BaseLayerKey = 'satellite' | 'dark' | 'osm';
export type ShaderKey = 'standard' | 'nvg' | 'thermal' | 'crt';

export type SelectedTarget =
  | { kind: 'aircraft'; data: Aircraft }
  | { kind: 'ship'; data: Ship }
  | { kind: 'satellite'; data: Satellite }
  | { kind: 'radio'; data: RadioStation }
  | { kind: 'cctv'; data: CctvCamera }
  | { kind: 'cyber'; data: CyberThreat }
  | { kind: 'incident'; data: GlobalIncident }
  | { kind: 'infrastructure'; data: InfrastructureSite }
  | { kind: 'conflict'; data: StrategicPoint }
  | { kind: 'territory'; data: TerritoryIntel }
  | null;

export type LogEntry = {
  id: number;
  time: string;
  level: 'info' | 'warn' | 'alert';
  msg: string;
};

export type StrategicPoint = {
  id: string;
  name: string;
  category: 'nuclear' | 'military_base' | 'conflict_zone';
  lat: number;
  lon: number;
  description: string;
  status: string;
};

export type Earthquake = {
  id: string;
  lat: number;
  lon: number;
  magnitude: number;
  depth: number;
  place: string;
  time: string;
};

export type LiveFeed = {
  id: string;
  name: string;
  category: 'space' | 'news' | 'weather' | 'conflict';
  /** YouTube/other embeddable live stream id, when available. */
  youtubeId?: string;
  externalUrl: string;
  description: string;
  country?: string;
};
