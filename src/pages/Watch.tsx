import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getMovieDetails, getRecommendedMovies, posterUrl } from '../api/tmdb';
import { getMovieEmbedUrl } from '../api/streamApi';
import { GENRE_MAP } from '../utils/genres';
import type { Movie } from '../types/movie';
import EmbedPlayer  from '../components/EmbedPlayer';
import MovieRow     from '../components/MovieRow';
import Loader       from '../components/Loader';
import { useWatchTimer } from '../hooks/useWatchTimer';
import { useAuth } from '../context/AuthContext';
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '../firebase/db';

export default function Watch() {
  const { tmdbId } = useParams();
  const { user }   = useAuth();

  const [movie,      setMovie]      = useState<(Movie & { runtime?: number }) | null>(null);
  const [similar,    setSimilar]    = useState<Movie[]>([]);
  const [status,     setStatus]     = useState<'loading' | 'ready' | 'error'>('loading');
  const [errMsg,     setErrMsg]     = useState('');
  const [inList,     setInList]     = useState(false);
  const [listLoading, setListLoading] = useState(false);

  // ── Load movie details ────────────────────────────────────────────────────
  useEffect(() => {
    if (!tmdbId) return;
    let cancelled = false;
    setStatus('loading');

    Promise.all([
      getMovieDetails(Number(tmdbId)),
      getRecommendedMovies(Number(tmdbId)),
    ]).then(([details, recs]) => {
      if (cancelled) return;
      setMovie(details);
      setSimilar(recs.slice(0, 24));
      setStatus('ready');
    }).catch((e: any) => {
      if (!cancelled) { setErrMsg(e?.message ?? 'Could not load.'); setStatus('error'); }
    });

    return () => { cancelled = true; };
  }, [tmdbId]);

  // ── Check watchlist status ────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !tmdbId) { setInList(false); return; }
    isInWatchlist(user.uid, Number(tmdbId), 'movie')
      .then(setInList)
      .catch(() => setInList(false));
  }, [user, tmdbId]);

  // ── 5-minute watch timer (writes history) ────────────────────────────────
  useWatchTimer({
    tmdbId:    Number(tmdbId ?? 0),
    mediaType: 'movie',
    title:     movie?.title ?? '',
    posterPath: movie?.posterPath ?? null,
  });

  // ── Watchlist toggle ─────────────────────────────────────────────────────
  const toggleWatchlist = useCallback(async () => {
    if (!user || !movie || !tmdbId) return;
    setListLoading(true);
    try {
      if (inList) {
        await removeFromWatchlist(user.uid, Number(tmdbId), 'movie');
        setInList(false);
      } else {
        await addToWatchlist(user.uid, {
          tmdbId:    Number(tmdbId),
          mediaType: 'movie',
          title:     movie.title,
          posterPath: movie.posterPath,
          addedAt:   Date.now(),
        });
        setInList(true);
      }
    } catch {
      // silently ignore — UI will reflect previous state
    } finally {
      setListLoading(false);
    }
  }, [user, movie, tmdbId, inList]);

  if (status === 'loading') return <Loader label="Fetching your print" />;

  const year      = movie?.releaseDate?.slice(0, 4) ?? '';
  const matchPct  = movie ? Math.round(movie.voteAverage * 10) : 0;
  const genres    = (movie?.genreIds ?? []).map((id) => GENRE_MAP[id]).filter(Boolean);
  const runtime   = movie?.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : null;
  const matchColor = matchPct >= 70 ? '#4ade80' : matchPct >= 50 ? '#facc15' : '#f87171';

  return (
    <div className="pt-16" style={{ background: '#141414', minHeight: '100vh' }}>

      {/* ── Player ── */}
      <div className="sticky top-16 z-20 w-full aspect-video sm:aspect-auto sm:h-[calc(100vh-64px)] bg-black shadow-xl">
        {status === 'error' ? (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <div className="text-center px-4">
              <p className="text-netflix font-black text-2xl sm:text-4xl mb-3">Reel Not Found</p>
              <p className="text-muted text-xs sm:text-sm mb-4">{errMsg}</p>
              <Link to="/" className="text-xs sm:text-sm text-white/40 hover:text-white transition-colors">← Back to Home</Link>
            </div>
          </div>
        ) : (
          tmdbId && <EmbedPlayer embedUrl={getMovieEmbedUrl(tmdbId)} title={movie?.title} />
        )}
      </div>

      {/* ── Movie info & More Like This ── */}
      <div className="relative z-30 bg-void">
        {movie && status !== 'error' && (
          <div className="px-4 sm:px-8 lg:px-14 py-4 sm:py-8 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

              {/* Left: title + description */}
              <div className="lg:col-span-2">
                <h1 className="font-black text-white leading-tight mb-2 sm:mb-3" style={{ fontSize: 'clamp(1.5rem, 5vw, 3rem)' }}>
                  {movie.title}
                </h1>

                <div className="flex items-center flex-wrap gap-2 mb-4 text-xs sm:text-sm font-semibold">
                  <span style={{ color: matchColor }}>{matchPct}% Match</span>
                  {year && <span className="text-white/60">{year}</span>}
                  <span className="bg-white/10 text-white/70 px-1 rounded-sm text-[10px] sm:text-xs">U/A 16+</span>
                  {runtime && <span className="text-white/60">{runtime}</span>}
                  <span className="border border-white/20 text-white/50 text-[10px] sm:text-xs px-1 rounded-sm">HD</span>
                </div>

                {/* Play / My List buttons */}
                <div className="flex flex-col gap-2.5 mb-4">
                  <button className="flex items-center justify-center gap-2 bg-white text-black font-bold py-2 sm:py-3 rounded-[4px] text-sm sm:text-base hover:bg-white/90 transition-colors w-full">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M8 5v14l11-7z"/></svg>
                    Play
                  </button>

                  {/* My List — only shown if user is logged in */}
                  {user && (
                    <button
                      onClick={toggleWatchlist}
                      disabled={listLoading}
                      id="rh-watchlist-toggle"
                      className={`flex items-center justify-center gap-2 font-bold py-2 sm:py-3 rounded-[4px] text-sm sm:text-base transition-colors w-full ${
                        inList
                          ? 'bg-white/15 text-white hover:bg-white/20 border border-white/20'
                          : 'bg-[#2b2b2b] text-white hover:bg-[#333]'
                      }`}
                    >
                      {inList ? (
                        <>
                          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                          In My List
                        </>
                      ) : (
                        <>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          My List
                        </>
                      )}
                    </button>
                  )}
                </div>

                <p className="text-white/85 text-sm sm:text-base leading-relaxed mb-4">{movie.overview}</p>

                {/* Poster thumbnail (mobile) */}
                {movie.posterPath && (
                  <div className="sm:hidden mb-4">
                    <img
                      src={posterUrl(movie.posterPath, 'w342')}
                      alt={movie.title}
                      className="w-28 rounded shadow-lg"
                    />
                  </div>
                )}

                {/* Share row */}
                <div className="flex gap-8 mb-6 sm:mb-0">
                  <button className="flex flex-col items-center gap-1.5 text-white/70 hover:text-white transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    <span className="text-[10px] font-medium">Share</span>
                  </button>
                </div>
              </div>

              {/* Right: details */}
              <div className="space-y-2 text-xs sm:text-sm">
                {genres.length > 0 && (
                  <div><span className="text-[#8c8c8c]">Genres: </span><span className="text-white/85">{genres.join(', ')}</span></div>
                )}
                <div><span className="text-[#8c8c8c]">Rating: </span><span className="text-white/85">★ {movie.voteAverage.toFixed(1)} / 10</span></div>
                {!user && (
                  <div className="mt-4 p-3 rounded border border-white/10 bg-white/5">
                    <p className="text-white/50 text-xs">
                      <Link to="/auth" className="text-netflix hover:underline font-semibold">Sign in</Link> to save to My List and track watch history.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* More Like This */}
        {similar.length > 0 && (
          <>
            <div className="border-t border-white/5 mx-4 sm:mx-8 lg:mx-14" />
            <div className="pb-16">
              <MovieRow title="More Like This" movies={similar} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
