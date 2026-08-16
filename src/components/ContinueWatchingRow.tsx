import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchHistory, removeHistoryEntry } from '../firebase/db';
import type { HistoryEntry } from '../types/user';
import { posterUrl } from '../api/tmdb';

/**
 * Netflix-style "Continue Watching" scrollable row.
 * Only rendered when the user is signed in and has history entries.
 */
export default function ContinueWatchingRow() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const rowRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchHistory(user.uid)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [user]);

  async function handleRemove(e: React.MouseEvent, entryId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    setHistory((prev) => prev.filter((h) => h.entryId !== entryId));
    await removeHistoryEntry(user.uid, entryId);
  }

  function scrollRow(dir: 'left' | 'right') {
    if (!rowRef.current) return;
    const amount = rowRef.current.clientWidth * 0.75;
    rowRef.current.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' });
  }

  if (!user || loading || history.length === 0) return null;

  return (
    <section className="px-4 sm:px-8 lg:px-14 py-2 mb-2 group/cwrow">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm sm:text-base font-bold text-white hover:text-white/80 transition-colors cursor-default">
          Continue Watching
        </h2>
        <Link
          to="/profile"
          className="text-xs text-white/40 hover:text-white transition-colors font-medium opacity-0 group-hover/cwrow:opacity-100 transition-opacity duration-200"
        >
          View all
        </Link>
      </div>

      {/* Scroll container */}
      <div className="relative">
        {/* Left arrow */}
        <button
          onClick={() => scrollRow('left')}
          aria-label="Scroll left"
          className="absolute left-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center
                     bg-gradient-to-r from-void to-transparent
                     opacity-0 group-hover/cwrow:opacity-100 transition-opacity"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Cards */}
        <div
          ref={rowRef}
          className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
          style={{ scrollbarWidth: 'none' }}
        >
          {history.map((entry) => {
            const href =
              entry.mediaType === 'tv' && entry.season && entry.episode
                ? `/watch-tv/${entry.tmdbId}/${entry.season}/${entry.episode}`
                : `/watch/${entry.tmdbId}`;

            const subtitle =
              entry.mediaType === 'tv' && entry.season && entry.episode
                ? `S${entry.season} E${entry.episode}${entry.episodeName ? ` · ${entry.episodeName}` : ''}`
                : null;

            const dateStr = new Date(entry.watchedAt).toLocaleDateString(undefined, {
              month: 'short', day: 'numeric',
            });

            return (
              <div
                key={entry.entryId}
                className="relative flex-none group/card cursor-pointer"
                style={{ width: 'clamp(140px, 30vw, 180px)' }}
                onClick={() => navigate(href)}
              >
                {/* Poster */}
                <div className="relative rounded-sm overflow-hidden aspect-[2/3] bg-surface2">
                  <img
                    src={posterUrl(entry.posterPath, 'w342')}
                    alt={entry.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                    loading="lazy"
                  />
                  {/* Dark overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/40 transition-colors duration-300" />

                  {/* Play button on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                      <svg viewBox="0 0 24 24" fill="#141414" className="w-5 h-5 translate-x-0.5">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={(e) => handleRemove(e, entry.entryId)}
                    aria-label="Remove from history"
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 border border-white/20
                               flex items-center justify-center text-white/60 hover:text-white hover:bg-black/90
                               opacity-0 group-hover/card:opacity-100 transition-all duration-200 z-10"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>

                  {/* TV badge */}
                  {entry.mediaType === 'tv' && (
                    <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white/80 text-[9px] font-bold px-1 py-0.5 rounded-sm">
                      SERIES
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="mt-1.5 px-0.5">
                  <p className="text-white text-xs font-semibold line-clamp-1 leading-tight">
                    {entry.title}
                  </p>
                  {subtitle && (
                    <p className="text-white/50 text-[10px] mt-0.5 line-clamp-1">{subtitle}</p>
                  )}
                  <p className="text-white/30 text-[10px] mt-0.5">{dateStr}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scrollRow('right')}
          aria-label="Scroll right"
          className="absolute right-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center
                     bg-gradient-to-l from-void to-transparent
                     opacity-0 group-hover/cwrow:opacity-100 transition-opacity"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  );
}
