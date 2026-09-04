import { useEffect, useState } from 'react';
import { Satellite, Plane, Rocket, Crosshair, Ship, Anchor, Radio, Camera, Search, Crosshair as CrosshairIcon, Activity, LocateFixed, Navigation, Circle } from 'lucide-react';
import { formatUTC, formatUTCDate } from '@/lib/format';

export type SearchResultItem = {
  displayName: string;
  lat: number;
  lon: number;
  type?: string;
  importance?: number;
};

type Props = {
  civPlanes: number;
  milPlanes: number;
  helicopters: number;
  civShips: number;
  milShips: number;
  satellites: number;
  radios: number;
  cctv: number;
  search: string;
  onSearch: (v: string) => void;
  onSearchSubmit: () => void;
  onGeolocate: () => void;
  locating: boolean;
  geolocating: boolean;
  searchResults: SearchResultItem[];
  onPickResult: (item: SearchResultItem) => void;
  showResults: boolean;
  setShowResults: (v: boolean) => void;
  cursor: { lat: number; lon: number; zoom: number } | null;
};

export default function TopBar({
  civPlanes, milPlanes, helicopters, civShips, milShips, satellites, radios, cctv,
  search, onSearch, onSearchSubmit, onGeolocate, locating, geolocating,
  searchResults, onPickResult, showResults, setShowResults, cursor,
}: Props) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="glass relative z-[700] flex h-14 items-center gap-4 border-b border-cyan/20 px-4 no-select">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="relative flex h-8 w-8 items-center justify-center rounded border border-cyan/40">
          <Crosshair className="h-5 w-5 text-cyan" />
          <div className="absolute inset-0 rounded border border-cyan/20 pulse-ring" />
        </div>
        <div className="leading-tight">
          <div className="text-[11px] font-bold tracking-[0.3em] text-cyan text-glow">OSINT GOD'S EYE</div>
          <div className="text-[8px] tracking-[0.25em] text-slate-500">BELGIUM · LOCAL TIME</div>
        </div>
      </div>

      <div className="h-8 w-px bg-cyan/20" />

      {/* Clock */}
      <div className="flex flex-col leading-tight">
        <div className="text-base font-bold text-cyan text-glow tabular-nums">{formatUTC(now)}</div>
        <div className="text-[9px] tracking-wider text-slate-500">{formatUTCDate(now)} · Europe/Brussels</div>
      </div>

      <div className="h-8 w-px bg-cyan/20" />

      {/* Dynamic locked coordinates + REC indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 rounded border border-danger/30 bg-danger/10 px-2 py-1">
          <Circle className="h-2.5 w-2.5 fill-danger text-danger blink" />
          <span className="text-[9px] font-bold tracking-wider text-danger">REC</span>
        </div>
        {cursor && (
          <div className="flex flex-col leading-tight">
            <div className="text-[8px] tracking-wider text-slate-500">LOCKED COORDINATES</div>
            <div className="text-[10px] font-bold tabular-nums text-cyan/90">
              {cursor.lat.toFixed(4)}° / {cursor.lon.toFixed(4)}° · Z{cursor.zoom}
            </div>
          </div>
        )}
      </div>

      <div className="h-8 w-px bg-cyan/20" />
      <div className="flex items-center gap-2 text-[10px]">
        <Counter icon={<Plane className="h-3.5 w-3.5" />} label="CIV AIR" value={civPlanes} sub="LIVE" color="text-cyan" />
        <Counter icon={<Rocket className="h-3.5 w-3.5" />} label="MIL AIR" value={milPlanes} sub="RED" color="text-danger" />
        <Counter icon={<CrosshairIcon className="h-3.5 w-3.5" />} label="HELI" value={helicopters} sub="ROT" color="text-amber" />
        <Counter icon={<Ship className="h-3.5 w-3.5" />} label="MERCHANT" value={civShips} sub="SEA" color="text-cyan" />
        <Counter icon={<Anchor className="h-3.5 w-3.5" />} label="WARSHIP" value={milShips} sub="NAV" color="text-danger" />
        <Counter icon={<Satellite className="h-3.5 w-3.5" />} label="SAT" value={satellites} sub="ORBIT" color="text-amber" />
        <Counter icon={<Radio className="h-3.5 w-3.5" />} label="RADIO" value={radios} sub="LIVE" color="text-purple-400" />
        <Counter icon={<Camera className="h-3.5 w-3.5" />} label="CCTV" value={cctv} sub="FEEDS" color="text-green" />
      </div>

      {/* Search + GPS */}
      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => { onSearch(e.target.value); setShowResults(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onSearchSubmit(); } }}
            placeholder="PLACE / ADDRESS / CALLSIGN / LAT,LON"
            className="w-72 rounded border border-cyan/20 bg-hud-bg/80 py-1.5 pl-8 pr-2 text-[11px] text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan/50 focus:shadow-[0_0_10px_rgba(34,211,238,0.2)]"
          />
          {/* Autocomplete dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-[800] mt-1 max-h-64 overflow-y-auto rounded border border-cyan/20 bg-hud-bg/95 shadow-lg backdrop-blur">
              {searchResults.map((r, i) => (
                <button
                  key={i}
                  onClick={() => onPickResult(r)}
                  className="flex w-full items-center gap-2 border-b border-cyan/5 px-3 py-2 text-left text-[10px] text-slate-300 transition hover:bg-cyan/10 last:border-0"
                >
                  <Navigation className="h-3 w-3 shrink-0 text-cyan/60" />
                  <span className="truncate">{r.displayName}</span>
                  {r.type && (
                    <span className="ml-auto shrink-0 rounded bg-cyan/10 px-1.5 py-0.5 text-[8px] font-bold uppercase text-cyan/70">
                      {r.type}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Text search button */}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); onSearchSubmit(); }}
          disabled={locating}
          className={`flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-[10px] font-semibold transition ${
            locating
              ? 'border-amber/40 bg-amber/10 text-amber'
              : 'border-cyan/30 bg-cyan/10 text-cyan hover:bg-cyan/20'
          }`}
        >
          {locating ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber/30 border-t-amber" />
              SEARCHING...
            </>
          ) : (
            <>
              <Search className="h-3.5 w-3.5" /> SEARCH
            </>
          )}
        </button>
        {/* GPS geolocation button */}
        <button
          type="button"
          onClick={onGeolocate}
          disabled={geolocating}
          title="Locate my position"
          className={`flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-[10px] font-semibold transition ${
            geolocating
              ? 'border-amber/40 bg-amber/10 text-amber'
              : 'border-green/30 bg-green/10 text-green hover:bg-green/20'
          }`}
        >
          {geolocating ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber/30 border-t-amber" />
              GPS...
            </>
          ) : (
            <>
              <LocateFixed className="h-3.5 w-3.5" /> GPS
            </>
          )}
        </button>
        <div className="flex items-center gap-1.5 rounded border border-green/30 bg-green/10 px-2.5 py-1.5 text-[10px] font-semibold text-green">
          <Activity className="h-3.5 w-3.5 blink" /> LIVE
        </div>
      </div>
    </div>
  );
}

function Counter({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded border border-cyan/10 bg-hud-bg/50 px-2 py-1">
      <span className={color}>{icon}</span>
      <div className="leading-none">
        <div className="text-[8px] tracking-wider text-slate-500">{label}</div>
        <div className={`text-sm font-bold tabular-nums ${color}`}>{value}</div>
      </div>
      <div className="text-[8px] text-slate-600">{sub}</div>
    </div>
  );
}
