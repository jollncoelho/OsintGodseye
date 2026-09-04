import { useEffect, useRef, useState } from 'react';
import {
  X, Plane, Ship, Satellite, Radio, Camera, Gauge, Compass, ArrowUp,
  Flag, Building2, Hash, Navigation, Radio as RadioIcon, Volume2,
  MapPin, Wind, Thermometer, Clock, Mountain, Copy, ZoomIn, Globe,
  Eye, ExternalLink, Activity, Signal,
} from 'lucide-react';
import type { SelectedTarget } from '@/types';
import { fmtAlt, fmtSpeed, fmtHeading, fmtClimb } from '@/lib/format';
import { weatherDescription } from '@/hooks/useTerritoryIntel';

type Props = {
  target: SelectedTarget;
  onClose: () => void;
};

export default function TargetPanel({ target, onClose }: Props) {
  const lat = target ? (target.data as { lat: number }).lat : 0;
  const lon = target ? (target.data as { lon: number }).lon : 0;

  useEffect(() => {
    if (!target) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [target, onClose]);

  if (!target) return null;

  return (
    <div className="slide-up absolute right-3 top-3 z-[800] flex h-[calc(100%-1.5rem)] w-80 flex-col overflow-hidden border border-cyan/40 bg-black/85 backdrop-blur-md no-select">
      <div className="bracket tl" />
      <div className="bracket tr" />
      <div className="bracket bl" />
      <div className="bracket br" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan/30 bg-cyan/10 px-3 py-2">
        <div className="flex items-center gap-2">
          <TargetIcon kind={target.kind} />
          <div className="text-[10px] font-bold tracking-[0.2em] text-cyan">TARGET ACQUIRED</div>
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center rounded p-2 text-slate-400 transition hover:bg-red-500/20 hover:text-red-400 cursor-pointer"
          title="Close (Esc)"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Signal integrity bars */}
      <SignalIntegrityBars kind={target.kind} />

      {/* Thermal / NVG camera preview */}
      <ThermalPreview kind={target.kind} lat={lat} lon={lon} target={target} />

      <div className="flex-1 overflow-y-auto">
        {target.kind === 'aircraft' && <AircraftDetails data={target.data} />}
        {target.kind === 'ship' && <ShipDetails data={target.data} />}
        {target.kind === 'satellite' && <SatDetails data={target.data} />}
        {target.kind === 'radio' && <RadioDetails data={target.data} />}
        {target.kind === 'cctv' && <CctvDetails data={target.data} />}
        {target.kind === 'territory' && <TerritoryDetails data={target.data} />}
      </div>

      {/* Street-Level View button — available for all targets with coordinates */}
      <StreetLevelButton lat={lat} lon={lon} />
    </div>
  );
}

function TargetIcon({ kind }: { kind: string }) {
  const cls = 'h-4 w-4 text-cyan';
  if (kind === 'aircraft') return <Plane className={cls} />;
  if (kind === 'ship') return <Ship className={cls} />;
  if (kind === 'satellite') return <Satellite className={cls} />;
  if (kind === 'radio') return <Radio className={cls} />;
  if (kind === 'territory') return <Globe className={cls} />;
  return <Camera className={cls} />;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-cyan/15 bg-black/40 px-3 py-2.5">
      <div className="mb-2 text-[9px] font-bold tracking-[0.2em] text-cyan/70">{title}</div>
      {children}
    </div>
  );
}

function Field({ icon, label, value, danger }: { icon: React.ReactNode; label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
        <span className="text-slate-600">{icon}</span>
        {label}
      </div>
      <div className={`text-[11px] font-semibold tabular-nums ${danger ? 'text-danger' : 'text-slate-200'}`}>
        {value}
      </div>
    </div>
  );
}

