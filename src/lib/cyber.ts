import type { CyberCategory, CyberThreat } from '@/types';

/**
 * Cyber-threat layer.
 *
 * ⚠️  This is a *model*, not a live sensor feed. There is no keyless public
 * API that streams per-attack geographic telemetry; every commercial "cyber
 * attack map" is itself an aggregation of honeypot, sinkhole and vendor
 * telemetry that is not openly licensed. What ships here is a curated
 * catalogue of documented campaigns and threat actors, anchored to the
 * country they predominantly target, with an event counter that advances on a
 * deterministic schedule so the layer reads as a live picture.
 *
 * The UI labels it "MODELED TELEMETRY" so it is never mistaken for observed
 * traffic. Swap `buildCyberThreats()` for a real feed if you license one.
 */

type Seed = {
  actor: string;
  category: CyberCategory;
  targetCountry: string;
  targetCode: string;
  city: string;
  lat: number;
  lon: number;
  severity: CyberThreat['severity'];
  vector: string;
  description: string;
};

const SEEDS: Seed[] = [
  { actor: 'LockBit 3.0', category: 'ransomware', targetCountry: 'United States', targetCode: 'US', city: 'Washington DC', lat: 38.9072, lon: -77.0369, severity: 'critical', vector: 'Ransomware-as-a-Service', description: 'Most prolific RaaS operation; affiliates target healthcare, finance and municipal networks.' },
  { actor: 'APT29 (Cozy Bear)', category: 'apt', targetCountry: 'United States', targetCode: 'US', city: 'Washington DC', lat: 38.8977, lon: -77.0365, severity: 'critical', vector: 'Spear-phishing / supply chain', description: 'State-linked espionage group; cloud identity abuse and SolarWinds-style supply-chain intrusion.' },
  { actor: 'Volt Typhoon', category: 'apt', targetCountry: 'United States', targetCode: 'US', city: 'Houston', lat: 29.7604, lon: -95.3698, severity: 'critical', vector: 'Living-off-the-land', description: 'Pre-positioning inside critical infrastructure OT/IT networks with native tooling.' },
  { actor: 'BlackCat / ALPHV', category: 'ransomware', targetCountry: 'United Kingdom', targetCode: 'GB', city: 'London', lat: 51.5074, lon: -0.1278, severity: 'high', vector: 'Ransomware', description: 'Rust-based ransomware with data-leak extortion against UK retail and legal sector.' },
  { actor: 'Cl0p', category: 'ransomware', targetCountry: 'United Kingdom', targetCode: 'GB', city: 'Manchester', lat: 53.4808, lon: -2.2426, severity: 'high', vector: 'MOVEit zero-day', description: 'Mass exploitation of managed file-transfer software for bulk extortion.' },
  { actor: 'Lazarus Group', category: 'apt', targetCountry: 'South Korea', targetCode: 'KR', city: 'Seoul', lat: 37.5665, lon: 126.9780, severity: 'critical', vector: 'Financial theft / crypto', description: 'DPRK-linked; crypto exchange theft and defence-sector espionage.' },
  { actor: 'Kimsuky', category: 'phishing', targetCountry: 'South Korea', targetCode: 'KR', city: 'Busan', lat: 35.1796, lon: 129.0756, severity: 'high', vector: 'Spear-phishing', description: 'Academic and think-tank credential harvesting on behalf of DPRK.' },
  { actor: 'Mirai variants', category: 'botnet', targetCountry: 'Brazil', targetCode: 'BR', city: 'São Paulo', lat: -23.5505, lon: -46.6333, severity: 'medium', vector: 'IoT botnet', description: 'IoT botnet recruiting routers and cameras for volumetric DDoS.' },
  { actor: 'Emotet', category: 'malware', targetCountry: 'Germany', targetCode: 'DE', city: 'Berlin', lat: 52.5200, lon: 13.4050, severity: 'high', vector: 'Loader / malspam', description: 'Modular loader distributing banking trojans and ransomware payloads.' },
  { actor: 'QakBot', category: 'botnet', targetCountry: 'Germany', targetCode: 'DE', city: 'Frankfurt', lat: 50.1109, lon: 8.6821, severity: 'high', vector: 'Banking trojan', description: 'Widely disrupted botnet; residual infrastructure still observed in Europe.' },
  { actor: 'APT28 (Fancy Bear)', category: 'apt', targetCountry: 'Ukraine', targetCode: 'UA', city: 'Kyiv', lat: 50.4501, lon: 30.5234, severity: 'critical', vector: 'Wiper / espionage', description: 'Grid and government targeting; destructive wipers alongside espionage.' },
  { actor: 'Sandworm', category: 'malware', targetCountry: 'Ukraine', targetCode: 'UA', city: 'Kharkiv', lat: 49.9935, lon: 36.2304, severity: 'critical', vector: 'ICS malware', description: 'Industroyer-family tooling aimed at electricity substations.' },
  { actor: 'APT41', category: 'apt', targetCountry: 'China', targetCode: 'CN', city: 'Beijing', lat: 39.9042, lon: 116.4074, severity: 'high', vector: 'Supply chain / espionage', description: 'Dual-purpose espionage and financially motivated intrusion.' },
  { actor: 'Mustang Panda', category: 'malware', targetCountry: 'Taiwan, China', targetCode: 'TW', city: 'Taipei', lat: 25.0330, lon: 121.5654, severity: 'high', vector: 'USB / plugX', description: 'PlugX deployments against government and NGO networks.' },
  { actor: 'RedEcho', category: 'apt', targetCountry: 'India', targetCode: 'IN', city: 'Mumbai', lat: 19.0760, lon: 72.8777, severity: 'high', vector: 'OT intrusion', description: 'Power-sector intrusions against Indian grid operators.' },
  { actor: 'SideWinder', category: 'apt', targetCountry: 'India', targetCode: 'IN', city: 'New Delhi', lat: 28.6139, lon: 77.2090, severity: 'medium', vector: 'Spear-phishing', description: 'Long-running campaign against military and diplomatic targets.' },
  { actor: 'Charming Kitten', category: 'phishing', targetCountry: 'Israel', targetCode: 'IL', city: 'Tel Aviv', lat: 32.0853, lon: 34.7818, severity: 'high', vector: 'Social engineering', description: 'Credential harvesting against academia, defence and diaspora.' },
  { actor: 'MuddyWater', category: 'apt', targetCountry: 'Saudi Arabia', targetCode: 'SA', city: 'Riyadh', lat: 24.7136, lon: 46.6753, severity: 'medium', vector: 'RAT / phishing', description: 'Telecom and government targeting across the Gulf.' },
  { actor: 'OilRig', category: 'malware', targetCountry: 'United Arab Emirates', targetCode: 'AE', city: 'Dubai', lat: 25.2048, lon: 55.2708, severity: 'medium', vector: 'DNS tunnelling', description: 'Energy-sector espionage with DNS-based C2 channels.' },
  { actor: 'Anonymous Sudan', category: 'ddos', targetCountry: 'Egypt', targetCode: 'EG', city: 'Cairo', lat: 30.0444, lon: 31.2357, severity: 'medium', vector: 'Volumetric DDoS', description: 'Ideologically branded DDoS against airports, banks and government portals.' },
  { actor: 'KillNet', category: 'ddos', targetCountry: 'Poland', targetCode: 'PL', city: 'Warsaw', lat: 52.2297, lon: 21.0122, severity: 'high', vector: 'Volumetric DDoS', description: 'Pro-Russian collective targeting NATO-member logistics and rail.' },
  { actor: 'NoName057(16)', category: 'ddos', targetCountry: 'Czechia', targetCode: 'CZ', city: 'Prague', lat: 50.0755, lon: 14.4378, severity: 'medium', vector: 'Volumetric DDoS', description: 'DDoSia-driven attacks on public administration portals.' },
  { actor: 'Lapsus$', category: 'phishing', targetCountry: 'Netherlands', targetCode: 'NL', city: 'Amsterdam', lat: 52.3676, lon: 4.9041, severity: 'medium', vector: 'Insider / SIM swap', description: 'Extortion via help-desk social engineering and telecom compromise.' },
  { actor: 'FIN7', category: 'malware', targetCountry: 'France', targetCode: 'FR', city: 'Paris', lat: 48.8566, lon: 2.3522, severity: 'medium', vector: 'Point-of-sale malware', description: 'Retail and hospitality payment-card theft.' },
  { actor: 'REvil successor ops', category: 'ransomware', targetCountry: 'Italy', targetCode: 'IT', city: 'Rome', lat: 41.9028, lon: 12.4964, severity: 'high', vector: 'Ransomware', description: 'Double-extortion against manufacturing and energy suppliers.' },
  { actor: 'Turla', category: 'apt', targetCountry: 'Sweden', targetCode: 'SE', city: 'Stockholm', lat: 59.3293, lon: 18.0686, severity: 'high', vector: 'Satellite C2', description: 'Espionage using hijacked satellite links for covert C2.' },
  { actor: 'Gamaredon', category: 'malware', targetCountry: 'Estonia', targetCode: 'EE', city: 'Tallinn', lat: 59.4370, lon: 24.7536, severity: 'medium', vector: 'USB / Outlook macros', description: 'High-tempo intrusion sets against Baltic government networks.' },
  { actor: 'Scattered Spider', category: 'ransomware', targetCountry: 'Australia', targetCode: 'AU', city: 'Sydney', lat: -33.8688, lon: 151.2093, severity: 'high', vector: 'Help-desk social engineering', description: 'Identity-first intrusion into telco and insurance estates.' },
  { actor: 'RedLine Stealer', category: 'malware', targetCountry: 'Nigeria', targetCode: 'NG', city: 'Lagos', lat: 6.5244, lon: 3.3792, severity: 'medium', vector: 'Infostealer', description: 'Credential and crypto-wallet exfiltration at scale.' },
  { actor: 'SilverTerrier', category: 'phishing', targetCountry: 'Ghana', targetCode: 'GH', city: 'Accra', lat: 5.6037, lon: -0.1870, severity: 'medium', vector: 'BEC phishing', description: 'Business email compromise against international supply chains.' },
  { actor: 'Predatory Sparrow', category: 'malware', targetCountry: 'Iran', targetCode: 'IR', city: 'Tehran', lat: 35.6892, lon: 51.3890, severity: 'high', vector: 'Destructive malware', description: 'Physically disruptive attacks against fuel-distribution systems.' },
  { actor: 'Earth Krahang', category: 'apt', targetCountry: 'Singapore', targetCode: 'SG', city: 'Singapore', lat: 1.3521, lon: 103.8198, severity: 'medium', vector: 'Web server exploitation', description: 'Government and maritime-sector espionage across Southeast Asia.' },
  { actor: 'OceanLotus', category: 'apt', targetCountry: 'Vietnam', targetCode: 'VN', city: 'Hanoi', lat: 21.0278, lon: 105.8342, severity: 'medium', vector: 'Watering-hole', description: 'Dissident and media targeting alongside industrial espionage.' },
  { actor: 'Turla / Snake', category: 'malware', targetCountry: 'Turkey', targetCode: 'TR', city: 'Ankara', lat: 39.9334, lon: 32.8597, severity: 'medium', vector: 'Kernel implant', description: 'Long-dwell kernel-mode implant on diplomatic networks.' },
  { actor: 'Dark Pink', category: 'phishing', targetCountry: 'Indonesia', targetCode: 'ID', city: 'Jakarta', lat: -6.2088, lon: 106.8456, severity: 'medium', vector: 'Spear-phishing', description: 'Government and military credential theft in ASEAN.' },
  { actor: 'IceFire', category: 'ransomware', targetCountry: 'Canada', targetCode: 'CA', city: 'Toronto', lat: 43.6532, lon: -79.3832, severity: 'medium', vector: 'Linux ransomware', description: 'Media and enterprise Linux estate encryption.' },
  { actor: 'Trigona', category: 'ransomware', targetCountry: 'Mexico', targetCode: 'MX', city: 'Mexico City', lat: 19.4326, lon: -99.1332, severity: 'medium', vector: 'Ransomware', description: 'Rapid encryption of Latin American enterprise networks.' },
  { actor: 'Blind Eagle', category: 'malware', targetCountry: 'Colombia', targetCode: 'CO', city: 'Bogotá', lat: 4.7110, lon: -74.0721, severity: 'medium', vector: 'RAT', description: 'Banking and government RAT campaigns across the Andean region.' },
  { actor: 'Medusa', category: 'ransomware', targetCountry: 'South Africa', targetCode: 'ZA', city: 'Johannesburg', lat: -26.2041, lon: 28.0473, severity: 'high', vector: 'Ransomware', description: 'Healthcare and logistics extortion with public leak site.' },
];

