import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getTvShowDetails, getTvSeason, getRecommendedTv, stillUrl } from '../api/tmdb';
import { getTvEmbedUrl } from '../api/streamApi';
import type { TvShowDetail, TvSeasonDetail, TvEpisode, TvShow } from '../types/tv';
import EmbedPlayer from '../components/EmbedPlayer';
import TvRow from '../components/TvRow';
import Loader from '../components/Loader';
import ScrollableRow from '../components/ScrollableRow';

export default function WatchTv() {
  const { tmdbId, season: seasonParam, episode: episodeParam } = useParams();
  const navigate = useNavigate();

  const season  = Number(seasonParam)  || 1;  
  const episode = Number(episodeParam) || 1;

  const [show,        setShow]        = useState<TvShowDetail | null>(null);
  const [seasonData,  setSeasonData]  = useState<TvSeasonDetail | null>(null);
  const [curEpisode,  setCurEpisode]  = useState<TvEpisode | null>(null);
  const [similar,     setSimilar]     = useState<TvShow[]>([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!tmdbId) return;
    let cancelled = false;
    setLoading(true);

    Promise.all([
      getTvShowDetails(Number(tmdbId)),
      getTvSeason(Number(tmdbId), season),
      getRecommendedTv(Number(tmdbId)),
    ]).then(([details, seas, recs]) => {
      if (cancelled) return;
      setShow(details);
      setSeasonData(seas);
      setCurEpisode(seas.episodes.find((e) => e.episodeNumber === episode) ?? seas.episodes[0] ?? null);
      setSimilar(recs.slice(0, 12));
      setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [tmdbId, season, episode]);

  if (loading) return <Loader label="Loading episode" />;

  const embedUrl = tmdbId ? getTvEmbedUrl(tmdbId, season, episode) : '';

  // Navigation helpers
  function goEpisode(s: number, e: number) {
    navigate(`/watch-tv/${tmdbId}/${s}/${e}`);
  }

  const nextEp = seasonData?.episodes.find((e) => e.episodeNumber === episode + 1);
  const prevEp = seasonData?.episodes.find((e) => e.episodeNumber === episode - 1);

  return (
    <div className="bg-void min-h-screen">
      {/* ── Player (sticky so content overlaps it on scroll) ── */}
      <div className="sticky top-16 z-0" style={{ height: 'calc(100vh - 64px)' }}>
        {tmdbId && <EmbedPlayer embedUrl={getTvEmbedUrl(tmdbId, season, episode)} title={show?.name} />}
      </div>

      {/* ── Episode info & Season List ── */}
      <div className="relative z-10 bg-void">
        <div className="px-4 sm:px-8 lg:px-14 py-6 max-w-7xl mx-auto flex flex-col gap-10">
          
          {/* Top Info Section */}
          <div className="max-w-4xl">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-muted text-sm mb-3">
              <Link to={`/tv/${tmdbId}`} className="hover:text-white transition-colors">
                {show?.name}
              </Link>
              <span>›</span>
              <span>Season {season}</span>
              <span>›</span>
              <span className="text-white">Episode {episode}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
              S{season}E{episode}{curEpisode?.name ? ` · ${curEpisode.name}` : ''}
            </h1>

            <div className="flex items-center gap-3 text-sm mb-4">
              {curEpisode?.runtime && (
                <span className="text-muted">{curEpisode.runtime} min</span>
              )}
              {curEpisode?.airDate && (
                <span className="text-muted">{curEpisode.airDate}</span>
              )}
              {curEpisode?.voteAverage && curEpisode.voteAverage > 0 && (
                <span className="text-green-400 font-semibold">★ {curEpisode.voteAverage.toFixed(1)}</span>
              )}
            </div>

            {curEpisode?.overview && (
              <p className="text-white/80 text-sm leading-relaxed">{curEpisode.overview}</p>
            )}

            {/* Prev / Next navigation */}
            <div className="flex gap-3 mt-5">
              {prevEp && (
                <button
                  onClick={() => goEpisode(season, prevEp.episodeNumber)}
                  className="flex items-center gap-2 bg-surface hover:bg-surface2 text-white text-xs font-semibold px-4 py-2 rounded-sm transition-colors border border-surface2"
                >
                  ← E{prevEp.episodeNumber}: {prevEp.name}
                </button>
              )}
              {nextEp && (
                <button
                  onClick={() => goEpisode(season, nextEp.episodeNumber)}
                  className="flex items-center gap-2 bg-white text-black text-xs font-bold px-4 py-2 rounded-sm hover:bg-white/85 transition-colors"
                >
                  Next: E{nextEp.episodeNumber} {nextEp.name} →
                </button>
              )}
            </div>
          </div>

          {/* Bottom: Episodes Section */}
          <div className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-4 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Episodes</h2>
              
              {/* Season tabs */}
              {show && show.seasons.length > 1 && (
                <div className="w-full sm:w-auto max-w-full overflow-hidden">
                  <ScrollableRow>
                    {show.seasons.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => goEpisode(s.seasonNumber, 1)}
                        className={`shrink-0 px-4 py-2 rounded-sm text-sm font-bold transition-colors ${
                          s.seasonNumber === season
                            ? 'bg-white text-black'
                            : 'bg-surface2 text-muted hover:text-white hover:bg-surface'
                        }`}
                      >
                        Season {s.seasonNumber}
                      </button>
                    ))}
                  </ScrollableRow>
                </div>
              )}
            </div>

            {/* Episode Grid */}
            <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {seasonData?.episodes.map((ep) => {
                  const isCur = ep.episodeNumber === episode;
                  return (
                    <button
                      key={ep.id}
                      onClick={() => goEpisode(season, ep.episodeNumber)}
                      className="group text-left flex flex-col gap-2 relative transition-transform duration-300 hover:scale-[1.02]"
                    >
                      <div className="relative w-full aspect-video bg-surface2 overflow-hidden rounded-sm">
                        {ep.stillPath ? (
                          <img 
                            src={stillUrl(ep.stillPath, 'w300') || undefined} 
                            alt={ep.name} 
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/20">No Image</div>
                        )}
                      
                      {/* Play Icon Overlay */}
                      <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isCur ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <div className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center bg-black/50 backdrop-blur-sm">
                          <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      </div>
                      
                      {/* Episode Number Badge */}
                      <div className="absolute top-2 left-2 bg-black/80 backdrop-blur text-white text-xs font-bold px-2 py-0.5 rounded-sm">
                        E{ep.episodeNumber}
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className={`font-semibold text-sm line-clamp-1 ${isCur ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
                          {ep.name}
                        </h3>
                        {ep.runtime && <span className="text-xs text-muted shrink-0">{ep.runtime}m</span>}
                      </div>
                      <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">
                        {ep.overview || "No description available."}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── More Like This ── */}
      {similar.length > 0 && (
        <div className="pb-16 border-t border-surface2/60 pt-6">
          <TvRow title="More Like This" shows={similar} variant="portrait" />
        </div>
      )}
      </div>
    </div>
  );
}
