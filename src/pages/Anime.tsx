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

  if (loading) return <Loader label="Loading Anime" />;

  const hero = series[heroIdx];
  const matchPct = hero ? Math.round(hero.voteAverage * 10) : 0;

  return (
    <div className="bg-void min-h-screen">
      {/* ═══════════════ HERO ═══════════════ */}
      {hero && (
        <section className="relative w-full" style={{ height: '75vh', minHeight: 460 }}>
          <img
            key={hero.id}
            src={backdropUrl(hero.backdropPath, 'original')}
            alt={hero.name}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Anime-specific overlay: stronger dark blue tint */}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to right, rgba(5,5,20,0.97) 0%, rgba(5,5,20,0.6) 45%, transparent 75%)' }} />
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, #141414 0%, #141414 6%, transparent 30%)' }} />
          <div className="absolute inset-x-0 top-0 h-36"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)' }} />

          <div className="absolute inset-0 flex flex-col justify-end px-4 sm:px-10 lg:px-16" style={{ paddingBottom: '8vh' }}>
            <div style={{ maxWidth: 540 }}>
              {/* Anime badge — orange, Crunchyroll-inspired */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-black px-3 py-1 rounded-sm tracking-widest uppercase"
                      style={{ background: '#F47521', color: 'white' }}>
                  ▶ Anime
                </span>
                <span className="text-white/70 text-xs font-semibold">#{heroIdx + 1} Most Popular</span>
              </div>

              <h1 className="font-black text-white leading-none mb-4"
                  style={{ fontSize: 'clamp(2.2rem, 6.5vw, 5rem)', textShadow: '0 4px 24px rgba(0,0,0,0.8)' }}>
                {hero.name}
              </h1>

              <div className="flex items-center flex-wrap gap-2 mb-3">
                <span className="text-green-400 font-bold text-sm">{matchPct}% Match</span>
                {hero.firstAirDate && (
                  <span className="text-white/60 text-sm">{hero.firstAirDate.slice(0, 4)}</span>
                )}
                <span className="border border-white/30 text-white/60 text-xs px-1.5 py-0.5 rounded-sm">Anime Series</span>
              </div>

              <p className="text-white/80 text-sm sm:text-base leading-relaxed line-clamp-3 mb-6">{hero.overview}</p>

              <div className="flex gap-3">
                <Link
                  to={`/tv/${hero.id}`}
                  className="flex items-center gap-2 font-bold px-7 py-2.5 rounded-sm text-sm transition-all shadow-lg"
                  style={{ background: '#F47521', color: 'white' }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M8 5v14l11-7z"/></svg>
                  Start Watching
                </Link>
                <Link
                  to={`/tv/${hero.id}`}
                  className="flex items-center gap-2 text-white font-semibold px-7 py-2.5 rounded-sm text-sm border border-white/20 backdrop-blur-sm hover:bg-white/10 transition-all"
                  style={{ background: 'rgba(109,109,110,0.7)' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18">
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
        </section>
      )}

      {/* ═══════════════ ROWS ═══════════════ */}
      <div className="relative z-10 pb-20" style={{ marginTop: -80 }}>
        
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
