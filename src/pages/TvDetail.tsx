import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getTvShowDetails, getTvSeason, getRecommendedTv,
  backdropUrl, posterUrl, stillUrl,
} from '../api/tmdb';
import type { TvShowDetail, TvSeasonDetail, TvEpisode } from '../types/tv';
import type { TvShow } from '../types/tv';
import { GENRE_MAP } from '../utils/genres';
import TvRow from '../components/TvRow';
import Loader from '../components/Loader';
import ScrollableRow from '../components/ScrollableRow';

export default function TvDetail() {
  const { tmdbId } = useParams();
  const [show,           setShow]           = useState<TvShowDetail | null>(null);
  const [season,         setSeason]         = useState<TvSeasonDetail | null>(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [similar,        setSimilar]        = useState<TvShow[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [epLoading,      setEpLoading]      = useState(false);

  // Initial load
  useEffect(() => {
    if (!tmdbId) return;
    let cancelled = false;
    setLoading(true);

    getTvShowDetails(Number(tmdbId)).then(async (details) => {
      if (cancelled) return;
      setShow(details);

      const firstSeason = details.seasons[0]?.seasonNumber ?? 1;
      setSelectedSeason(firstSeason);

      const [seasonData, recs] = await Promise.all([
        getTvSeason(Number(tmdbId), firstSeason),
        getRecommendedTv(Number(tmdbId)),
      ]);
      if (cancelled) return;
      setSeason(seasonData);
      setSimilar(recs.slice(0, 12));
    }).finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [tmdbId]);

  // Season change
  useEffect(() => {
    if (!tmdbId || !show) return;
    let cancelled = false;
    setEpLoading(true);

    getTvSeason(Number(tmdbId), selectedSeason)
      .then((s) => { if (!cancelled) setSeason(s); })
      .finally(() => { if (!cancelled) setEpLoading(false); });

    return () => { cancelled = true; };
  }, [selectedSeason, tmdbId, show]);

  if (loading) return <Loader label="Loading series" />;
  if (!show) return <div className="pt-24 text-center text-muted">Series not found.</div>;

  const year    = show.firstAirDate?.slice(0, 4) ?? '';
  const match   = Math.round(show.voteAverage * 10);
  const genres  = show.genreIds.map((id) => GENRE_MAP[id]).filter(Boolean).join(', ');
  const firstEp = show.seasons[0];

  return (
    <div className="bg-void min-h-screen">
      {/* ════════════════════ HERO ════════════════════ */}
      <section className="relative w-full" style={{ height: '70vh', minHeight: 400 }}>
        <img
          src={backdropUrl(show.backdropPath, 'original')}
          alt={show.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 50%, transparent 80%)' }} />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, #141414 0%, #141414 8%, transparent 35%)' }} />
        <div className="absolute inset-x-0 top-0 h-28"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)' }} />

        <div className="absolute inset-0 flex items-end px-4 sm:px-10 lg:px-16 pb-16 gap-6">
          {/* Poster thumbnail */}
          <div className="hidden sm:block w-32 shrink-0 rounded-md overflow-hidden shadow-2xl border border-white/10">
            <img src={posterUrl(show.posterPath, 'w342')} alt={show.name} className="w-full h-full object-cover" />
          </div>

          {/* Info */}
          <div style={{ maxWidth: 560 }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-netflix text-white text-[10px] font-black px-2 py-0.5 rounded-sm tracking-widest">SERIES</span>
              {show.status && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-sm ${
                  show.status === 'Returning Series' ? 'text-green-400 border border-green-400/50' : 'text-muted border border-muted/40'
                }`}>{show.status}</span>
              )}
            </div>

            <h1 className="font-black text-white leading-none mb-3"
                style={{ fontSize: 'clamp(2rem, 5.5vw, 4rem)', textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
              {show.name}
            </h1>

            <div className="flex items-center flex-wrap gap-2 mb-3">
              <span className="text-green-400 font-bold">{match}% Match</span>
              {year && <span className="text-white/60 text-sm">{year}</span>}
              <span className="border border-white/30 text-white/60 text-xs px-1.5 py-0.5">
                {show.numberOfSeasons} Season{show.numberOfSeasons !== 1 ? 's' : ''}
              </span>
              <span className="border border-white/30 text-white/60 text-xs px-1.5 py-0.5">
                {show.numberOfEpisodes} Episodes
              </span>
            </div>

            <p className="text-white/75 text-sm leading-relaxed line-clamp-2 mb-5">{show.overview}</p>

            {/* CTA */}
            <div className="flex gap-3">
              {firstEp && (
                <Link
                  to={`/watch-tv/${show.id}/${firstEp.seasonNumber}/1`}
                  className="flex items-center gap-2 bg-white text-black font-bold px-6 py-2.5 rounded-sm hover:bg-white/85 transition-all text-sm"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M8 5v14l11-7z"/></svg>
                  Play S{firstEp.seasonNumber}E1
                </Link>
              )}
              {genres && (
                <div className="flex items-center text-white/60 text-xs self-center">
                  {genres}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ EPISODES ════════════════════ */}
      <div className="px-4 sm:px-8 lg:px-14 py-8 max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Episodes</h2>

          {/* Season tabs */}
          {show.seasons.length > 1 && (
            <div className="w-full sm:w-auto max-w-full overflow-hidden">
              <ScrollableRow>
                {show.seasons.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSeason(s.seasonNumber)}
                    className={`shrink-0 px-4 py-2 rounded-sm text-sm font-bold transition-colors ${
                      selectedSeason === s.seasonNumber
                        ? 'bg-white text-black'
                        : 'bg-surface2 text-muted hover:text-white hover:bg-surface'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </ScrollableRow>
            </div>
          )}
        </div>

        {/* Episode Grid */}
        {epLoading ? (
          <Loader label="Loading episodes" />
        ) : season && season.episodes.length > 0 ? (
          <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {season.episodes.map((ep) => (
                <EpisodeCard key={ep.id} episode={ep} showId={show.id} />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-muted text-sm py-8 text-center">No episodes available for this season.</p>
        )}
      </div>

      {/* ════════════════════ SIMILAR SHOWS ════════════════════ */}
      {similar.length > 0 && (
        <div className="pb-16">
          <TvRow title="More Like This" shows={similar} variant="portrait" />
        </div>
      )}
    </div>
  );
}

/* ─── Episode Card (Grid style) ─── */
function EpisodeCard({ episode, showId }: { episode: TvEpisode; showId: number }) {
  const href = `/watch-tv/${showId}/${episode.seasonNumber}/${episode.episodeNumber}`;

  return (
    <Link
      to={href}
      className="group text-left flex flex-col gap-2 relative transition-transform duration-300 hover:scale-[1.02]"
    >
      <div className="relative w-full aspect-video bg-surface2 overflow-hidden rounded-sm">
        {episode.stillPath ? (
          <img 
            src={stillUrl(episode.stillPath, 'w300') || undefined} 
            alt={episode.name} 
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20">No Image</div>
        )}
        
        {/* Play Icon Overlay */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <svg viewBox="0 0 24 24" fill="white" width="48" height="48" className="drop-shadow-lg scale-75 group-hover:scale-100 transition-transform duration-300">
            <circle cx="12" cy="12" r="10" fill="rgba(0,0,0,0.5)" />
            <path d="M10 8v8l6-4z" />
          </svg>
        </div>
        
        {/* Episode Number Badge */}
        <div className="absolute top-2 left-2 bg-black/70 px-2 py-0.5 rounded-sm backdrop-blur-sm">
          <span className="text-white font-bold text-xs">E{episode.episodeNumber}</span>
        </div>
      </div>
      
      <div className="flex flex-col flex-1 w-full mt-1">
        <div className="flex items-start justify-between gap-2 mb-1 w-full">
          <h3 className="text-sm font-bold text-white leading-tight line-clamp-1">{episode.name}</h3>
          {episode.runtime ? (
            <span className="text-xs text-white/50 shrink-0">{episode.runtime}m</span>
          ) : null}
        </div>
        <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">
          {episode.overview || "No description available."}
        </p>
      </div>
    </Link>
  );
}
