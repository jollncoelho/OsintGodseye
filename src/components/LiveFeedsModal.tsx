import { useState } from 'react';
import { X, Satellite, Radio, Cloud, ExternalLink, AlertCircle } from 'lucide-react';
import type { LiveFeed } from '@/types';

const LIVE_FEEDS: LiveFeed[] = [
  {
    id: 'feed-iss',
    name: 'ISS Live — Earth from Space',
    category: 'space',
    embedUrl: 'https://www.youtube-nocookie.com/embed/live_stream?channel=UCkJyv4LzU54Mh_uN6pL5UfA',
    externalUrl: 'https://www.youtube.com/watch?v=21X5lGlDOfg',
    description: 'Live HD camera feed from the International Space Station',
  },
  {
    id: 'feed-skynews',
    name: 'Sky News Live',
    category: 'news',
    embedUrl: 'https://www.youtube-nocookie.com/embed/live_stream?channel=UCoMdktPbSTkAy7bn0QqS7Og',
    externalUrl: 'https://www.youtube.com/watch?v=YoD6T9D2ckU',
    description: '24/7 UK and world news coverage',
  },
  {
    id: 'feed-france24',
    name: 'France 24 English Live',
    category: 'news',
    embedUrl: 'https://www.youtube-nocookie.com/embed/live_stream?channel=UCQfwfsi5VrQ8yK3qJf2dLrQ',
    externalUrl: 'https://www.youtube.com/watch?v=L9O3xUc8kXM',
    description: 'French international news, 24/7 English broadcast',
  },
  {
    id: 'feed-aljazeera',
    name: 'Al Jazeera English Live',
    category: 'news',
    embedUrl: 'https://www.youtube-nocookie.com/embed/live_stream?channel=UCNye-wNBqNb5h4kO9wO5mUQ',
    externalUrl: 'https://www.youtube.com/watch?v=gCNeDWCI0bo',
    description: 'Qatar-based international news network',
  },
  {
    id: 'feed-dw',
    name: 'DW News Live',
    category: 'news',
    embedUrl: 'https://www.youtube-nocookie.com/embed/live_stream?channel=UCknLrEdhRCp1a-goAD_mVgOQ',
    externalUrl: 'https://www.youtube.com/watch?v=J5c8n3k3k3k',
    description: 'Deutsche Welle — German international news',
  },
  {
    id: 'feed-bloomberg',
    name: 'Bloomberg TV Live',
    category: 'news',
    embedUrl: null,
    externalUrl: 'https://www.bloomberg.com/live',
    description: 'Global financial and business news (embed restricted — open external)',
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

  const selectFeed = (feed: LiveFeed) => {
    setActiveFeed(feed);
  };

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
                    onClick={() => selectFeed(feed)}
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

          {/* Feed viewer */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {activeFeed ? (
              <>
                <div className="border-b border-cyan/10 px-4 py-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-100">{activeFeed.name}</div>
                      <div className="text-[10px] text-slate-500">{activeFeed.description}</div>
                    </div>
                    {/* Always-visible fallback button */}
                    <a
                      href={activeFeed.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded border border-cyan/40 bg-cyan/15 px-3 py-1.5 text-[10px] font-bold text-cyan transition hover:bg-cyan/25"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> OPEN IN NEW TAB
                    </a>
                  </div>
                </div>
                <div className="relative flex-1 overflow-hidden bg-black">
                  {activeFeed.embedUrl ? (
                    <iframe
                      key={activeFeed.id}
                      src={activeFeed.embedUrl}
                      title={activeFeed.name}
                      className="absolute inset-0 h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
                      <AlertCircle className="h-12 w-12 text-amber/60" />
                      <div className="text-center">
                        <div className="text-sm font-bold text-slate-300">Embed Restricted</div>
                        <div className="mt-1 text-[10px] text-slate-500">
                          This channel does not allow iframe embedding.
                          Open it directly in a new tab.
                        </div>
                      </div>
                      <a
                        href={activeFeed.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded border border-cyan/40 bg-cyan/15 px-4 py-2.5 text-[11px] font-bold text-cyan transition hover:bg-cyan/25"
                      >
                        <ExternalLink className="h-4 w-4" /> OPEN EXTERNAL STREAM
                      </a>
                    </div>
                  )}
                  <div className="scan-line" />
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-8">
                <Satellite className="h-16 w-16 text-cyan/20" />
                <div className="text-center">
                  <div className="text-sm font-bold text-slate-400">Select a channel</div>
                  <div className="mt-1 text-[10px] text-slate-600">
                    Choose a live feed from the list to begin streaming
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
