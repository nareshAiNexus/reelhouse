import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getTrendingTv, getPopularTv, getGoatedTv,
  getAiringTodayTv, getTvGenres, backdropUrl,
} from '../api/tmdb';
import type { Genre } from '../types/movie';
import type { TvShow } from '../types/tv';
import TvRow from '../components/TvRow';
import Loader from '../components/Loader';
import ScrollableRow from '../components/ScrollableRow';

export default function TvShows() {
  const [trending,   setTrending]   = useState<TvShow[]>([]);
  const [popular,    setPopular]    = useState<TvShow[]>([]);
  const [topRated,   setTopRated]   = useState<TvShow[]>([]);
  const [airing,     setAiring]     = useState<TvShow[]>([]);
  const [genres,     setGenres]     = useState<Genre[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [heroIdx,    setHeroIdx]    = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getTrendingTv('week'),
      getPopularTv(),
      getGoatedTv(),
      getAiringTodayTv(),
      getTvGenres(),
    ]).then(([trend, pop, top, air, g]) => {
      if (cancelled) return;
      setTrending(trend);
      setPopular(pop);
      setTopRated(top);
      setAiring(air);
      setGenres(g);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Auto-rotate hero
  useEffect(() => {
    if (!trending.length) return;
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % Math.min(trending.length, 5)), 10_000);
    return () => clearInterval(t);
  }, [trending]);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) {
      setHeroIdx((i) => (i + 1) % Math.min(trending.length, 5));
    } else if (distance < -minSwipeDistance) {
      setHeroIdx((i) => (i - 1 + Math.min(trending.length, 5)) % Math.min(trending.length, 5));
    }
  };

  if (loading) return <Loader label="Loading TV Shows" />;

  const hero = trending[heroIdx];
  const matchPct = hero ? Math.round(hero.voteAverage * 10) : 0;

  return (
    <div className="bg-void min-h-screen">
      {/* ── Hero ── */}
      {hero && (
        <section 
          className="relative w-full aspect-[3/4] max-h-[85vh] sm:max-h-none sm:aspect-auto sm:h-[75vh] sm:min-h-[460px] cursor-grab active:cursor-grabbing"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <picture>
            <source media="(max-width: 639px)" srcSet={backdropUrl(hero.posterPath, 'original')} />
            <img
              key={hero.id}
              src={backdropUrl(hero.backdropPath, 'original')}
              alt={hero.name}
              className="absolute inset-0 w-full h-full object-cover select-none"
            />
          </picture>

          {/* Vignette - Desktop */}
          <div className="absolute inset-0 hidden sm:block"
            style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.5) 45%, transparent 75%)' }} />
          {/* Bottom fade - Stronger on mobile */}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, #141414 0%, #141414 10%, rgba(0,0,0,0.4) 40%, transparent 100%)' }} />
          {/* Top fade */}
          <div className="absolute inset-x-0 top-0 h-32"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)' }} />

          <div className="absolute inset-0 flex flex-col items-center justify-end px-4 pb-12 sm:items-start sm:px-10 lg:px-16 sm:pb-[8vh]">
            <div className="w-full text-center sm:text-left" style={{ maxWidth: 520 }}>
              
              {/* Trending Label (Desktop) */}
              <div className="hidden sm:flex items-center gap-2 mb-3">
                <span className="bg-netflix text-white text-[10px] font-black px-2 py-0.5 rounded-sm tracking-widest uppercase">
                  Series
                </span>
                <span className="text-white/70 text-xs font-semibold">#{heroIdx + 1} Trending Series</span>
              </div>

              <h1 className="font-black text-white leading-tight mb-2 sm:mb-4 select-none"
                  style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                {hero.name}
              </h1>

              {/* Meta chips (Desktop) */}
              <div className="hidden sm:flex items-center flex-wrap gap-2 mb-3">
                <span className="text-green-400 font-bold text-sm">{matchPct}% Match</span>
                {hero.firstAirDate && <span className="text-white/60 text-sm">{hero.firstAirDate.slice(0, 4)}</span>}
                <span className="border border-white/30 text-white/60 text-xs px-1.5 py-0.5 rounded-sm">Series</span>
              </div>

              {/* Mobile Genres overlay */}
              <div className="sm:hidden text-white/90 text-[11px] font-semibold mb-4 tracking-wide text-center">
                Exciting • Drama • Series
              </div>

              <p className="hidden sm:block text-white/80 text-sm leading-relaxed line-clamp-3 mb-5" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                {hero.overview}
              </p>

              <div className="flex gap-6 sm:gap-3 flex-row justify-center sm:justify-start items-center w-full">
                {/* My List (Mobile) */}
                <button className="sm:hidden flex flex-col items-center gap-1 text-white hover:text-white/80">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  <span className="text-[10px] font-medium">My List</span>
                </button>

                <Link to={`/tv/${hero.id}`}
                  className="flex items-center justify-center gap-2 bg-white text-black font-bold px-6 sm:px-8 py-2 sm:py-3 rounded-[4px] text-sm sm:text-base hover:bg-white/85 active:scale-95 flex-1 max-w-[140px] sm:max-w-none sm:flex-none transition-all shadow-lg shadow-black/40">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M8 5v14l11-7z"/></svg>
                  Play
                </Link>

                {/* Info (Mobile) */}
                <button className="sm:hidden flex flex-col items-center gap-1 text-white hover:text-white/80">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                  <span className="text-[10px] font-medium">Info</span>
                </button>

                <Link to={`/tv/${hero.id}`}
                  className="hidden sm:flex items-center gap-2 text-white font-semibold px-8 py-3 rounded-sm transition-all text-base border border-white/20 backdrop-blur-sm hover:bg-white/10 active:scale-95"
                  style={{ background: 'rgba(109,109,110,0.7)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="20" height="20">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8" strokeWidth="3" strokeLinecap="round"/>
                    <line x1="12" y1="12" x2="12" y2="16" strokeLinecap="round"/>
                  </svg>
                  More Info
                </Link>
              </div>
            </div>
          </div>
          {/* Manual Left/Right Navigation Arrows */}
          <button
            onClick={() => setHeroIdx((i) => (i - 1 + Math.min(trending.length, 5)) % Math.min(trending.length, 5))}
            aria-label="Previous Hero"
            className="absolute left-0 top-0 bottom-0 z-20 w-[8%] sm:w-[5%] min-w-[30px] opacity-30 sm:opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-r from-black/60 to-transparent flex items-center justify-center group/heroBtn"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-8 h-8 sm:w-10 sm:h-10 transform transition-transform group-hover/heroBtn:scale-125 group-hover/heroBtn:-translate-x-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={() => setHeroIdx((i) => (i + 1) % Math.min(trending.length, 5))}
            aria-label="Next Hero"
            className="absolute right-0 top-0 bottom-0 z-20 w-[8%] sm:w-[5%] min-w-[30px] opacity-30 sm:opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-l from-black/60 to-transparent flex items-center justify-center group/heroBtn"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-8 h-8 sm:w-10 sm:h-10 transform transition-transform group-hover/heroBtn:scale-125 group-hover/heroBtn:translate-x-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </section>
      )}

      {/* ── Rows ── */}
      <div className="relative z-10 pb-20 mt-4 sm:-mt-[60px]">
        
        {/* Genre Selector Pills */}
        <div className="px-4 sm:px-8 lg:px-14 mb-8">
          <h2 className="text-xl font-bold text-white mb-3">Browse by Genre</h2>
          <ScrollableRow>
            {genres.map((g) => (
              <Link
                key={g.id}
                to={`/genre-tv/${g.id}`}
                className="shrink-0 px-4 py-1.5 rounded-sm text-sm font-semibold transition-colors bg-surface2 hover:bg-surface text-muted hover:text-white border border-surface2"
              >
                {g.name}
              </Link>
            ))}
          </ScrollableRow>
        </div>

        <TvRow title="Trending Series"  shows={trending}  showRanks />
        <TvRow title="Goated (Top Rated)" shows={topRated} showRanks />
        <TvRow title="Popular Right Now" shows={popular} />
        <TvRow title="Airing Today"     shows={airing} />
      </div>
    </div>
  );
}
