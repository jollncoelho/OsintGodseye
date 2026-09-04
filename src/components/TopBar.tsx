import { useEffect, useState } from 'react';
import { Activity, Circle, Crosshair, LocateFixed, Navigation, Search, Github, Star } from 'lucide-react';
import { formatUTC, formatUTCDate } from '@/lib/format';

export type SearchResultItem = {
  displayName: string;
  lat: number;
  lon: number;
  type?: string;
  importance?: number;
};

type Props = {
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
  search, onSearch, onSearchSubmit, onGeolocate, locating, geolocating,
  searchResults, onPickResult, showResults, setShowResults, cursor,
}: Props) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="glass relative z-[700] flex min-h-12 items-center gap-3 border-b border-cyan/25 bg-black/85 px-3 py-2 no-select lg:gap-5 lg:px-4">
      <div className="flex shrink-0 items-center gap-2">
        <div className="relative flex h-7 w-7 items-center justify-center border border-cyan/50 bg-black/60">
          <Crosshair className="h-4 w-4 text-cyan" />
          <div className="absolute inset-0 border border-cyan/20 pulse-ring" />
        </div>
        <div className="leading-tight">
          <div className="text-[10px] font-bold tracking-[0.25em] text-cyan text-glow sm:text-[11px]">OSINT GOD'S EYE</div>
          <div className="hidden text-[7px] tracking-[0.22em] text-slate-500 sm:block">MISSION LOCAL C2 // CLASSIFIED</div>
        </div>
      </div>

      <div className="hidden h-7 w-px bg-cyan/20 sm:block" />

      <div className="flex shrink-0 items-center gap-3">
        <div className="flex flex-col leading-tight">
          <div className="text-sm font-bold tabular-nums text-slate-100 sm:text-base">{formatUTC(now)}</div>
          <div className="hidden text-[8px] tracking-wider text-slate-500 md:block">{formatUTCDate(now)} · BRUSSELS</div>
        </div>
        <div className="flex items-center gap-1.5 border border-danger/35 bg-danger/10 px-2 py-1">
          <Circle className="h-2 w-2 fill-danger text-danger blink" />
          <span className="text-[8px] font-bold tracking-wider text-danger">REC</span>
        </div>
      </div>

      <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 lg:gap-3">
        <div className="relative min-w-0 flex-1 max-w-[560px]">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cyan/50" />
          <input
            value={search}
            onChange={(e) => { onSearch(e.target.value); setShowResults(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onSearchSubmit(); } }}
            placeholder="SEARCH PLACE / ADDRESS / CALLSIGN / LAT,LON"
            className="w-full border border-cyan/25 bg-black/70 py-2 pl-8 pr-2 text-[10px] text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan/65 focus:shadow-[0_0_14px_rgba(34,211,238,0.18)]"
          />
          {showResults && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-[800] mt-1 max-h-64 overflow-y-auto border border-cyan/25 bg-black/95 shadow-lg backdrop-blur">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => onPickResult(result)}
                  className="flex w-full items-center gap-2 border-b border-cyan/10 px-3 py-2 text-left text-[10px] text-slate-300 transition hover:bg-cyan/10 last:border-0"
                >
                  <Navigation className="h-3 w-3 shrink-0 text-cyan/60" />
                  <span className="truncate">{result.displayName}</span>
                  {result.type && <span className="ml-auto shrink-0 text-[8px] uppercase text-cyan/70">{result.type}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={(event) => { event.preventDefault(); onSearchSubmit(); }}
          disabled={locating}
          className={`hidden items-center gap-1.5 border px-2.5 py-2 text-[9px] font-semibold transition md:flex ${
            locating ? 'border-amber/40 bg-amber/10 text-amber' : 'border-cyan/35 bg-cyan/10 text-cyan hover:bg-cyan/20'
          }`}
        >
          {locating ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-amber/30 border-t-amber" /> : <Search className="h-3 w-3" />}
          {locating ? 'SEARCHING' : 'SEARCH'}
        </button>

        <div className="hidden shrink-0 flex-col border-l border-cyan/20 pl-3 leading-tight xl:flex">
          <div className="text-[7px] font-bold tracking-[0.2em] text-cyan/60">WORLD GRID // GRID ACTIVE</div>
          <div className="text-[9px] font-bold tabular-nums text-cyan">
            {cursor ? `${cursor.lat.toFixed(4)}° N / ${Math.abs(cursor.lon).toFixed(4)}° ${cursor.lon >= 0 ? 'E' : 'W'}` : '50.8503° N / 4.3517° E'}
          </div>
        </div>

        <button
          type="button"
          onClick={onGeolocate}
          disabled={geolocating}
          title="Locate my position"
          className={`hidden items-center gap-1 border px-2 py-2 text-[9px] font-semibold transition lg:flex ${
            geolocating ? 'border-amber/40 bg-amber/10 text-amber' : 'border-cyan/25 bg-black/60 text-cyan hover:bg-cyan/10'
          }`}
        >
          {geolocating ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-amber/30 border-t-amber" /> : <LocateFixed className="h-3 w-3" />}
          GPS
        </button>

        <div className="flex shrink-0 items-center gap-1 border border-green/30 bg-green/10 px-2 py-2 text-[8px] font-semibold text-green">
          <Activity className="h-3 w-3 blink" /> LIVE
        </div>

        <a
          href="https://github.com/jollncoelho/OsintGodseye"
          target="_blank"
          rel="noopener noreferrer"
          title="GitHub Repository"
          className="flex shrink-0 items-center gap-1.5 border border-cyan/30 bg-black/60 px-2.5 py-2 text-[8px] font-bold tracking-wider text-cyan transition hover:bg-cyan/15"
        >
          <Github className="h-3.5 w-3.5" />
          <Star className="h-3 w-3 fill-cyan text-cyan" />
          STAR
        </a>
      </div>
    </header>
  );
}