/** Stable id from the actor name so React keys never churn. */
function idFor(actor: string): string {
  return `cyber-${actor.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

/**
 * Event counts advance on a 15-minute bucket so the layer looks live while
 * staying deterministic between renders.
 */
export function buildCyberThreats(now = Date.now()): CyberThreat[] {
  const bucket = Math.floor(now / (15 * 60 * 1000));
  const iso = new Date(now).toISOString();
  return SEEDS.map((s, i) => {
    // Cheap deterministic hash of the bucket + index → stable pseudo-random.
    const h = Math.abs(Math.sin((bucket + i * 7.13) * 12.9898) * 43758.5453) % 1;
    const base = s.severity === 'critical' ? 900 : s.severity === 'high' ? 480 : 220;
    const events = Math.round(base + h * base * 1.6);
    return {
      id: idFor(s.actor),
      kind: 'cyber' as const,
      lat: s.lat,
      lon: s.lon,
      vector: s.vector,
      targetOrg: `${s.targetCountry} — ${s.city}`,
      targetCountry: s.targetCountry,
      targetCode: s.targetCode,
      category: s.category,
      severity: s.severity,
      events,
      lastSeen: iso,
      description: s.description,
    };
  });
}

export const CYBER_CATEGORY_LABEL: Record<CyberCategory, string> = {
  malware: 'MALWARE',
  ransomware: 'RANSOMWARE',
  ddos: 'DDoS',
  phishing: 'PHISHING',
  apt: 'APT',
  botnet: 'BOTNET',
};

export const CYBER_SEVERITY_COLOR: Record<CyberThreat['severity'], string> = {
  low: '#2dffaa',
  medium: '#fbbf24',
  high: '#ff8c42',
  critical: '#ff2d55',
};
