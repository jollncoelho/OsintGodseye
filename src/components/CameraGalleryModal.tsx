import { useEffect, useMemo, useState } from 'react';
import { Camera, X, RefreshCw, ExternalLink, Search, MapPin } from 'lucide-react';
import type { CctvCamera } from '@/types';

type Props = {
  cameras: CctvCamera[];
  loading: boolean;
  source: string | null;
  onClose: () => void;
  onFlyTo: (lat: number, lon: number, name: string) => void;
};

/** Live multi-camera wall — mirrors OSIRIS' `cctv_previews` layer. */
export default function CameraGalleryModal({ cameras, loading, source, onClose, onFlyTo }: Props) {
  const [filter, setFilter] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [tick, setTick] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => setTick((t) => t + 1), 15_000);
    return () => clearInterval(id);
  }, [autoRefresh]);

  const providers = useMemo(() => {
    const set = new Map<string, number>();
    for (const c of cameras) set.set(c.type, (set.get(c.type) ?? 0) + 1);
    return Array.from(set.entries()).sort((a, b) => b[1] - a[1]);
  }, [cameras]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cameras.filter((c) => {
      if (filter !== 'all' && c.type !== filter) return false;
      if (q && !`${c.name} ${c.location}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [cameras, filter, query]);

  // Cap the rendered wall so a 1000-camera catalog stays responsive.
  const visible = filtered.slice(0, 60);

  const bust = (url: string) => `${url}${url.includes('?') ? '&' : '?'}_t=${tick}`;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/85 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative flex h-[88vh] w-[94vw] max-w-6xl flex-col overflow-hidden rounded-lg border border-cyan/30 bg-hud-bg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bracket tl" />
        <div className="bracket tr" />
        <div className="bracket bl" />
        <div className="bracket br" />

        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-cyan/20 bg-cyan/5 px-4 py-2.5">
          <Camera className="h-4 w-4 text-green" />
          <span className="text-[11px] font-bold tracking-[0.2em] text-cyan">CAMERA WALL</span>
          <span className="flex items-center gap-1 text-[9px] text-green">
            <span className="h-1.5 w-1.5 rounded-full bg-green blink" />
            {cameras.length} FEEDS
          </span>
          {source && (
            <span className="rounded border border-cyan/20 bg-black/40 px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-cyan/70">
              via {source}
            </span>
          )}

          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-cyan/50" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter cameras…"
                className="w-44 border border-cyan/25 bg-black/60 py-1.5 pl-7 pr-2 text-[10px] text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan/60"
              />
            </div>
            <button
              onClick={() => setAutoRefresh((v) => !v)}
              className={`flex items-center gap-1.5 border px-2 py-1.5 text-[9px] font-bold transition ${
                autoRefresh ? 'border-green/40 bg-green/15 text-green' : 'border-slate-600/40 bg-slate-800/30 text-slate-400'
              }`}
              title="Auto-refresh every 15s"
            >
              AUTO
            </button>
            <button
              onClick={() => setTick((t) => t + 1)}
              className="flex items-center gap-1.5 border border-cyan/30 bg-cyan/10 px-2 py-1.5 text-[9px] font-bold text-cyan transition hover:bg-cyan/20"
            >
              <RefreshCw className="h-3 w-3" /> REFRESH
            </button>
            <button onClick={onClose} className="text-slate-500 hover:text-danger">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Provider filter chips */}
        <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-cyan/10 bg-black/40 px-4 py-2">
          <button
            onClick={() => setFilter('all')}
            className={`rounded border px-2 py-0.5 text-[9px] font-semibold transition ${
              filter === 'all' ? 'border-cyan/40 bg-cyan/15 text-cyan' : 'border-slate-700/40 bg-slate-800/20 text-slate-500 hover:bg-slate-800/40'
            }`}
          >
            ALL {cameras.length}
          </button>
          {providers.map(([name, n]) => (
            <button
              key={name}
              onClick={() => setFilter(name)}
              className={`rounded border px-2 py-0.5 text-[9px] font-semibold transition ${
                filter === name ? 'border-cyan/40 bg-cyan/15 text-cyan' : 'border-slate-700/40 bg-slate-800/20 text-slate-500 hover:bg-slate-800/40'
              }`}
            >
              {name} {n}
            </button>
          ))}
        </div>

        {/* Wall */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading && cameras.length === 0 && (
            <div className="flex h-full items-center justify-center gap-3 text-[11px] text-cyan/70">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan/20 border-t-cyan" />
              Acquiring camera network…
            </div>
          )}

          {!loading && visible.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-600">
              <Camera className="h-10 w-10 opacity-30" />
              <div className="text-[11px]">No cameras match this filter.</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {visible.map((c) => (
              <CameraTile key={c.id} cam={c} src={bust(c.url)} onFlyTo={onFlyTo} />
            ))}
          </div>

          {filtered.length > visible.length && (
            <div className="py-3 text-center text-[10px] text-slate-600">
              Showing {visible.length} of {filtered.length} — refine the filter or search to narrow the wall.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CameraTile({ cam, src, onFlyTo }: { cam: CctvCamera; src: string; onFlyTo: (lat: number, lon: number, name: string) => void }) {
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');

  return (
    <div className="group relative overflow-hidden rounded border border-cyan/15 bg-black">
      <div className="relative aspect-video w-full bg-hud-bg">
        {state !== 'error' && (
          <img
            src={src}
            alt={cam.name}
            referrerPolicy="no-referrer"
            loading="lazy"
            className="h-full w-full object-cover"
            onLoad={() => setState('ok')}
            onError={() => setState('error')}
          />
        )}
        {state === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan/20 border-t-cyan" />
          </div>
        )}
        {state === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-slate-600">
            <Camera className="h-6 w-6 opacity-40" />
            <span className="text-[8px] tracking-wider">FEED OFFLINE</span>
          </div>
        )}
        <div className="scan-line opacity-40" />
        <div className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded bg-black/75 px-1.5 py-0.5 text-[7px] font-bold tracking-wider text-cyan">
          <span className={`h-1 w-1 rounded-full ${state === 'error' ? 'bg-danger' : 'bg-green blink'}`} />
          {state === 'error' ? 'OFFLINE' : 'LIVE'}
        </div>
      </div>

      <div className="p-1.5">
        <div className="truncate text-[9px] font-semibold text-slate-200" title={cam.name}>{cam.name}</div>
        <div className="truncate text-[8px] text-slate-500">{cam.location} · {cam.type}</div>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center gap-1.5 bg-black/85 py-1.5 transition-transform group-hover:translate-y-0">
        <button
          onClick={() => onFlyTo(cam.lat, cam.lon, cam.name)}
          className="flex items-center gap-1 rounded border border-cyan/30 bg-cyan/10 px-2 py-0.5 text-[8px] font-bold text-cyan hover:bg-cyan/20"
        >
          <MapPin className="h-2.5 w-2.5" /> LOCATE
        </button>
        <a
          href={cam.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 rounded border border-slate-600/40 bg-slate-700/30 px-2 py-0.5 text-[8px] font-bold text-slate-300 hover:bg-slate-700/50"
        >
          <ExternalLink className="h-2.5 w-2.5" /> SOURCE
        </a>
      </div>
    </div>
  );
}
