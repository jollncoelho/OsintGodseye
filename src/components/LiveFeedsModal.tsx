import { useState } from 'react';
import { X, Satellite, Radio, Cloud, ExternalLink, Radio as RadioIcon } from 'lucide-react';
import type { LiveFeed } from '@/types';

const LIVE_FEEDS: LiveFeed[] = [
  {
    id: 'feed-iss',
    name: 'ISS Live — Earth from Space',
    category: 'space',
    embedUrl: null,
    externalUrl: 'https://www.youtube.com/watch?v=H999s0P1Er0',
    description: 'Live HD camera feed from the International Space Station (NASA)',
  },
  {
    id: 'feed-iss-uhf',
    name: 'ISS Live — UHF Video',
    category: 'space',
    embedUrl: null,
    externalUrl: 'https://www.youtube.com/watch?v=21X5lGlDOfg',
    description: 'Alternate ISS live stream via YouTube',
  },
  {
    id: 'feed-skynews',
    name: 'Sky News Live',
    category: 'news',
    embedUrl: null,
    externalUrl: 'https://www.youtube.com/watch?v=YoD6T9D2ckU',
    description: '24/7 UK and world news coverage',
  },
  {
    id: 'feed-france24',
    name: 'France 24 English Live',
    category: 'news',
    embedUrl: null,
    externalUrl: 'https://www.youtube.com/watch?v=L9O3xUc8kXM',
    description: 'French international news, 24/7 English broadcast',
  },
  {
    id: 'feed-aljazeera',
    name: 'Al Jazeera English Live',
    category: 'news',
    embedUrl: null,
    externalUrl: 'https://www.youtube.com/watch?v=gCNeDWCI0bo',
    description: 'Qatar-based international news network',
  },
  {
    id: 'feed-dw',
    name: 'DW News Live',
    category: 'news',
    embedUrl: null,
    externalUrl: 'https://www.youtube.com/watch?v=w8q5QLaiWkg',
    description: 'Deutsche Welle — German international news',
  },
  {
    id: 'feed-bloomberg',
    name: 'Bloomberg TV Live',
    category: 'news',
    embedUrl: null,
    externalUrl: 'https://www.bloomberg.com/live',
    description: 'Global financial and business news',
  },
];

const CATEGORY_LABELS: Record<LiveFeed['category'], { label: string; icon: React.ReactNode; color: string }> = {
  space: { label: 'SPACE', icon: <Satellite className="h-3.5 w-3.5" />, color: 'text-amber' },
  news: { label: 'NEWS', icon: <Radio className="h-3.5 w-3.5" />, color: 'text-cyan' },
  weather: { label: 'WEATHER', icon: <Cloud className="h-3.5 w-3.5" />, color: 'text-green' },
};

type Props = {
  onClose: () => void;
};