function AircraftDetails({ data }: { data: import('@/types').Aircraft }) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoErr, setPhotoErr] = useState(false);

  useEffect(() => {
    setPhoto(null);
    setPhotoErr(false);
    fetch(`https://api.planespotters.net/pub/photos/reg/${data.registration}`)
      .then((r) => r.json())
      .then((d) => {
        const p = d?.photos?.[0];
        if (p?.thumbnail?.src) setPhoto(p.thumbnail.src);
        else if (p?.link) setPhoto(p.link);
        else setPhotoErr(true);
      })
      .catch(() => setPhotoErr(true));
  }, [data.registration]);

  return (
    <>
      {/* Photo */}
      <div className="relative h-40 overflow-hidden border-b border-cyan/10 bg-hud-bg">
        {photo ? (
          <img src={photo} alt={data.model} className="h-full w-full object-cover" />
        ) : photoErr ? (
          <div className="flex h-full items-center justify-center">
            <Plane className={`h-12 w-12 ${data.military ? 'text-danger' : 'text-cyan'} opacity-40`} />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan/30 border-t-cyan" />
          </div>
        )}
        <div className="absolute left-2 top-2 rounded bg-hud-bg/80 px-2 py-0.5 text-[9px] font-bold tracking-wider text-cyan">
          {data.military ? 'MILITARY' : 'COMMERCIAL'}
        </div>
        <div className="scan-line" />
      </div>

      <Section title="IDENTIFICATION">
        <div className="mb-1 text-sm font-bold text-slate-100">{data.model ?? 'Unknown Aircraft'}</div>
        <div className="text-[10px] text-slate-500">{data.manufacturer}</div>
        <div className="mt-2">
          <Field icon={<Hash className="h-3 w-3" />} label="CALLSIGN" value={data.callsign} danger={data.military} />
          <Field icon={<Hash className="h-3 w-3" />} label="ICAO24" value={data.icao24.toUpperCase()} />
          <Field icon={<Flag className="h-3 w-3" />} label="REG" value={data.registration ?? '—'} />
          <Field icon={<Building2 className="h-3 w-3" />} label="OPERATOR" value={data.operator ?? '—'} />
        </div>
      </Section>

      <Section title="TELEMETRY">
        <Field icon={<Navigation className="h-3 w-3" />} label="ORIGIN" value={data.origin ?? '—'} />
        <Field icon={<Navigation className="h-3 w-3" />} label="DEST" value={data.destination ?? '—'} />
        <Field icon={<Gauge className="h-3 w-3" />} label="ALTITUDE" value={fmtAlt(data.altitude)} />
        <Field icon={<Gauge className="h-3 w-3" />} label="SPEED" value={fmtSpeed(data.groundSpeed)} />
        <Field icon={<Compass className="h-3 w-3" />} label="HEADING" value={fmtHeading(data.heading)} />
        <Field icon={<ArrowUp className="h-3 w-3" />} label="CLIMB" value={fmtClimb(data.verticalRate)} />
      </Section>

      <Section title="POSITION">
        <Field icon={<Compass className="h-3 w-3" />} label="LAT" value={data.lat.toFixed(4)} />
        <Field icon={<Compass className="h-3 w-3" />} label="LON" value={data.lon.toFixed(4)} />
        <Field icon={<Flag className="h-3 w-3" />} label="COUNTRY" value={data.originCountry} />
      </Section>

      {data.trail.length > 1 && <TrailMini trail={data.trail} />}
    </>
  );
}

function ShipDetails({ data }: { data: import('@/types').Ship }) {
  return (
    <>
      <div className="relative h-32 overflow-hidden border-b border-cyan/10 bg-hud-bg">
        <div className="flex h-full items-center justify-center">
          <Ship className={`h-14 w-14 ${data.naval ? 'text-danger' : 'text-cyan'} opacity-50`} />
        </div>
        <div className="absolute left-2 top-2 rounded bg-hud-bg/80 px-2 py-0.5 text-[9px] font-bold tracking-wider text-cyan">
          {data.naval ? 'NAVAL' : 'COMMERCIAL'}
        </div>
        <div className="scan-line" />
      </div>
      <Section title="IDENTIFICATION">
        <div className="mb-1 text-sm font-bold text-slate-100">{data.name}</div>
        <div className="text-[10px] text-slate-500">{data.type}</div>
        <div className="mt-2">
          <Field icon={<Hash className="h-3 w-3" />} label="MMSI" value={data.mmsi} />
          <Field icon={<Flag className="h-3 w-3" />} label="FLAG" value={data.flag} />
          <Field icon={<Navigation className="h-3 w-3" />} label="DEST" value={data.destination} />
        </div>
      </Section>
      <Section title="TELEMETRY">
        <Field icon={<Gauge className="h-3 w-3" />} label="SPEED" value={`${data.speed} kn`} />
        <Field icon={<Compass className="h-3 w-3" />} label="HEADING" value={`${data.heading}°`} />
        <Field icon={<Compass className="h-3 w-3" />} label="LAT" value={data.lat.toFixed(4)} />
        <Field icon={<Compass className="h-3 w-3" />} label="LON" value={data.lon.toFixed(4)} />
      </Section>
      {data.trail.length > 1 && <TrailMini trail={data.trail} />}
    </>
  );
}

