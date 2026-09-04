import { useState } from 'react';
import {
  Plane, Rocket, Crosshair, Ship, Anchor, Cable, Satellite, Camera, Radio,
  Layers, Eye, Thermometer, Monitor, ChevronLeft, ChevronRight, ChevronDown,
  Radar, AlertTriangle, Atom, Shield, Activity,
} from 'lucide-react';
import type { LayerKey, BaseLayerKey, ShaderKey } from '@/types';

type Props = {
  layers: Record<LayerKey, boolean>;
  toggleLayer: (k: LayerKey) => void;
  counts: Record<LayerKey, number>;
  baseLayer: BaseLayerKey;
  setBaseLayer: (k: BaseLayerKey) => void;
  shader: ShaderKey;
  setShader: (k: ShaderKey) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
};

const ENTITY_LAYERS: { key: LayerKey; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'civAircraft', label: 'Civil Aircraft', icon: <Plane className="h-4 w-4" />, color: 'text-cyan' },
  { key: 'milAircraft', label: 'Military Aircraft', icon: <Rocket className="h-4 w-4" />, color: 'text-danger' },
  { key: 'helicopters', label: 'Helicopters', icon: <Crosshair className="h-4 w-4" />, color: 'text-amber' },
  { key: 'civShips', label: 'Merchant Vessels', icon: <Ship className="h-4 w-4" />, color: 'text-cyan' },
  { key: 'milShips', label: 'Warships', icon: <Anchor className="h-4 w-4" />, color: 'text-danger' },
  { key: 'satellites', label: 'Satellites', icon: <Satellite className="h-4 w-4" />, color: 'text-amber' },
];

const ENV_LAYERS: { key: LayerKey; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'cables', label: 'Undersea Cables', icon: <Cable className="h-4 w-4" />, color: 'text-amber' },
  { key: 'cctv', label: 'CCTV / Webcams', icon: <Camera className="h-4 w-4" />, color: 'text-green' },
  { key: 'radios', label: 'Live Radios', icon: <Radio className="h-4 w-4" />, color: 'text-purple-400' },
];

const INTEL_LAYERS: { key: LayerKey; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'strategic', label: 'Strategic Points', icon: <Atom className="h-4 w-4" />, color: 'text-amber' },
  { key: 'earthquakes', label: 'Seismic (USGS)', icon: <Activity className="h-4 w-4" />, color: 'text-danger' },
];

const BASE_LAYERS: { key: BaseLayerKey; label: string; icon: React.ReactNode }[] = [
  { key: 'satellite', label: 'Sat HD', icon: <Eye className="h-3.5 w-3.5" /> },
  { key: 'dark', label: 'Tactical', icon: <Radar className="h-3.5 w-3.5" /> },
  { key: 'osm', label: 'OSM', icon: <Layers className="h-3.5 w-3.5" /> },
];

const SHADERS: { key: ShaderKey; label: string; icon: React.ReactNode }[] = [
  { key: 'standard', label: 'STD', icon: <Eye className="h-3.5 w-3.5" /> },
  { key: 'nvg', label: 'NVG', icon: <Eye className="h-3.5 w-3.5" /> },
  { key: 'thermal', label: 'FLIR', icon: <Thermometer className="h-3.5 w-3.5" /> },
  { key: 'crt', label: 'CRT', icon: <Monitor className="h-3.5 w-3.5" /> },
];

const ALL_LAYERS = [...ENTITY_LAYERS, ...ENV_LAYERS, ...INTEL_LAYERS];

