import { useState } from 'react';
import { X, Satellite, Radio, Cloud, ExternalLink, Radio as RadioIcon, Newspaper, TriangleAlert } from 'lucide-react';
import type { LiveFeed } from '@/types';

/**
 * Live feed console. News/space/weather channels embed through YouTube's
 * channel live-stream endpoint, which resolves to whatever that channel is
 * broadcasting right now — the same trick OSIRIS uses for its live-news layer.
 * Every entry also carries a direct link in case a broadcaster disables
 * embedding.
 */
const LIVE_FEEDS: LiveFeed[] = [
  {
    id: 'feed-aljazeera',
    name: 'Al Jazeera English',
    category: 'news',
    youtubeId: 'UCfiwzLy-8yKzIbsmZTzxDgw',
    externalUrl: 'https://www.aljazeera.com/live',
    description: 'Qatar-based international news network, 24/7 English broadcast',
    country: 'Qatar',
  },
  {
    id: 'feed-france24',
    name: 'France 24 English',
    category: 'news',
    youtubeId: 'UCQfwfsi5VrQ8yKZ-UWmAEFg',
    externalUrl: 'https://www.france24.com/en/live',
    description: 'French international news, 24/7 English broadcast',
    country: 'France',
  },
  {
    id: 'feed-dw',
    name: 'DW News',
    category: 'news',
    youtubeId: 'UCknLrEdhRCp1aegoMqRaCZg',
    externalUrl: 'https://www.dw.com/en/live-tv/channel-english',
    description: 'Deutsche Welle — German public international broadcaster',
    country: 'Germany',
  },
  {
    id: 'feed-skynews',
    name: 'Sky News',
    category: 'news',
    youtubeId: 'UCoMdktPbSTixAyNGwb-UYkQ',
    externalUrl: 'https://news.sky.com/watch-live',
    description: '24/7 UK and world news coverage',
    country: 'United Kingdom',
  },
  {
    id: 'feed-bloomberg',
    name: 'Bloomberg TV',
    category: 'news',
    youtubeId: 'UCIALMKvObZNtJ6AmdCLP7Lg',
    externalUrl: 'https://www.bloomberg.com/live',
    description: 'Global financial and business news',
    country: 'United States',
  },
  {
    id: 'feed-euronews',
    name: 'Euronews English',
    category: 'news',
    youtubeId: 'UCW2QcKZiU8aUGg4yxCIditg',
    externalUrl: 'https://www.euronews.com/live',
    description: 'European rolling news in English',
    country: 'Europe',
  },
  {
    id: 'feed-nasa',
    name: 'NASA Live / ISS',
    category: 'space',
    youtubeId: 'UCLA_DiR1FfKNvjuUpBHmylQ',
    externalUrl: 'https://www.nasa.gov/live',
    description: 'NASA TV — ISS views, launches and mission coverage',
    country: 'United States',
  },
  {
    id: 'feed-esa',
    name: 'European Space Agency',
    category: 'space',
    youtubeId: 'UCIBaDdAbGlFDeS33shmlD0A',
    externalUrl: 'https://www.esa.int/ESA_Multimedia/ESA_Web_TV',
    description: 'ESA launches, mission control and Earth observation',
    country: 'Europe',
  },
  {
    id: 'feed-nasa-iss-hd',
    name: 'ISS HD Earth Viewing',
    category: 'space',
    youtubeId: 'P9C25Un7xaM',
    externalUrl: 'https://eol.jsc.nasa.gov/ESRS/HDEV/',
    description: 'High-definition camera pointed at Earth from the ISS',
    country: 'Orbit',
  },
  {
    id: 'feed-accuweather',
    name: 'AccuWeather NOW',
    category: 'weather',
    youtubeId: 'UCX4LIBCqOZ0JhIrPPZ0wXFw',
    externalUrl: 'https://www.accuweather.com/en/accuweather-now',
    description: 'Rolling global weather coverage',
    country: 'United States',
  },
];

const CATEGORY_LABELS: Record<LiveFeed['category'], { label: string; icon: React.ReactNode; color: string }> = {
  space: { label: 'SPACE', icon: <Satellite className="h-3.5 w-3.5" />, color: 'text-amber' },
  news: { label: 'NEWS', icon: <Newspaper className="h-3.5 w-3.5" />, color: 'text-cyan' },
  weather: { label: 'WEATHER', icon: <Cloud className="h-3.5 w-3.5" />, color: 'text-green' },
  conflict: { label: 'CONFLICT', icon: <TriangleAlert className="h-3.5 w-3.5" />, color: 'text-danger' },
};

/** A bare 11-char id is a video; anything longer is treated as a channel. */
function embedUrl(feed: LiveFeed): string | null {
  if (!feed.youtubeId) return null;
  const id = feed.youtubeId;
  return id.length === 11
    ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&rel=0`
    : `https://www.youtube.com/embed/live_stream?channel=${id}&autoplay=1&mute=1&rel=0`;
}

type Props = { onClose: () => void };

export default function LiveFeedsModal({ onClose }: Props) {
  const [activeFeed, setActiveFeed] = useState<LiveFeed | null>(null);

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative flex h-[85vh] w-[92vw] max-w-4xl flex-col overflow-hidden rounded-lg border border-cyan/30 bg-hud-bg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bracket tl" />
        <div className="bracket tr" />
        <div className="bracket bl" />
        <div className="bracket br" />

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
                      isActive ? 'border-cyan/40 bg-cyan/10' : 'border-slate-700/30 bg-slate-800/20 hover:bg-slate-800/40'
                    }`}
                  >
                    <span className={isActive ? cat.color : 'text-slate-600'}>{cat.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className={`text-[10px] font-semibold ${isActive ? 'text-slate-200' : 'text-slate-400'}`}>{feed.name}</div>
                      <div className={`text-[8px] ${isActive ? 'text-cyan/60' : 'text-slate-600'}`}>
                        {cat.label}{feed.country ? ` · ${feed.country}` : ''}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            {activeFeed ? (
              <>
                <div className="border-b border-cyan/10 px-4 py-2">
                  <div className="text-sm font-bold text-slate-100">{activeFeed.name}</div>
                  <div className="text-[10px] text-slate-500">{activeFeed.description}</div>
                </div>

                <div className="relative flex-1 bg-black">
                  <iframe
                    key={activeFeed.id}
                    title={activeFeed.name}
                    src={embedUrl(activeFeed) ?? undefined}
                    className="absolute inset-0 h-full w-full"
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                  <div className="scan-line pointer-events-none opacity-30" />
                  <div className="pointer-events-none absolute left-2 top-2 text-[8px] font-bold tracking-wider text-cyan/50">
                    SIGINT // INTERCEPT MODE
                  </div>
                  <div className="pointer-events-none absolute right-2 top-2 text-[8px] font-bold tracking-wider text-green/60">
                    {CATEGORY_LABELS[activeFeed.category].label}
                  </div>
                </div>

                <div className="border-t border-cyan/10 bg-hud-bg/80 p-3">
                  <a
                    href={activeFeed.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded border border-red-500/40 bg-red-500/15 px-4 py-2.5 text-[11px] font-bold tracking-wider text-red-400 transition hover:bg-red-500/25"
                  >
                    <span className="h-2 w-2 rounded-full bg-red-500 blink" />
                    OPEN DIRECT SOURCE
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-8">
                <RadioIcon className="h-16 w-16 text-cyan/20" />
                <div className="text-center">
                  <div className="text-sm font-bold text-slate-400">Select a channel</div>
                  <div className="mt-1 text-[10px] text-slate-600">Choose a live feed from the list to begin interception</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