function SatDetails({ data }: { data: import('@/types').Satellite }) {
  const color = data.category === 'ISS' ? 'text-amber' : data.category === 'GPS' ? 'text-green' : 'text-purple-400';
  return (
    <>
      <div className="relative h-32 overflow-hidden border-b border-cyan/10 bg-hud-bg">
        <div className="flex h-full items-center justify-center">
          <Satellite className={`h-14 w-14 ${color} opacity-60`} />
        </div>
        <div className="absolute left-2 top-2 rounded bg-hud-bg/80 px-2 py-0.5 text-[9px] font-bold tracking-wider text-amber">
          {data.category}
        </div>
        <div className="scan-line" />
      </div>
      <Section title="IDENTIFICATION">
        <div className="mb-1 text-sm font-bold text-slate-100">{data.name}</div>
        <div className="text-[10px] text-slate-500">Orbital Category: {data.category}</div>
      </Section>
      <Section title="ORBITAL DATA">
        <Field icon={<Gauge className="h-3 w-3" />} label="ALTITUDE" value={`${Math.round(data.altitude)} km`} />
        <Field icon={<Gauge className="h-3 w-3" />} label="VELOCITY" value={`${data.velocity.toFixed(2)} km/s`} />
        <Field icon={<Compass className="h-3 w-3" />} label="HEADING" value={`${Math.round(data.heading)}°`} />
        <Field icon={<Compass className="h-3 w-3" />} label="LAT" value={data.lat.toFixed(4)} />
        <Field icon={<Compass className="h-3 w-3" />} label="LON" value={data.lon.toFixed(4)} />
      </Section>
      {data.trail.length > 1 && <TrailMini trail={data.trail} />}
    </>
  );
}

function RadioDetails({ data }: { data: import('@/types').RadioStation }) {
  return (
    <>
      <div className="relative h-32 overflow-hidden border-b border-cyan/10 bg-hud-bg">
        <div className="flex h-full items-center justify-center gap-3">
          {data.favicon ? (
            <img src={data.favicon} alt="" className="h-16 w-16 rounded border border-cyan/20 object-cover" />
          ) : (
            <RadioIcon className="h-14 w-14 text-purple-400 opacity-60" />
          )}
        </div>
        <div className="absolute left-2 top-2 rounded bg-hud-bg/80 px-2 py-0.5 text-[9px] font-bold tracking-wider text-purple-400">
          LIVE RADIO
        </div>
      </div>
      <Section title="STATION">
        <div className="mb-1 text-sm font-bold text-slate-100">{data.name}</div>
        <div className="text-[10px] text-slate-500">{data.country}</div>
        <div className="mt-2">
          <Field icon={<Volume2 className="h-3 w-3" />} label="BITRATE" value={`${data.bitrate} kbps`} />
          <Field icon={<Compass className="h-3 w-3" />} label="LAT" value={data.lat.toFixed(4)} />
          <Field icon={<Compass className="h-3 w-3" />} label="LON" value={data.lon.toFixed(4)} />
        </div>
      </Section>
      <Section title="TAGS">
        <div className="text-[10px] text-slate-400">{data.tags || '—'}</div>
      </Section>
    </>
  );
}

function CctvDetails({ data }: { data: import('@/types').CctvCamera }) {
  return (
    <>
      <div className="relative h-44 overflow-hidden border-b border-cyan/10 bg-hud-bg">
        <img src={data.snapshot} alt={data.name} className="h-full w-full object-cover" />
        <div className="absolute left-2 top-2 rounded bg-hud-bg/80 px-2 py-0.5 text-[9px] font-bold tracking-wider text-green">
          {data.type}
        </div>
        <div className="absolute right-2 top-2 flex items-center gap-1 rounded bg-danger/80 px-2 py-0.5 text-[9px] font-bold tracking-wider text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-white blink" /> REC
        </div>
        <div className="scan-line" />
      </div>
      <Section title="CAMERA">
        <div className="mb-1 text-sm font-bold text-slate-100">{data.name}</div>
        <div className="text-[10px] text-slate-500">{data.location}</div>
        <div className="mt-2">
          <Field icon={<Compass className="h-3 w-3" />} label="LAT" value={data.lat.toFixed(4)} />
          <Field icon={<Compass className="h-3 w-3" />} label="LON" value={data.lon.toFixed(4)} />
        </div>
      </Section>
    </>
  );
}

