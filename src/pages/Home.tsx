import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getGenres, getMoviesByGenre, getNowPlaying,
  getGoatedMixed, getTrending, backdropUrl,
} from '../api/tmdb';
import type { Genre, Movie } from '../types/movie';
import MovieRow from '../components/MovieRow';
import Loader from '../components/Loader';

export default function Home() {
  const [trending,    setTrending]    = useState<Movie[]>([]);
  const [topRated,    setTopRated]    = useState<Movie[]>([]);
  const [nowPlaying,  setNowPlaying]  = useState<Movie[]>([]);
  const [genres,      setGenres]      = useState<Genre[]>([]);
  const [genreMovies, setGenreMovies] = useState<Record<number, Movie[]>>({});
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [heroIdx,     setHeroIdx]     = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [trend, top, now, genreList] = await Promise.all([
          getTrending('week'), getGoatedMixed(), getNowPlaying(), getGenres(),
        ]);
        if (cancelled) return;
        setTrending(trend);
        setTopRated(top);
        setNowPlaying(now);
        setGenres(genreList);

        const featured = genreList.slice(0, 8);
        const perGenre = await Promise.all(featured.map((g) => getMoviesByGenre(g.id)));
        if (cancelled) return;
        const map: Record<number, Movie[]> = {};
        featured.forEach((g, i) => (map[g.id] = perGenre[i]));
        setGenreMovies(map);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load movies.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Auto-rotate hero every 10 s
  useEffect(() => {
    if (!trending.length) return;
    const t = setInterval(
      () => setHeroIdx((i) => (i + 1) % Math.min(trending.length, 5)),
      10_000,
    );
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
      // Swiped left -> next
      setHeroIdx((i) => (i + 1) % Math.min(trending.length, 5));
    } else if (distance < -minSwipeDistance) {
      // Swiped right -> prev
      setHeroIdx((i) => (i - 1 + Math.min(trending.length, 5)) % Math.min(trending.length, 5));
    }
  };

  if (loading) return <Loader label="Loading ReelHouse" />;
  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-netflix font-black text-5xl mb-3">Oops!</p>
          <p className="text-muted text-sm">{error}</p>
          <p className="text-muted text-xs mt-3">
            Check that <code className="text-netflix">VITE_TMDB_API_KEY</code> is set in your <code>.env</code>.<br />
            (If you are in India or another restricted region, your ISP might be blocking TMDB. Try using a VPN or changing your DNS).
          </p>
        </div>
      </div>
    );

  const hero    = trending[heroIdx];
  const matchPct = hero ? Math.round(hero.voteAverage * 10) : 0;
  const heroYear = hero?.releaseDate?.slice(0, 4) ?? '';

  return (
    <div className="bg-void">

      {/* ══════════════════════════════════════════
          HERO BILLBOARD  — exactly like Netflix
      ══════════════════════════════════════════ */}
      {hero && (
        <section 
          className="relative w-full aspect-[3/4] max-h-[85vh] sm:max-h-none sm:aspect-auto sm:h-[75vh] sm:min-h-[460px] cursor-grab active:cursor-grabbing"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >

          {/* Picture element for mobile poster / desktop backdrop */}
          <picture>
            <source media="(max-width: 639px)" srcSet={backdropUrl(hero.posterPath, 'original')} />
            <img
              key={hero.id}
              src={backdropUrl(hero.backdropPath, 'original')}
              alt={hero.title}
              className="absolute inset-0 w-full h-full object-cover select-none"
              style={{ transition: 'opacity 0.8s ease' }}
            />
          </picture>

          {/* 1. Vignette from left (black → transparent) - Desktop only */}
          <div className="absolute inset-0 hidden sm:block"
            style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 40%, transparent 70%)' }}
          />

          {/* 2. Bottom fade into void (Stronger on mobile) */}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, #141414 0%, #141414 10%, rgba(0,0,0,0.4) 40%, transparent 100%)' }}
          />

          {/* 3. Top fade behind navbar */}
          <div className="absolute inset-x-0 top-0 h-36"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)' }}
          />

          {/* ── Hero content ── */}
          <div className="absolute inset-0 flex flex-col items-center justify-end px-4 pb-12 sm:items-start sm:px-10 lg:px-16 sm:pb-[8vh]">
            <div className="w-full text-center sm:text-left" style={{ maxWidth: 560 }}>

              {/* Trending label (Desktop only) */}
              <div className="hidden sm:flex items-center gap-2 mb-3">
                <span className="bg-netflix text-white text-[10px] font-black px-2 py-0.5 rounded-sm tracking-widest uppercase">
                  Trending
                </span>
                <span className="text-white/70 text-xs font-semibold">
                  #{heroIdx + 1} in Movies Today
                </span>
              </div>

              {/* Movie title */}
              <h1
                className="font-black text-white leading-tight mb-2 sm:mb-4 select-none"
                style={{
                  fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
                  textShadow: '0 2px 10px rgba(0,0,0,0.8)',
                  letterSpacing: '-0.5px',
                }}
              >
                {hero.title}
              </h1>

              {/* Meta chips (Desktop only) */}
              <div className="hidden sm:flex items-center flex-wrap gap-2 mb-3">
                <span className="text-green-400 font-bold text-sm">{matchPct}% Match</span>
                {heroYear && <span className="text-white/60 text-sm">{heroYear}</span>}
                <span className="border border-white/30 text-white/60 text-xs px-1.5 py-0.5 rounded-sm">HD</span>
                <span className="border border-white/30 text-white/60 text-xs px-1.5 py-0.5 rounded-sm">U/A 16+</span>
              </div>

              {/* Mobile Genres overlay */}
              <div className="sm:hidden text-white/90 text-[11px] font-semibold mb-4 tracking-wide text-center">
                Exciting • Blockbuster • Action
              </div>

              {/* Description (Desktop only) */}
              <p className="hidden sm:block text-white/85 text-sm sm:text-base leading-relaxed mb-6 line-clamp-3"
                 style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                {hero.overview}
              </p>

              {/* CTA buttons */}
              <div className="flex gap-6 sm:gap-3 flex-row justify-center sm:justify-start items-center w-full">
                {/* My List (Mobile) */}
                <button className="sm:hidden flex flex-col items-center gap-1 text-white hover:text-white/80">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  <span className="text-[10px] font-medium">My List</span>
                </button>

                <Link
                  to={`/watch/${hero.id}`}
                  className="flex items-center justify-center gap-2 bg-white text-black font-bold
                             px-6 sm:px-8 py-2 sm:py-3 rounded-[4px] text-sm sm:text-base
                             hover:bg-white/85 active:scale-95 flex-1 max-w-[140px] sm:max-w-none sm:flex-none
                             transition-all duration-150 shadow-lg shadow-black/40"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  Play
                </Link>

                {/* Info (Mobile) */}
                <button className="sm:hidden flex flex-col items-center gap-1 text-white hover:text-white/80">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                  <span className="text-[10px] font-medium">Info</span>
                </button>

                {/* More Info (Desktop) */}
                <button
                  className="hidden sm:flex items-center gap-2 text-white font-semibold
                             px-8 py-3 rounded-sm text-base
                             hover:bg-white/10 active:scale-95
                             transition-all duration-150
                             border border-white/20 backdrop-blur-sm"
                  style={{ background: 'rgba(109,109,110,0.7)' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="20" height="20">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="8" strokeWidth="3" strokeLinecap="round"/>
                    <line x1="12" y1="12" x2="12" y2="16" strokeLinecap="round"/>
                  </svg>
                  More Info
                </button>
              </div>
            </div>
          </div>

          {/* Hero dot indicators */}
          <div className="absolute bottom-6 right-8 flex gap-1.5 z-20">
            {Array.from({ length: Math.min(trending.length, 5) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroIdx(i)}
                className={`h-[3px] rounded-full transition-all duration-300 ${
                  i === heroIdx ? 'w-7 bg-white' : 'w-3 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Hero ${i + 1}`}
              />
            ))}
          </div>

          {/* Maturity badge (right edge, Netflix-style) */}
          <div className="absolute right-0 bottom-24 hidden sm:flex items-center gap-2
                          border-l-4 border-white/50 bg-black/40 pl-4 pr-6 py-1.5 z-20">
            <span className="text-white/70 text-sm font-medium">U/A 16+</span>
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

      {/* ══════════════════════════════════════════
          CONTENT ROWS — start right after hero
      ══════════════════════════════════════════ */}
      <div className="relative z-10 pb-20 mt-4 sm:-mt-[100px]">
        <MovieRow title="Trending Now"       movies={trending}   showRanks />
        <MovieRow title="Goated (Top Rated)" movies={topRated}   showRanks />
        <MovieRow title="Now Playing"        movies={nowPlaying} />
        {genres.slice(0, 8).map((g) => (
          <MovieRow
            key={g.id}
            title={g.name}
            movies={genreMovies[g.id] ?? []}
            viewAllHref={`/genre/${g.id}`}
          />
        ))}
      </div>
    </div>
  );
}
