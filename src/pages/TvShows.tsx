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

  if (loading) return <Loader label="Loading TV Shows" />;

  const hero = trending[heroIdx];
  const matchPct = hero ? Math.round(hero.voteAverage * 10) : 0;

  return (
    <div className="bg-void min-h-screen">
      {/* ── Hero ── */}
      {hero && (
        <section className="relative w-full" style={{ height: '75vh', minHeight: 460 }}>
          <img
            key={hero.id}
            src={backdropUrl(hero.backdropPath, 'original')}
            alt={hero.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.5) 45%, transparent 75%)' }} />
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, #141414 0%, #141414 5%, transparent 28%)' }} />
          <div className="absolute inset-x-0 top-0 h-32"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)' }} />

          <div className="absolute inset-0 flex flex-col justify-end px-4 sm:px-10 lg:px-16" style={{ paddingBottom: '8vh' }}>
            <div style={{ maxWidth: 520 }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-netflix text-white text-[10px] font-black px-2 py-0.5 rounded-sm tracking-widest uppercase">
                  Series
                </span>
                <span className="text-white/70 text-xs font-semibold">#{heroIdx + 1} Trending Series</span>
              </div>

              <h1 className="font-black text-white leading-none mb-4"
                  style={{ fontSize: 'clamp(2rem, 6vw, 4.5rem)', textShadow: '0 4px 24px rgba(0,0,0,0.7)' }}>
                {hero.name}
              </h1>

              <div className="flex items-center flex-wrap gap-2 mb-3">
                <span className="text-green-400 font-bold text-sm">{matchPct}% Match</span>
                {hero.firstAirDate && <span className="text-white/60 text-sm">{hero.firstAirDate.slice(0, 4)}</span>}
                <span className="border border-white/30 text-white/60 text-xs px-1.5 py-0.5 rounded-sm">Series</span>
              </div>

              <p className="text-white/80 text-sm leading-relaxed line-clamp-3 mb-5">{hero.overview}</p>

              <div className="flex gap-3">
                <Link to={`/tv/${hero.id}`}
                  className="flex items-center gap-2 bg-white text-black font-bold px-7 py-2.5 rounded-sm hover:bg-white/85 transition-all text-sm shadow-lg shadow-black/40">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M8 5v14l11-7z"/></svg>
                  Watch Now
                </Link>
                <Link to={`/tv/${hero.id}`}
                  className="flex items-center gap-2 text-white font-semibold px-7 py-2.5 rounded-sm transition-all text-sm border border-white/20 backdrop-blur-sm hover:bg-white/10"
                  style={{ background: 'rgba(109,109,110,0.7)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8" strokeWidth="3" strokeLinecap="round"/>
                    <line x1="12" y1="12" x2="12" y2="16" strokeLinecap="round"/>
                  </svg>
                  More Info
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Rows ── */}
      <div className="relative z-10 pb-20" style={{ marginTop: -60 }}>
        
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
