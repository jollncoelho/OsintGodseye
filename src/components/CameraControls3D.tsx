import { useCallback, useState } from 'react';
import { Compass, Box, Mountain, Sun, Rotate3d, Navigation, ChevronRight } from 'lucide-react';

type Props = {
  pitch: number;
  setPitch: (v: number) => void;
  bearing: number;
  setBearing: (v: number) => void;
  terrainEnabled: boolean;
  setTerrainEnabled: (v: boolean) => void;
  hillshadeEnabled: boolean;
  setHillshadeEnabled: (v: boolean) => void;
  buildings3DEnabled: boolean;
  setBuildings3DEnabled: (v: boolean) => void;
  onToggle3D: () => void;
  is3DActive: boolean;
};

export default function CameraControls3D({
  pitch, setPitch, bearing, setBearing,
  terrainEnabled, setTerrainEnabled,
  hillshadeEnabled, setHillshadeEnabled,
  buildings3DEnabled, setBuildings3DEnabled,
  onToggle3D, is3DActive,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const resetNorth = useCallback(() => {
    setBearing(0);
    setPitch(0);
  }, [setBearing, setPitch]);

  // Collapsed: compact button
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        title="Expand 3D Camera controls"
        className={`absolute right-3 bottom-3 z-[650] flex h-11 w-11 items-center justify-center border no-select transition-all duration-300 hover:scale-105 ${
          is3DActive
            ? 'border-cyan/40 bg-cyan/15 text-cyan shadow-[0_0_12px_rgba(34,211,238,0.3)]'
            : 'border-cyan/25 bg-black/70 text-cyan/70 hover:border-cyan/40'
        }`}
      >
        <Box className="h-5 w-5" />
        <span className="absolute -bottom-0.5 text-[7px] font-bold tracking-wider text-cyan/80">3D</span>
      </button>
    );
  }

  // Expanded: full panel
  return (
    <div className="absolute right-3 bottom-3 z-[650] flex w-52 flex-col gap-2 border border-cyan/25 bg-black/85 p-2.5 no-select backdrop-blur-md transition-all duration-300 animate-[slideInRight_0.25s_ease-out]">
      {/* Header with collapse button */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold tracking-[0.2em] text-cyan">3D CAMERA</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggle3D}
            className={`flex items-center gap-1 rounded border px-2 py-1 text-[9px] font-bold transition ${
              is3DActive
                ? 'border-cyan/40 bg-cyan/15 text-cyan'
                : 'border-slate-700/40 bg-slate-800/30 text-slate-500 hover:bg-slate-800/50'
            }`}
          >
            <Box className="h-3 w-3" /> 3D {is3DActive ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setExpanded(false)}
            title="Collapse panel"
            className="flex h-6 w-6 items-center justify-center rounded border border-cyan/20 bg-hud-bg/40 text-cyan/70 transition hover:bg-cyan/10"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Compass */}
      <div className="flex items-center gap-2">
        <button
          onClick={resetNorth}
          className="relative flex h-12 w-12 items-center justify-center rounded-full border border-cyan/30 bg-hud-bg/60 transition hover:border-cyan/60"
          title="Reset to North (0° pitch, 0° bearing)"
        >
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ transform: `rotate(${bearing}deg)` }}
          >
            <Navigation className="h-7 w-7 text-cyan" style={{ fill: '#22d3ee' }} />
          </div>
          <span className="absolute -top-0.5 text-[7px] font-bold text-cyan">N</span>
        </button>
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center justify-between text-[8px] text-slate-500">
            <span>PITCH</span>
            <span className="tabular-nums text-cyan">{Math.round(pitch)}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="85"
            value={pitch}
            onChange={(e) => setPitch(parseInt(e.target.value))}
            className="h-1 cursor-pointer accent-cyan"
          />
          <div className="flex items-center justify-between text-[8px] text-slate-500">
            <span>BEARING</span>
            <span className="tabular-nums text-cyan">{Math.round(bearing)}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={bearing}
            onChange={(e) => setBearing(parseInt(e.target.value))}
            className="h-1 cursor-pointer accent-cyan"
          />
        </div>
      </div>

      {/* Quick angle buttons */}
      <div className="flex gap-1">
        <button
          onClick={() => setPitch(0)}
          className={`flex-1 rounded border px-1 py-1 text-[8px] font-semibold transition ${
            pitch === 0 ? 'border-cyan/40 bg-cyan/15 text-cyan' : 'border-slate-700/30 bg-slate-800/20 text-slate-500 hover:bg-slate-800/40'
          }`}
        >
          TOP-DOWN
        </button>
        <button
          onClick={() => setPitch(30)}
          className={`flex-1 rounded border px-1 py-1 text-[8px] font-semibold transition ${
            pitch === 30 ? 'border-cyan/40 bg-cyan/15 text-cyan' : 'border-slate-700/30 bg-slate-800/20 text-slate-500 hover:bg-slate-800/40'
          }`}
        >
          30°
        </button>
        <button
          onClick={() => setPitch(60)}
          className={`flex-1 rounded border px-1 py-1 text-[8px] font-semibold transition ${
            pitch === 60 ? 'border-cyan/40 bg-cyan/15 text-cyan' : 'border-slate-700/30 bg-slate-800/20 text-slate-500 hover:bg-slate-800/40'
          }`}
        >
          60° TACT
        </button>
        <button
          onClick={() => setPitch(85)}
          className={`flex-1 rounded border px-1 py-1 text-[8px] font-semibold transition ${
            pitch === 85 ? 'border-cyan/40 bg-cyan/15 text-cyan' : 'border-slate-700/30 bg-slate-800/20 text-slate-500 hover:bg-slate-800/40'
          }`}
        >
          85°
        </button>
      </div>

      <div className="h-px bg-cyan/15" />

      {/* Terrain toggles */}
      <button
        onClick={() => setTerrainEnabled(!terrainEnabled)}
        className={`flex items-center gap-2 rounded border px-2 py-1.5 text-[10px] font-medium transition ${
          terrainEnabled
            ? 'border-amber/40 bg-amber/10 text-amber'
            : 'border-slate-700/30 bg-slate-800/20 text-slate-500 hover:bg-slate-800/40'
        }`}
      >
        <Mountain className="h-3.5 w-3.5" /> Terrain Elevation
        <span className={`ml-auto h-2 w-2 rounded-full ${terrainEnabled ? 'bg-amber shadow-[0_0_6px_rgba(251,191,36,0.8)]' : 'bg-slate-700'}`} />
      </button>

      <button
        onClick={() => setHillshadeEnabled(!hillshadeEnabled)}
        className={`flex items-center gap-2 rounded border px-2 py-1.5 text-[10px] font-medium transition ${
          hillshadeEnabled
            ? 'border-amber/40 bg-amber/10 text-amber'
            : 'border-slate-700/30 bg-slate-800/20 text-slate-500 hover:bg-slate-800/40'
        }`}
      >
        <Sun className="h-3.5 w-3.5" /> Tactical Hillshade
        <span className={`ml-auto h-2 w-2 rounded-full ${hillshadeEnabled ? 'bg-amber shadow-[0_0_6px_rgba(251,191,36,0.8)]' : 'bg-slate-700'}`} />
      </button>

      <button
        onClick={() => setBuildings3DEnabled(!buildings3DEnabled)}
        className={`flex items-center gap-2 rounded border px-2 py-1.5 text-[10px] font-medium transition ${
          buildings3DEnabled
            ? 'border-cyan/40 bg-cyan/10 text-cyan'
            : 'border-slate-700/30 bg-slate-800/20 text-slate-500 hover:bg-slate-800/40'
        }`}
      >
        <Rotate3d className="h-3.5 w-3.5" /> 3D Buildings (OSM)
        <span className={`ml-auto h-2 w-2 rounded-full ${buildings3DEnabled ? 'bg-cyan shadow-[0_0_6px_rgba(34,211,238,0.8)]' : 'bg-slate-700'}`} />
      </button>
    </div>
  );
}