function Chevron({ open }: { open: boolean }) {
  return (
    <ChevronDown
      className={`h-3.5 w-3.5 text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    />
  );
}

function LayerToggle({
  item, on, count, onToggle,
}: {
  item: { key: LayerKey; label: string; icon: React.ReactNode; color: string };
  on: boolean;
  count: number;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`group flex items-center gap-2.5 rounded border px-2.5 py-2 text-left transition ${
        on
          ? 'border-cyan/30 bg-cyan/10 hover:bg-cyan/15'
          : 'border-slate-700/30 bg-slate-800/20 hover:bg-slate-800/40'
      }`}
    >
      <span className={on ? item.color : 'text-slate-600'}>{item.icon}</span>
      <span className={`text-[11px] font-medium ${on ? 'text-slate-200' : 'text-slate-500'}`}>
        {item.label}
      </span>
      <span className="ml-auto flex items-center gap-1.5">
        {count > 0 && (
          <span className={`text-[9px] font-bold tabular-nums ${on ? 'text-cyan/80' : 'text-slate-600'}`}>
            {count}
          </span>
        )}
        <span
          className={`h-2 w-2 rounded-full ${
            on ? 'bg-cyan shadow-[0_0_6px_rgba(34,211,238,0.8)]' : 'bg-slate-700'
          }`}
        />
      </span>
    </button>
  );
}

function AccordionSection({
  title, icon, defaultOpen, children,
}: {
  title: string;
  icon: React.ReactNode;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded border border-cyan/10 bg-hud-bg/30">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-2.5 py-2 text-left transition hover:bg-cyan/5"
      >
        <span className="text-cyan/70">{icon}</span>
        <span className="flex-1 text-[10px] font-bold tracking-[0.2em] text-cyan">{title}</span>
        <Chevron open={open} />
      </button>
      {open && (
        <div className="flex flex-col gap-1.5 px-2 pb-2.5 pt-0.5">
          {children}
        </div>
      )}
    </div>
  );
}

export default function LeftSidebar({
  layers, toggleLayer, counts, baseLayer, setBaseLayer, shader, setShader, collapsed, setCollapsed,
}: Props) {
  if (collapsed) {
    return (
      <div className="glass relative z-[700] flex w-10 flex-col items-center gap-2 border-r border-cyan/20 py-3 no-select">
        <button onClick={() => setCollapsed(false)} className="text-cyan hover:text-cyan-dim" title="Expand">
          <ChevronRight className="h-4 w-4" />
        </button>
        <div className="h-px w-6 bg-cyan/20" />
        {ALL_LAYERS.map((it) => (
          <button
            key={it.key}
            onClick={() => toggleLayer(it.key)}
            className={`relative flex h-8 w-8 items-center justify-center rounded border transition ${
              layers[it.key]
                ? 'border-cyan/40 bg-cyan/15 text-cyan'
                : 'border-slate-700/40 bg-slate-800/30 text-slate-600'
            }`}
            title={it.label}
          >
            {it.icon}
            {layers[it.key] && counts[it.key] > 0 && (
              <span className="absolute -right-1 -top-1 rounded-full bg-hud-bg px-1 text-[7px] font-bold text-cyan">
                {counts[it.key]}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="glass relative z-[700] flex w-56 flex-col gap-2.5 border-r border-cyan/20 p-3 no-select">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold tracking-[0.25em] text-cyan">LAYERS</div>
        <button onClick={() => setCollapsed(true)} className="text-slate-500 hover:text-cyan" title="Collapse">
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Entity Layers accordion (open by default) */}
      <AccordionSection title="ENTITY LAYERS" icon={<Layers className="h-3.5 w-3.5" />} defaultOpen>
        {ENTITY_LAYERS.map((it) => (
          <LayerToggle
            key={it.key}
            item={it}
            on={layers[it.key]}
            count={counts[it.key] ?? 0}
            onToggle={() => toggleLayer(it.key)}
          />
        ))}
      </AccordionSection>

      {/* Environment Layers accordion (closed by default) */}
      <AccordionSection title="ENVIRONMENT" icon={<AlertTriangle className="h-3.5 w-3.5" />} defaultOpen={false}>
        {ENV_LAYERS.map((it) => (
          <LayerToggle
            key={it.key}
            item={it}
            on={layers[it.key]}
            count={counts[it.key] ?? 0}
            onToggle={() => toggleLayer(it.key)}
          />
        ))}
      </AccordionSection>

      {/* Intel Layers accordion (new) */}
      <AccordionSection title="GEOINT INTEL" icon={<Shield className="h-3.5 w-3.5" />} defaultOpen>
        {INTEL_LAYERS.map((it) => (
          <LayerToggle
            key={it.key}
            item={it}
            on={layers[it.key]}
            count={counts[it.key] ?? 0}
            onToggle={() => toggleLayer(it.key)}
          />
        ))}
      </AccordionSection>

      {/* Base Map Selector accordion (open by default) */}
      <AccordionSection title="BASE MAP" icon={<Radar className="h-3.5 w-3.5" />} defaultOpen>
        <div className="grid grid-cols-3 gap-1.5">
          {BASE_LAYERS.map((b) => (
            <button
              key={b.key}
              onClick={() => setBaseLayer(b.key)}
              className={`flex flex-col items-center gap-1 rounded border px-1 py-2 text-[9px] transition ${
                baseLayer === b.key
                  ? 'border-cyan/40 bg-cyan/15 text-cyan'
                  : 'border-slate-700/30 bg-slate-800/20 text-slate-500 hover:bg-slate-800/40'
              }`}
            >
              {b.icon}
              {b.label}
            </button>
          ))}
        </div>
      </AccordionSection>

      {/* HUD Filters accordion (closed by default) */}
      <AccordionSection title="HUD FILTERS" icon={<Monitor className="h-3.5 w-3.5" />} defaultOpen={false}>
        <div className="grid grid-cols-4 gap-1.5">
          {SHADERS.map((s) => (
            <button
              key={s.key}
              onClick={() => setShader(s.key)}
              className={`flex flex-col items-center gap-1 rounded border px-1 py-2 text-[9px] transition ${
                shader === s.key
                  ? 'border-amber/50 bg-amber/15 text-amber'
                  : 'border-slate-700/30 bg-slate-800/20 text-slate-500 hover:bg-slate-800/40'
              }`}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>
      </AccordionSection>

      <div className="mt-auto rounded border border-cyan/10 bg-hud-bg/40 p-2 text-[8px] leading-relaxed text-slate-600">
        <div className="mb-1 text-cyan/60">DATA SOURCES</div>
        OpenSky Network · Radio-Browser · Esri World Imagery · Orbital Propagation · USGS Earthquakes
      </div>
    </div>
  );
}