function TerritoryDetails({ data }: { data: import('@/types').TerritoryIntel }) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(!data.wikiSummary && !data.weather);

  useEffect(() => {
    if (data.wikiSummary || data.weather) setLoading(false);
  }, [data]);

  const copyCoords = () => {
    const text = `${data.lat.toFixed(6)}, ${data.lon.toFixed(6)}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const flagUrl = `https://flagcdn.com/w40/${data.countryCode.toLowerCase()}.png`;

  return (
    <>
      {/* Photo */}
      <div className="relative h-40 overflow-hidden border-b border-cyan/10 bg-hud-bg">
        {data.primaryImage ? (
          <img src={data.primaryImage} alt={data.displayName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Globe className="h-12 w-12 text-cyan opacity-30" />
          </div>
        )}
        <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded bg-hud-bg/80 px-2 py-0.5 text-[9px] font-bold tracking-wider text-cyan">
          <MapPin className="h-3 w-3" /> TERRITORY INTEL
        </div>
        {/* Image source label */}
        {data.imageSource && (
          <div className="absolute bottom-2 left-2 rounded bg-hud-bg/85 px-2 py-0.5 text-[8px] font-semibold tracking-wider text-cyan/70">
            {data.imageSource === 'satellite' ? 'Photo satellite locale' : `Image repr\u00e9sentative : ${data.city ?? data.displayName} via Wikip\u00e9dia`}
          </div>
        )}
        <div className="scan-line" />
      </div>

      {/* Header: name + flag */}
      <div className="flex items-center gap-2.5 border-b border-cyan/10 px-3 py-2.5">
        {data.countryCode !== '??' && (
          <img src={flagUrl} alt={data.countryCode} className="h-6 w-8 rounded-sm border border-cyan/20 object-cover" />
        )}
        <div className="flex-1">
          <div className="text-sm font-bold text-slate-100">{data.displayName}</div>
          <div className="text-[10px] text-slate-500">{data.country} · {data.countryCode}</div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan/30 border-t-cyan" />
        </div>
      )}

      {/* Coordinates */}
      <Section title="COORDINATES">
        <Field icon={<Compass className="h-3 w-3" />} label="LATITUDE" value={data.lat.toFixed(6)} />
        <Field icon={<Compass className="h-3 w-3" />} label="LONGITUDE" value={data.lon.toFixed(6)} />
        {data.timezone && <Field icon={<Clock className="h-3 w-3" />} label="TIMEZONE" value={data.timezone} />}
        {data.elevation != null && <Field icon={<Mountain className="h-3 w-3" />} label="ELEVATION" value={`${Math.round(data.elevation)} m`} />}
      </Section>

      {/* Weather */}
      {data.weather && (
        <Section title="LOCAL WEATHER">
          <Field icon={<Thermometer className="h-3 w-3" />} label="TEMPERATURE" value={`${Math.round(data.weather.temperature)}°C`} />
          <Field icon={<Wind className="h-3 w-3" />} label="WIND" value={`${Math.round(data.weather.windSpeed)} km/h`} />
          <Field icon={<Globe className="h-3 w-3" />} label="CONDITIONS" value={weatherDescription(data.weather.weatherCode)} />
          <Field icon={<Clock className="h-3 w-3" />} label="DAY/NIGHT" value={data.weather.isDay ? 'Daytime' : 'Night'} />
        </Section>
      )}

      {/* OSINT Summary */}
      {data.wikiSummary && (
        <Section title="OSINT INTEL SUMMARY">
          <div className="text-[10px] leading-relaxed text-slate-400">{data.wikiSummary}</div>
          {data.wikiUrl && (
            <a
              href={data.wikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[9px] text-cyan hover:text-cyan-dim"
            >
              <Globe className="h-3 w-3" /> Full Wikipedia article
            </a>
          )}
        </Section>
      )}

      {/* Actions */}
      <div className="flex gap-2 p-3">
        <button
          onClick={() => {
            const event = new CustomEvent('godseye-zoom-satellite', { detail: { lat: data.lat, lon: data.lon } });
            window.dispatchEvent(event);
          }}
          className="flex flex-1 items-center justify-center gap-1.5 rounded border border-cyan/30 bg-cyan/10 px-2 py-2 text-[10px] font-semibold text-cyan transition hover:bg-cyan/20"
        >
          <ZoomIn className="h-3.5 w-3.5" /> Zoom Satellite
        </button>
        <button
          onClick={copyCoords}
          className="flex flex-1 items-center justify-center gap-1.5 rounded border border-cyan/30 bg-cyan/10 px-2 py-2 text-[10px] font-semibold text-cyan transition hover:bg-cyan/20"
        >
          <Copy className="h-3.5 w-3.5" /> {copied ? 'Copied!' : 'Copy GPS'}
        </button>
      </div>
    </>
  );
}

