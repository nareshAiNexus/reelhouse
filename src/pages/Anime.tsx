import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAnimeSeries, getAnimeMovies, getGoatedAnime, getTvGenres, backdropUrl } from '../api/tmdb';
import type { TvShow } from '../types/tv';
import type { Genre, Movie } from '../types/movie';
import TvRow from '../components/TvRow';
import MovieRow from '../components/MovieRow';
import Loader from '../components/Loader';
import ScrollableRow from '../components/ScrollableRow';

export default function Anime() {
  const [series,   setSeries]   = useState<TvShow[]>([]);
  const [movies,   setMovies]   = useState<Movie[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [heroIdx,  setHeroIdx]  = useState(0);

  const [goated,   setGoated]   = useState<TvShow[]>([]);
  const [genres,   setGenres]   = useState<Genre[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getAnimeSeries(1),
      getAnimeMovies(1),
      getGoatedAnime(),
      getTvGenres(),
    ]).then(([s, m, g, tvGenres]) => {
      if (cancelled) return;
      setSeries(s);
      setMovies(m);
      setGoated(g);
      setGenres(tvGenres);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Auto-rotate hero
  useEffect(() => {
    if (!series.length) return;
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % Math.min(series.length, 5)), 9_000);
    return () => clearInterval(t);
  }, [series]);

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
      setHeroIdx((i) => (i + 1) % Math.min(series.length, 5));
    } else if (distance < -minSwipeDistance) {
      setHeroIdx((i) => (i - 1 + Math.min(series.length, 5)) % Math.min(series.length, 5));
    }
  };

  if (loading) return <Loader label="Loading Anime" />;

  const hero = series[heroIdx];
  const matchPct = hero ? Math.round(hero.voteAverage * 10) : 0;

  return (
    <div className="bg-void min-h-screen">
      {/* ═══════════════ HERO ═══════════════ */}
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

          {/* Anime-specific overlay: stronger dark blue tint (Desktop only) */}
          <div className="absolute inset-0 hidden sm:block"
            style={{ background: 'linear-gradient(to right, rgba(5,5,20,0.97) 0%, rgba(5,5,20,0.6) 45%, transparent 75%)' }} />
          {/* Bottom fade - Stronger on mobile */}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, #141414 0%, #141414 10%, rgba(0,0,0,0.4) 40%, transparent 100%)' }} />
          {/* Top fade */}
          <div className="absolute inset-x-0 top-0 h-36"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)' }} />

          {/* ── Hero content ── */}
          <div className="absolute inset-0 flex flex-col items-center justify-end px-4 pb-12 sm:items-start sm:px-10 lg:px-16 sm:pb-[8vh]">
            <div className="w-full text-center sm:text-left" style={{ maxWidth: 540 }}>
              {/* Anime badge — orange, Crunchyroll-inspired (Desktop) */}
              <div className="hidden sm:flex items-center gap-2 mb-4">
                <span className="text-xs font-black px-3 py-1 rounded-sm tracking-widest uppercase"
                      style={{ background: '#F47521', color: 'white' }}>
                  ▶ Anime
                </span>
                <span className="text-white/70 text-xs font-semibold">#{heroIdx + 1} Most Popular</span>
              </div>

              <h1 className="font-black text-white leading-tight mb-2 sm:mb-4 select-none"
                  style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                {hero.name}
              </h1>

              {/* Meta chips (Desktop) */}
              <div className="hidden sm:flex items-center flex-wrap gap-2 mb-3">
                <span className="text-green-400 font-bold text-sm">{matchPct}% Match</span>
                {hero.firstAirDate && (
                  <span className="text-white/60 text-sm">{hero.firstAirDate.slice(0, 4)}</span>
                )}
                <span className="border border-white/30 text-white/60 text-xs px-1.5 py-0.5 rounded-sm">Anime Series</span>
              </div>

              {/* Mobile Genres overlay */}
              <div className="sm:hidden text-white/90 text-[11px] font-semibold mb-4 tracking-wide text-center">
                Exciting • Fantasy • Anime
              </div>

              <p className="hidden sm:block text-white/80 text-sm leading-relaxed mb-6 line-clamp-3 max-w-lg" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                {hero.overview}
              </p>
              
              <div className="flex gap-6 sm:gap-3 flex-row justify-center sm:justify-start items-center w-full">
                {/* My List (Mobile) */}
                <button className="sm:hidden flex flex-col items-center gap-1 text-white hover:text-white/80">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  <span className="text-[10px] font-medium">My List</span>
                </button>

                <Link
                  to={`/tv/${hero.id}`}
                  className="flex items-center justify-center gap-2 font-bold px-6 sm:px-8 py-2 sm:py-3 rounded-[4px] text-sm sm:text-base hover:opacity-90 active:scale-95 flex-1 max-w-[140px] sm:max-w-none sm:flex-none transition-all shadow-lg shadow-black/40"
                  style={{ background: '#F47521', color: 'white' }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M8 5v14l11-7z"/></svg>
                  Play
                </Link>

                {/* Info (Mobile) */}
                <button className="sm:hidden flex flex-col items-center gap-1 text-white hover:text-white/80">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                  <span className="text-[10px] font-medium">Info</span>
                </button>

                {/* More Info (Desktop) */}
                <Link
                  to={`/tv/${hero.id}`}
                  className="hidden sm:flex items-center gap-2 text-white font-semibold px-8 py-3 rounded-sm text-base border border-white/20 backdrop-blur-sm hover:bg-white/10 active:scale-95 transition-all"
                  style={{ background: 'rgba(109,109,110,0.7)' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="20" height="20">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8" strokeWidth="3" strokeLinecap="round"/>
                    <line x1="12" y1="12" x2="12" y2="16" strokeLinecap="round"/>
                  </svg>
                  More Info
                </Link>
              </div>
            </div>
          </div>

          {/* Hero dots */}
          <div className="absolute bottom-6 right-8 flex gap-1.5">
            {Array.from({ length: Math.min(series.length, 5) }).map((_, i) => (
              <button key={i} onClick={() => setHeroIdx(i)}
                className={`h-[3px] rounded-full transition-all duration-300 ${
                  i === heroIdx ? 'w-7 bg-[#F47521]' : 'w-3 bg-white/40 hover:bg-white/60'
                }`} aria-label={`Anime ${i + 1}`} />
            ))}
          </div>
          {/* Manual Left/Right Navigation Arrows */}
          <button
            onClick={() => setHeroIdx((i) => (i - 1 + Math.min(series.length, 5)) % Math.min(series.length, 5))}
            aria-label="Previous Hero"
            className="absolute left-0 top-0 bottom-0 z-20 w-[8%] sm:w-[5%] min-w-[30px] opacity-30 sm:opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-r from-black/60 to-transparent flex items-center justify-center group/heroBtn"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-8 h-8 sm:w-10 sm:h-10 transform transition-transform group-hover/heroBtn:scale-125 group-hover/heroBtn:-translate-x-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={() => setHeroIdx((i) => (i + 1) % Math.min(series.length, 5))}
            aria-label="Next Hero"
            className="absolute right-0 top-0 bottom-0 z-20 w-[8%] sm:w-[5%] min-w-[30px] opacity-30 sm:opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-l from-black/60 to-transparent flex items-center justify-center group/heroBtn"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-8 h-8 sm:w-10 sm:h-10 transform transition-transform group-hover/heroBtn:scale-125 group-hover/heroBtn:translate-x-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </section>
      )}

      {/* ═══════════════ ROWS ═══════════════ */}
      <div className="relative z-10 pb-20 mt-4 sm:-mt-[80px]">
        
        {/* Genre Selector Pills */}
        <div className="px-4 sm:px-8 lg:px-14 mb-8 pt-6">
          <h2 className="text-xl font-bold text-white mb-3">Browse by Genre</h2>
          <ScrollableRow>
            {genres.map((g) => (
              <Link
                key={g.id}
                to={`/genre-anime/${g.id}`}
                className="shrink-0 px-4 py-1.5 rounded-sm text-sm font-semibold transition-colors bg-surface2 hover:bg-surface text-muted hover:text-white border border-surface2"
              >
                {g.name}
              </Link>
            ))}
          </ScrollableRow>
        </div>

        {/* Anime Series section header */}
        <div className="px-4 sm:px-8 lg:px-14 pt-4 pb-2 flex items-center gap-3">
          <span className="w-1 h-6 rounded-full" style={{ background: '#F47521' }} />
          <h2 className="text-xl font-black text-white tracking-wide">Anime Series</h2>
        </div>
        <TvRow title="Popular Anime Series" shows={series} showRanks />
        <TvRow title="Goated (Top Rated)" shows={goated} showRanks />
        <TvRow title="All Anime Series"     shows={series.slice(5)} variant="portrait" />

        {movies.length > 0 && (
          <>
            <div className="px-4 sm:px-8 lg:px-14 pt-6 pb-2 flex items-center gap-3">
              <span className="w-1 h-6 rounded-full" style={{ background: '#F47521' }} />
              <h2 className="text-xl font-black text-white tracking-wide">Anime Movies</h2>
            </div>
            <MovieRow title="Popular Anime Films" movies={movies} />
            <MovieRow title="All Anime Movies" movies={movies.slice(5)} variant="portrait" />
          </>
        )}
      </div>
    </div>
  );
}
