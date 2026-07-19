import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getMovieDetails, getRecommendedMovies } from '../api/tmdb';
import { getMovieEmbedUrl } from '../api/streamApi';
import { GENRE_MAP } from '../utils/genres';
import type { Movie } from '../types/movie';
import EmbedPlayer from '../components/EmbedPlayer';
import MovieRow   from '../components/MovieRow';
import Loader     from '../components/Loader';

export default function Watch() {
  const { tmdbId } = useParams();
  const [movie,   setMovie]   = useState<(Movie & { runtime?: number }) | null>(null);
  const [similar, setSimilar] = useState<Movie[]>([]);
  const [status,  setStatus]  = useState<'loading' | 'ready' | 'error'>('loading');
  const [errMsg,  setErrMsg]  = useState('');

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

  if (status === 'loading') return <Loader label="Fetching your print" />;

  const year     = movie?.releaseDate?.slice(0, 4) ?? '';
  const matchPct = movie ? Math.round(movie.voteAverage * 10) : 0;
  const genres   = (movie?.genreIds ?? []).map((id) => GENRE_MAP[id]).filter(Boolean);
  const runtime  = movie?.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : null;
  const matchColor = matchPct >= 70 ? '#4ade80' : matchPct >= 50 ? '#facc15' : '#f87171';

  return (
    <div style={{ background: '#141414', minHeight: '100vh' }}>

      {/* ── Player (sticky so content overlaps it on scroll) ── */}
      <div className="sticky top-16 z-0" style={{ height: 'calc(100vh - 64px)' }}>
        {status === 'error' ? (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <div className="text-center px-4">
              <p className="text-netflix font-black text-4xl mb-3">Reel Not Found</p>
              <p className="text-muted text-sm mb-4">{errMsg}</p>
              <Link to="/" className="text-sm text-white/40 hover:text-white transition-colors">← Back to Home</Link>
            </div>
          </div>
        ) : (
          tmdbId && <EmbedPlayer embedUrl={getMovieEmbedUrl(tmdbId)} title={movie?.title} />
        )}
      </div>

      {/* ── Movie info & More Like This ── */}
      <div className="relative z-10 bg-void">
      {movie && status !== 'error' && (
        <div className="px-4 sm:px-8 lg:px-14 py-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left: title + description */}
            <div className="lg:col-span-2">
              <div className="flex items-center flex-wrap gap-2 mb-3">
                <span className="font-bold text-base" style={{ color: matchColor }}>{matchPct}% Match</span>
                {year && <span className="border border-white/20 text-white/50 text-xs px-1.5 py-0.5 rounded-sm">{year}</span>}
                {runtime && <span className="border border-white/20 text-white/50 text-xs px-1.5 py-0.5 rounded-sm">{runtime}</span>}
                <span className="border border-white/20 text-white/50 text-xs px-1.5 py-0.5 rounded-sm">HD</span>
                <span className="border border-white/20 text-white/50 text-xs px-1.5 py-0.5 rounded-sm">U/A 16+</span>
              </div>

              <h1 className="font-black text-white leading-tight mb-3" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
                {movie.title}
              </h1>

              <p className="text-white/75 text-sm sm:text-base leading-relaxed">{movie.overview}</p>
            </div>

            {/* Right: details + action buttons */}
            <div className="space-y-3 text-sm">
              {genres.length > 0 && (
                <div><span className="text-muted">Genres: </span><span className="text-white/75">{genres.join(', ')}</span></div>
              )}
              <div><span className="text-muted">Rating: </span><span className="text-white/75">★ {movie.voteAverage.toFixed(1)} / 10</span></div>
              {runtime && <div><span className="text-muted">Runtime: </span><span className="text-white/75">{runtime}</span></div>}

              <div className="flex gap-2 pt-2 flex-wrap">
                {(['My List', 'Rate', 'Share'] as const).map((label) => (
                  <button key={label}
                    className="flex items-center gap-1.5 text-white text-xs font-semibold px-4 py-2 rounded-sm transition-colors border border-white/10 hover:bg-white/10"
                    style={{ background: 'rgba(255,255,255,0.08)' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── More Like This — same 16:9 landscape row as the rows on Home ── */}
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