function SignalIntegrityBars({ kind }: { kind: string }) {
  const [bars, setBars] = useState([80, 65, 90, 55, 75]);
  const [sigint, setSigint] = useState(-42);

  useEffect(() => {
    const id = setInterval(() => {
      setBars((prev) => prev.map((v) => Math.max(20, Math.min(100, v + (Math.random() - 0.5) * 15))));
      setSigint((prev) => Math.max(-90, Math.min(-20, prev + (Math.random() - 0.5) * 8)));
    }, 1500);
    return () => clearInterval(id);
  }, []);

  const labels = ['SIG1', 'SIG2', 'SIG3', 'SIG4', 'SIG5'];
  const colors = bars.map((v) => (v > 70 ? 'bg-green' : v > 40 ? 'bg-amber' : 'bg-danger'));

  return (
    <div className="border-b border-cyan/10 bg-hud-bg/40 px-3 py-2">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Signal className="h-3 w-3 text-cyan/70" />
          <span className="text-[8px] font-bold tracking-[0.2em] text-cyan/60">SIGNAL INTEGRITY</span>
        </div>
        <div className="flex items-center gap-1 text-[9px] tabular-nums">
          <Activity className="h-3 w-3 text-green" />
          <span className="text-green">{sigint.toFixed(0)}</span>
          <span className="text-slate-600">SIGINT dB</span>
        </div>
      </div>
      <div className="flex items-end gap-1.5">
        {bars.map((v, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-0.5">
            <div className="flex h-12 w-full items-end overflow-hidden rounded-sm bg-hud-bg/60">
              <div
                className={`w-full ${colors[i]} transition-all duration-700`}
                style={{ height: `${v}%` }}
              />
            </div>
            <span className="text-[7px] text-slate-600">{labels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ThermalPreview({ kind, lat, lon, target }: { kind: string; lat: number; lon: number; target: NonNullable<SelectedTarget> }) {
  const [mode, setMode] = useState<'thermal' | 'nvg'>('thermal');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  const registration = kind === 'aircraft' ? (target.data as import('@/types').Aircraft).registration : null;
  const aircraftModel = kind === 'aircraft' ? (target.data as import('@/types').Aircraft).model : null;
  const isHelicopter = kind === 'aircraft' ? (target.data as import('@/types').Aircraft).helicopter : false;
  const isMilitary = kind === 'aircraft' ? (target.data as import('@/types').Aircraft).military : false;
  const satName = kind === 'satellite' ? (target.data as import('@/types').Satellite).name : null;
  const satCategory = kind === 'satellite' ? (target.data as import('@/types').Satellite).category : null;
  const satAltitude = kind === 'satellite' ? (target.data as import('@/types').Satellite).altitude : null;

  useEffect(() => {
    setPhotoUrl(null);
    if (kind !== 'aircraft' || !registration) return;
    setPhotoLoading(true);
    fetch(`https://api.planespotters.net/pub/photos/reg/${registration}`)
      .then((r) => r.json())
      .then((d) => {
        const p = d?.photos?.[0];
        if (p?.thumbnail?.src) setPhotoUrl(p.thumbnail.src);
        else if (p?.link) setPhotoUrl(p.link);
      })
      .catch(() => {})
      .finally(() => setPhotoLoading(false));
  }, [kind, registration]);

  const snapUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${lon - 0.008}%2C${lat - 0.005}%2C${lon + 0.008}%2C${lat + 0.005}&size=320%2C180&format=jpg&f=image`;

  return (
    <div className="border-b border-cyan/10 bg-hud-bg/40 px-3 py-2">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Thermometer className="h-3 w-3 text-amber/70" />
          <span className="text-[8px] font-bold tracking-[0.2em] text-amber/60">CAMERA FEED // FLIR - PREVIEW</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setMode('thermal')}
            className={`rounded border px-1.5 py-0.5 text-[7px] font-bold transition ${
              mode === 'thermal' ? 'border-amber/40 bg-amber/15 text-amber' : 'border-slate-700/30 bg-slate-800/20 text-slate-500'
            }`}
          >
            FLIR
          </button>
          <button
            onClick={() => setMode('nvg')}
            className={`rounded border px-1.5 py-0.5 text-[7px] font-bold transition ${
              mode === 'nvg' ? 'border-green/40 bg-green/15 text-green' : 'border-slate-700/30 bg-slate-800/20 text-slate-500'
            }`}
          >
            NVG
          </button>
        </div>
      </div>
      <div className={`relative h-20 overflow-hidden rounded border border-cyan/15 ${mode === 'thermal' ? 'shader-thermal' : 'shader-nvg'}`}>
        {kind === 'aircraft' && photoUrl ? (
          <img src={photoUrl} alt={aircraftModel ?? 'Aircraft'} className="h-full w-full object-cover" onError={() => setPhotoUrl(null)} />
        ) : kind === 'aircraft' && photoLoading ? (
          <div className="flex h-full items-center justify-center bg-black">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber/30 border-t-amber" />
          </div>
        ) : kind === 'aircraft' ? (
          <FlirCanvas mode={mode} silhouetteType={isHelicopter ? 'helicopter' : isMilitary ? 'fighter' : 'commercial'} label={aircraftModel ?? registration ?? 'AIRCRAFT'} />
        ) : kind === 'satellite' ? (
          <FlirCanvas mode={mode} silhouetteType="satellite" label={satName ?? satCategory ?? 'SATELLITE'} altitude={satAltitude} />
        ) : (
          <img src={snapUrl} alt="Thermal preview" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        )}
        <div className="scan-line" />
        <div className="absolute left-1 top-1 rounded bg-hud-bg/80 px-1 py-0.5 text-[7px] font-bold tracking-wider text-cyan/80">
          {mode === 'thermal' ? 'FLIR' : 'NVG'} · {lat.toFixed(3)},{lon.toFixed(3)}
        </div>
      </div>
    </div>
  );
}

function FlirCanvas({ mode, silhouetteType, label, altitude }: { mode: 'thermal' | 'nvg'; silhouetteType: 'helicopter' | 'fighter' | 'commercial' | 'satellite'; label: string; altitude?: number | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let animId = 0;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      frame++;

      // Background gradient
      const bg = ctx.createRadialGradient(w / 2, h / 2, 5, w / 2, h / 2, w);
      if (mode === 'thermal') {
        bg.addColorStop(0, '#1a0800');
        bg.addColorStop(0.5, '#0d0500');
        bg.addColorStop(1, '#050200');
      } else {
        bg.addColorStop(0, '#001a08');
        bg.addColorStop(0.5, '#000d04');
        bg.addColorStop(1, '#000200');
      }
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Thermal noise pixels
      const gridSize = 8;
      for (let x = 0; x < w; x += gridSize) {
        for (let y = 0; y < h; y += gridSize) {
          const noise = Math.sin(x * 0.05 + y * 0.05 + frame * 0.03) * 0.5 + 0.5;
          const heat = noise * 0.15;
          if (mode === 'thermal') {
            ctx.fillStyle = `rgba(${Math.floor(80 + heat * 120)}, ${Math.floor(30 + heat * 60)}, 0, ${heat * 0.6})`;
          } else {
            ctx.fillStyle = `rgba(0, ${Math.floor(40 + heat * 80)}, ${Math.floor(20 + heat * 40)}, ${heat * 0.5})`;
          }
          ctx.fillRect(x, y, gridSize, gridSize);
        }
      }

      // Grid overlay
      const gridColor = mode === 'thermal' ? 'rgba(251, 191, 36, 0.08)' : 'rgba(45, 255, 170, 0.08)';
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= w; x += 16) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y <= h; y += 16) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Wireframe silhouette
      const cx = w / 2;
      const cy = h / 2;
      const pulse = Math.sin(frame * 0.05) * 0.15 + 0.85;
      const wireColor = mode === 'thermal'
        ? `rgba(251, 191, 36, ${pulse})`
        : `rgba(45, 255, 170, ${pulse})`;

      ctx.strokeStyle = wireColor;
      ctx.lineWidth = 1.2;

      if (silhouetteType === 'satellite') {
        // Satellite wireframe: body + solar panels + antenna
        // Main body
        ctx.beginPath();
        ctx.rect(cx - 8, cy - 5, 16, 10);
        ctx.stroke();
        // Solar panels (left)
        ctx.beginPath();
        ctx.rect(cx - 24, cy - 3, 14, 6);
        ctx.stroke();
        // Solar panel grid lines (left)
        for (let i = 1; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(cx - 24 + i * 3.5, cy - 3);
          ctx.lineTo(cx - 24 + i * 3.5, cy + 3);
          ctx.stroke();
        }
        // Solar panels (right)
        ctx.beginPath();
        ctx.rect(cx + 10, cy - 3, 14, 6);
        ctx.stroke();
        // Solar panel grid lines (right)
        for (let i = 1; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(cx + 10 + i * 3.5, cy - 3);
          ctx.lineTo(cx + 10 + i * 3.5, cy + 3);
          ctx.stroke();
        }
        // Antenna dish
        ctx.beginPath();
        ctx.arc(cx, cy - 8, 4, 0, Math.PI, true);
        ctx.stroke();
        // Communication beam (pulsing)
        const beamAlpha = Math.sin(frame * 0.08) * 0.3 + 0.3;
        ctx.strokeStyle = mode === 'thermal'
          ? `rgba(251, 191, 36, ${beamAlpha})`
          : `rgba(45, 255, 170, ${beamAlpha})`;
        ctx.lineWidth = 0.5;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(cx, cy - 12);
        ctx.lineTo(cx, cy - 24);
        ctx.stroke();
        ctx.setLineDash([]);
        // Orbital path arc
        ctx.strokeStyle = mode === 'thermal'
          ? 'rgba(251, 191, 36, 0.15)'
          : 'rgba(45, 255, 170, 0.15)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(cx, cy + 20, 40, Math.PI + 0.3, Math.PI * 2 - 0.3);
        ctx.stroke();
      } else if (silhouetteType === 'helicopter') {
        // Helicopter silhouette: body + rotor
        ctx.beginPath();
        ctx.ellipse(cx, cy + 4, 14, 6, 0, 0, Math.PI * 2);
        ctx.stroke();
        // Rotor blade (spinning)
        const rotorAngle = frame * 0.15;
        const bladeLen = 22 * Math.abs(Math.cos(rotorAngle));
        ctx.beginPath();
        ctx.moveTo(cx - bladeLen, cy - 6);
        ctx.lineTo(cx + bladeLen, cy - 6);
        ctx.stroke();
        // Tail
        ctx.beginPath();
        ctx.moveTo(cx + 12, cy + 4);
        ctx.lineTo(cx + 28, cy + 2);
        ctx.lineTo(cx + 28, cy - 2);
        ctx.stroke();
        // Tail rotor
        ctx.beginPath();
        ctx.arc(cx + 28, cy, 3, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Fixed-wing silhouette (fighter or commercial)
        const span = 26;
        // Fuselage
        ctx.beginPath();
        ctx.moveTo(cx - 16, cy);
        ctx.lineTo(cx + 16, cy);
        ctx.stroke();
        // Wings
        ctx.beginPath();
        ctx.moveTo(cx - 4, cy - span / 2);
        ctx.lineTo(cx + 2, cy - 4);
        ctx.lineTo(cx + 2, cy + 4);
        ctx.lineTo(cx - 4, cy + span / 2);
        ctx.stroke();
        // Tail
        ctx.beginPath();
        ctx.moveTo(cx + 12, cy);
        ctx.lineTo(cx + 18, cy - 5);
        ctx.lineTo(cx + 18, cy + 5);
        ctx.stroke();
        // Nose (fighter: pointed, commercial: rounded)
        if (silhouetteType === 'fighter') {
          ctx.beginPath();
          ctx.moveTo(cx - 16, cy);
          ctx.lineTo(cx - 20, cy - 2);
          ctx.lineTo(cx - 20, cy + 2);
          ctx.closePath();
          ctx.stroke();
        }
      }

      // Crosshair
      const chColor = mode === 'thermal' ? 'rgba(251, 191, 36, 0.3)' : 'rgba(45, 255, 170, 0.3)';
      ctx.strokeStyle = chColor;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
      ctx.moveTo(0, cy); ctx.lineTo(w, cy);
      ctx.stroke();

      // Label
      ctx.fillStyle = mode === 'thermal' ? 'rgba(251, 191, 36, 0.7)' : 'rgba(45, 255, 170, 0.7)';
      ctx.font = '7px monospace';
      ctx.fillText(label.slice(0, 20), 4, h - 4);

      // Altitude for satellites
      if (silhouetteType === 'satellite' && altitude != null) {
        ctx.fillStyle = mode === 'thermal' ? 'rgba(251, 191, 36, 0.5)' : 'rgba(45, 255, 170, 0.5)';
        ctx.font = '6px monospace';
        ctx.fillText(`APOGEE: ${Math.round(altitude)} km`, 4, 8);
      }

      animId = requestAnimationFrame(draw);
    };

    canvas.width = 320;
    canvas.height = 80;
    draw();
    return () => cancelAnimationFrame(animId);
  }, [mode, silhouetteType, label, altitude]);

  return <canvas ref={canvasRef} className="h-full w-full" />;
}

function StreetLevelButton({ lat, lon }: { lat: number; lon: number }) {
  const [open, setOpen] = useState(false);

  const googleStreetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lon}`;
  const mapillaryUrl = `https://www.mapillary.com/app/?lat=${lat}&lng=${lon}&z=17`;
  const bingMapsUrl = `https://www.bing.com/maps?cp=${lat}~${lon}&lvl=17&style=o`;

  return (
    <>
      <div className="border-t border-cyan/10 p-3">
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded border border-amber/30 bg-amber/10 px-2 py-2 text-[10px] font-semibold text-amber transition hover:bg-amber/20"
        >
          <Eye className="h-3.5 w-3.5" /> STREET-LEVEL VIEW
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative flex w-[90vw] max-w-md flex-col overflow-hidden rounded-lg border border-cyan/30 bg-hud-bg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-cyan/20 bg-cyan/5 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-amber" />
                <span className="text-[11px] font-bold tracking-[0.2em] text-cyan">STREET-LEVEL RECON</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-danger">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Target coordinates reminder */}
            <div className="border-b border-cyan/10 px-4 py-3">
              <div className="text-[9px] font-bold tracking-[0.15em] text-slate-500">TARGET COORDINATES</div>
              <div className="mt-1 flex items-center gap-3 text-[11px] tabular-nums">
                <span className="text-slate-300">
                  <span className="text-slate-600">LAT</span> {lat.toFixed(6)}°
                </span>
                <span className="text-slate-300">
                  <span className="text-slate-600">LON</span> {lon.toFixed(6)}°
                </span>
              </div>
              <div className="mt-1.5 text-[8px] text-slate-600">
                Precision: exact click point — open in new tab for full street-level inspection
              </div>
            </div>

            {/* Direct open buttons */}
            <div className="flex flex-col gap-2 p-4">
              <a
                href={googleStreetViewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded border border-cyan/40 bg-cyan/15 px-3 py-3 text-[11px] font-bold text-cyan transition hover:bg-cyan/25"
              >
                <ExternalLink className="h-4 w-4" /> OUVRIR GOOGLE STREET VIEW
                <span className="text-[8px] font-normal text-slate-500">(nouvel onglet)</span>
              </a>
              <a
                href={mapillaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded border border-amber/30 bg-amber/10 px-3 py-2.5 text-[10px] font-semibold text-amber transition hover:bg-amber/20"
              >
                <ExternalLink className="h-3.5 w-3.5" /> VUE MAPILLARY
                <span className="text-[8px] font-normal text-slate-500">(nouvel onglet)</span>
              </a>
              <a
                href={bingMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded border border-slate-600/30 bg-slate-700/20 px-3 py-2 text-[9px] font-medium text-slate-400 transition hover:bg-slate-700/40"
              >
                <ExternalLink className="h-3 w-3" /> Bing Streetside (nouvel onglet)
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TrailMini({ trail }: { trail: [number, number][] }) {
  const minLat = Math.min(...trail.map((t) => t[0]));
  const maxLat = Math.max(...trail.map((t) => t[0]));
  const minLon = Math.min(...trail.map((t) => t[1]));
  const maxLon = Math.max(...trail.map((t) => t[1]));
  const range = Math.max(maxLat - minLat, maxLon - minLon, 0.01);
  const pts = trail.map((t) => {
    const x = ((t[1] - minLon) / range) * 100;
    const y = 100 - ((t[0] - minLat) / range) * 100;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <Section title="FLIGHT PATH TRAIL">
      <div className="relative h-24 w-full overflow-hidden rounded border border-cyan/10 bg-hud-bg">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
          <polyline
            points={pts.join(' ')}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="0.8"
            strokeOpacity="0.7"
          />
          <circle cx={pts[pts.length - 1].split(',')[0]} cy={pts[pts.length - 1].split(',')[1]} r="2" fill="#ff2d55" />
        </svg>
      </div>
    </Section>
  );
}
