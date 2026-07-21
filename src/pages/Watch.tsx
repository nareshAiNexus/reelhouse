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
    <div className="pt-16" style={{ background: '#141414', minHeight: '100vh' }}>

      {/* ── Player (sticky so content overlaps it on scroll) ── */}
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
      <div className="relative z-10 bg-void">
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

              {/* Mobile Play / Download Buttons */}
              <div className="flex flex-col gap-2.5 mb-4">
                <button className="flex items-center justify-center gap-2 bg-white text-black font-bold py-2 sm:py-3 rounded-[4px] text-sm sm:text-base hover:bg-white/90 transition-colors w-full">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M8 5v14l11-7z"/></svg>
                  Play
                </button>
                <button className="flex items-center justify-center gap-2 bg-[#2b2b2b] text-white font-bold py-2 sm:py-3 rounded-[4px] text-sm sm:text-base hover:bg-[#333] transition-colors w-full">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Download
                </button>
              </div>

              <p className="text-white/85 text-sm sm:text-base leading-relaxed mb-4">{movie.overview}</p>

              {/* Mobile Actions: My List, Rate, Share */}
              <div className="flex gap-8 mb-6 sm:mb-0">
                {(['My List', 'Rate', 'Share'] as const).map((label, idx) => (
                  <button key={label} className="flex flex-col items-center gap-1.5 text-white/70 hover:text-white transition-colors">
                    {idx === 0 && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>}
                    {idx === 1 && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>}
                    {idx === 2 && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>}
                    <span className="text-[10px] font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: details */}
            <div className="space-y-2 text-xs sm:text-sm">
              {genres.length > 0 && (
                <div><span className="text-[#8c8c8c]">Genres: </span><span className="text-white/85">{genres.join(', ')}</span></div>
              )}
              <div><span className="text-[#8c8c8c]">Rating: </span><span className="text-white/85">★ {movie.voteAverage.toFixed(1)} / 10</span></div>
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
