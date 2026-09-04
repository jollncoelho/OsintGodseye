import { useEffect, useRef, useState } from 'react';
import {
  Play, Pause, Volume2, VolumeX, Radio as RadioIcon, Terminal, X, ChevronUp, ChevronDown,
  Eye, Thermometer, Monitor,
} from 'lucide-react';
import type { LogEntry, RadioStation } from '@/types';

type Props = {
  logs: LogEntry[];
  activeRadio: RadioStation | null;
  onClearRadio: () => void;
};

export default function BottomBar({ logs, activeRadio, onClearRadio }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'warn' | 'alert'>('all');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!activeRadio) {
      setPlaying(false);
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = activeRadio.url;
    audio.volume = volume;
    audio.play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  }, [activeRadio]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = muted ? 0 : volume;
  }, [volume, muted]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !activeRadio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  };

  return (
    <div className="relative z-[700] border-t border-cyan/25 bg-black/85 no-select">
      <audio ref={audioRef} crossOrigin="anonymous" />

      <div className="flex items-center gap-3 px-3 py-1.5">
        {/* Log toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 rounded border border-cyan/20 bg-cyan/5 px-2 py-1 text-[10px] font-semibold text-cyan transition hover:bg-cyan/15"
        >
          <Terminal className="h-3.5 w-3.5" />
          TACTICAL LOG
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
        </button>

        {/* Log level filters */}
        <div className="flex items-center gap-1">
          {([
            { key: 'all', label: 'ALL' },
            { key: 'info', label: 'INFO' },
            { key: 'warn', label: 'WARN' },
            { key: 'alert', label: 'ALERT' },
          ] as const).map((f) => (
            <button
              key={f.key}
              onClick={() => setLogFilter(f.key)}
              className={`rounded border px-1.5 py-1 text-[8px] font-bold transition ${
                logFilter === f.key
                  ? f.key === 'alert'
                    ? 'border-danger/40 bg-danger/10 text-danger'
                    : f.key === 'warn'
                      ? 'border-amber/40 bg-amber/10 text-amber'
                      : 'border-cyan/40 bg-cyan/10 text-cyan'
                  : 'border-slate-700/30 bg-slate-800/20 text-slate-500 hover:bg-slate-800/40'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Radio player */}
        <div className="flex flex-1 items-center gap-2.5 rounded border border-purple-400/20 bg-purple-400/5 px-2.5 py-1">
          <RadioIcon className="h-3.5 w-3.5 text-purple-400" />
          <span className="text-[9px] font-bold tracking-wider text-purple-400">RADIO:</span>
          {activeRadio ? (
            <>
              <span className="max-w-[180px] truncate text-[10px] text-slate-300">{activeRadio.name}</span>
              <span className="text-[9px] text-slate-600">{activeRadio.country}</span>
              <button onClick={togglePlay} className="ml-1 text-purple-400 hover:text-purple-300">
                {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => setMuted((m) => !m)} className="text-purple-400 hover:text-purple-300">
                {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
                className="h-1 w-20 cursor-pointer accent-purple-400"
              />
              <span className="text-[8px] text-slate-600">{activeRadio.bitrate}k</span>
              {playing && (
                <span className="flex items-center gap-1 text-[8px] text-green">
                  <span className="h-1.5 w-1.5 rounded-full bg-green blink" /> LIVE
                </span>
              )}
              <button onClick={onClearRadio} className="ml-auto text-slate-600 hover:text-danger">
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <span className="text-[10px] text-slate-600">Click a radio marker to tune in</span>
          )}
        </div>
      </div>

      {/* Log stream */}
      {expanded && (
        <div className="h-28 overflow-y-auto border-t border-cyan/10 bg-black/60 px-3 py-1.5 slide-up">
          <div className="space-y-0.5">
            {logs.length === 0 && (
              <div className="text-[10px] text-slate-600">No events. Awaiting telemetry...</div>
            )}
            {logs.filter((log) => logFilter === 'all' || log.level === logFilter).map((log) => (
              <div key={log.id} className="flex items-start gap-2 text-[10px] leading-tight">
                <span className="text-slate-600 tabular-nums">{log.time}</span>
                <span
                  className={
                    log.level === 'alert'
                      ? 'text-danger font-semibold'
                      : log.level === 'warn'
                        ? 'text-amber'
                        : 'text-cyan'
                  }
                >
                  [{log.level.toUpperCase()}]
                </span>
                <span className="text-slate-400">{log.msg}</span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
