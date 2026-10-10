import { useState } from 'react';
import { Camera, Activity, Satellite, X, Bug, Images } from 'lucide-react';
import type { Earthquake } from '@/types';

type Props = {
  earthquakes: Earthquake[];
  eqLoading: boolean;
  eqError: string | null;
  cyberCount: number;
  onOpenLiveFeeds: () => void;
  onOpenCameraGallery: () => void;
  onToggleCctv: () => void;
  cctvActive: boolean;
  cctvCount: number;
};

type Tool = 'earthquakes' | null;

export default function ReconToolkit({
  earthquakes, eqLoading, eqError, cyberCount,
  onOpenLiveFeeds, onOpenCameraGallery, onToggleCctv, cctvActive, cctvCount,
}: Props) {
  const [activeTool, setActiveTool] = useState<Tool>(null);

  return (
    <>
      {!activeTool && (
        <div className="glass absolute right-3 top-28 z-[650] flex flex-col gap-2 rounded-lg border border-cyan/25 bg-black/85 p-1.5 no-select">
          <ToolButton
            icon={<Camera className="h-4 w-4" />}
            label="CAMS"
            onClick={onToggleCctv}
            title={`Toggle camera layer (${cctvCount} feeds)`}
            active={cctvActive}
          />
          <div className="h-px w-7 bg-cyan/15" />
          <ToolButton
            icon={<Images className="h-4 w-4" />}
            label="WALL"
            onClick={onOpenCameraGallery}
            title="Open the live camera wall"
          />
          <div className="h-px w-7 bg-cyan/15" />
          <ToolButton
            icon={<Activity className="h-4 w-4" />}
            label="SEISMIC"
            onClick={() => setActiveTool((p) => (p === 'earthquakes' ? null : 'earthquakes'))}
            title="USGS earthquake alerts"
            badge={earthquakes.length > 0 ? earthquakes.length : undefined}
            badgeColor="bg-amber"
          />
          <div className="h-px w-7 bg-cyan/15" />
          <ToolButton
            icon={<Bug className="h-4 w-4" />}
            label="CYBER"
            onClick={onOpenLiveFeeds}
            title="Threat & feed console"
            badge={cyberCount > 0 ? cyberCount : undefined}
            badgeColor="bg-green"
          />
          <div className="h-px w-7 bg-cyan/15" />
          <ToolButton
            icon={<Satellite className="h-4 w-4" />}
            label="LIVE"
            onClick={onOpenLiveFeeds}
            title="Live video feeds"
          />
        </div>
      )}

      {activeTool === 'earthquakes' && (
        <div className="glass slide-up absolute right-3 top-28 z-[650] flex h-[60vh] w-72 flex-col rounded-lg border border-amber/30 bg-black/85 p-3 no-select">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber" />
              <span className="text-[10px] font-bold tracking-[0.2em] text-amber">SEISMIC ALERTS</span>
            </div>
            <button onClick={() => setActiveTool(null)} className="text-slate-500 hover:text-danger">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="text-[8px] text-slate-600">USGS Earthquakes · M2.5+ · Last 24h</div>

          {eqLoading && (
            <div className="flex flex-1 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber/30 border-t-amber" />
            </div>
          )}

          {eqError && <div className="flex flex-1 items-center justify-center text-[10px] text-danger">Feed error: {eqError}</div>}

          {!eqLoading && !eqError && earthquakes.length === 0 && (
            <div className="flex flex-1 items-center justify-center text-[10px] text-slate-600">
              No significant seismic events in the last 24 hours.
            </div>
          )}

          {!eqLoading && !eqError && earthquakes.length > 0 && (
            <div className="mt-2 flex-1 space-y-1.5 overflow-y-auto">
              {earthquakes
                .slice()
                .sort((a, b) => b.magnitude - a.magnitude)
                .map((eq) => {
                  const mag = eq.magnitude;
                  const color =
                    mag >= 6 ? 'text-danger border-danger/40 bg-danger/10' :
                    mag >= 4.5 ? 'text-amber border-amber/40 bg-amber/10' :
                    'text-cyan border-cyan/30 bg-cyan/5';
                  return (
                    <div key={eq.id} className={`rounded border px-2 py-1.5 ${color}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold tabular-nums">M{mag.toFixed(1)}</span>
                        <span className="text-[8px] text-slate-500">{eq.depth.toFixed(0)} km deep</span>
                      </div>
                      <div className="mt-0.5 text-[9px] text-slate-400">{eq.place}</div>
                      <div className="text-[8px] text-slate-600">
                        {new Date(eq.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} UTC
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </>
  );
}

function ToolButton({
  icon, label, onClick, title, badge, badgeColor, active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  title: string;
  badge?: number;
  badgeColor?: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`group relative flex h-10 w-10 flex-col items-center justify-center gap-0.5 rounded border transition ${
        active ? 'border-cyan/40 bg-cyan/15' : 'border-transparent hover:border-cyan/30 hover:bg-cyan/10'
      }`}
    >
      <span className={active ? 'text-cyan' : 'text-cyan/70 group-hover:text-cyan'}>{icon}</span>
      <span className={`text-[6px] font-bold tracking-wider ${active ? 'text-cyan' : 'text-cyan/60 group-hover:text-cyan/90'}`}>{label}</span>
      {badge != null && (
        <span className={`absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-1 text-[7px] font-bold text-hud-bg ${badgeColor ?? 'bg-cyan'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}