export default function LiveFeedsModal({ onClose }: Props) {
  const [activeFeed, setActiveFeed] = useState<LiveFeed | null>(null);

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex h-[85vh] w-[92vw] max-w-3xl flex-col overflow-hidden rounded-lg border border-cyan/30 bg-hud-bg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bracket tl" />
        <div className="bracket tr" />
        <div className="bracket bl" />
        <div className="bracket br" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan/20 bg-cyan/5 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Satellite className="h-4 w-4 text-cyan" />
            <span className="text-[11px] font-bold tracking-[0.2em] text-cyan">LIVE FEEDS</span>
            <span className="ml-2 flex items-center gap-1 text-[9px] text-green">
              <span className="h-1.5 w-1.5 rounded-full bg-green blink" /> STREAMING
            </span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-danger">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Feed list sidebar */}
          <div className="w-56 shrink-0 overflow-y-auto border-r border-cyan/10 bg-hud-bg/50 p-2">
            <div className="mb-2 text-[9px] font-bold tracking-[0.2em] text-cyan/60">CHANNELS</div>
            <div className="flex flex-col gap-1.5">
              {LIVE_FEEDS.map((feed) => {
                const cat = CATEGORY_LABELS[feed.category];
                const isActive = activeFeed?.id === feed.id;
                return (
                  <button
                    key={feed.id}
                    onClick={() => setActiveFeed(feed)}
                    className={`flex items-start gap-2 rounded border px-2.5 py-2 text-left transition ${
                      isActive
                        ? 'border-cyan/40 bg-cyan/10'
                        : 'border-slate-700/30 bg-slate-800/20 hover:bg-slate-800/40'
                    }`}
                  >
                    <span className={isActive ? cat.color : 'text-slate-600'}>{cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[10px] font-semibold ${isActive ? 'text-slate-200' : 'text-slate-400'}`}>
                        {feed.name}
                      </div>
                      <div className={`text-[8px] ${isActive ? 'text-cyan/60' : 'text-slate-600'}`}>
                        {cat.label}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feed viewer — tactical interception card */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {activeFeed ? (
              <>
                <div className="border-b border-cyan/10 px-4 py-2">
                  <div className="text-sm font-bold text-slate-100">{activeFeed.name}</div>
                  <div className="text-[10px] text-slate-500">{activeFeed.description}</div>
                </div>

                <div className="relative flex-1 overflow-hidden bg-black">
                  {/* Radar mire background */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8">
                    {/* Radar scope */}
                    <div className="relative h-40 w-40">
                      {/* Concentric rings */}
                      <div className="absolute inset-0 rounded-full border border-green/20" />
                      <div className="absolute inset-[15%] rounded-full border border-green/15" />
                      <div className="absolute inset-[35%] rounded-full border border-green/10" />
                      <div className="absolute inset-[55%] rounded-full border border-green/10" />
                      {/* Crosshair lines */}
                      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-green/15" />
                      <div className="absolute top-1/2 left-0 w-full h-px -translate-y-1/2 bg-green/15" />
                      {/* Sweeping radar line */}
                      <div
                        className="absolute left-1/2 top-1/2 h-20 w-px origin-left bg-gradient-to-r from-green to-transparent"
                        style={{ animation: 'radar-sweep 3s linear infinite', transformOrigin: 'left center' }}
                      />
                      {/* Center dot */}
                      <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green blink" />
                      {/* Signal blips */}
                      <div className="absolute left-[70%] top-[30%] h-1.5 w-1.5 rounded-full bg-green/60 blink" />
                      <div className="absolute left-[25%] top-[65%] h-1.5 w-1.5 rounded-full bg-green/40" />
                      <div className="absolute left-[60%] top-[75%] h-1 w-1 rounded-full bg-green/30" />
                    </div>

                    {/* Signal label */}
                    <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-green">
                      <span className="h-2 w-2 rounded-full bg-green blink" />
                      LIVE SIGNAL ACTIVE
                    </div>

                    {/* Frequency readout */}
                    <div className="text-center font-mono">
                      <div className="text-[8px] tracking-wider text-slate-600">FREQ</div>
                      <div className="text-[10px] tabular-nums text-green/70">
                        {activeFeed.category === 'space' ? '2.4 GHz · S-BAND' : activeFeed.category === 'news' ? '4.2 GHz · KU-BAND' : '1.8 GHz · L-BAND'}
                      </div>
                    </div>
                  </div>

                  {/* Scan line */}
                  <div className="scan-line" />

                  {/* Corner HUD labels */}
                  <div className="absolute left-2 top-2 text-[8px] font-bold tracking-wider text-cyan/50">
                    SIGINT // INTERCEPT MODE
                  </div>
                  <div className="absolute right-2 top-2 text-[8px] font-bold tracking-wider text-green/50">
                    {activeFeed.category.toUpperCase()}
                  </div>
                </div>

                {/* Action button */}
                <div className="border-t border-cyan/10 bg-hud-bg/80 p-3">
                  <a
                    href={activeFeed.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded border border-red-500/40 bg-red-500/15 px-4 py-3 text-[11px] font-bold tracking-wider text-red-400 transition hover:bg-red-500/25"
                  >
                    <span className="h-2 w-2 rounded-full bg-red-500 blink" />
                    OUVRIR LE FLUX EN DIRECT (NOUVEL ONGLET)
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-8">
                <RadioIcon className="h-16 w-16 text-cyan/20" />
                <div className="text-center">
                  <div className="text-sm font-bold text-slate-400">Select a channel</div>
                  <div className="mt-1 text-[10px] text-slate-600">
                    Choose a live feed from the list to begin interception
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
