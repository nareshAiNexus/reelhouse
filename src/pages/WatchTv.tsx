import { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getTvShowDetails, getTvSeason, getRecommendedTv, stillUrl } from '../api/tmdb';
import { getTvEmbedUrl } from '../api/streamApi';
import type { TvShowDetail, TvSeasonDetail, TvEpisode, TvShow } from '../types/tv';
import EmbedPlayer from '../components/EmbedPlayer';
import TvRow from '../components/TvRow';
import Loader from '../components/Loader';
import ScrollableRow from '../components/ScrollableRow';
import { useWatchTimer } from '../hooks/useWatchTimer';
import { useAuth } from '../context/AuthContext';
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '../firebase/db';

export default function WatchTv() {
  const { tmdbId, season: seasonParam, episode: episodeParam } = useParams();
  const navigate = useNavigate();

  const season  = Number(seasonParam)  || 1;  
  const episode = Number(episodeParam) || 1;

  const { user } = useAuth();
  const [show,        setShow]        = useState<TvShowDetail | null>(null);
  const [seasonData,  setSeasonData]  = useState<TvSeasonDetail | null>(null);
  const [curEpisode,  setCurEpisode]  = useState<TvEpisode | null>(null);
  const [similar,     setSimilar]     = useState<TvShow[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [inList,      setInList]      = useState(false);
  const [listLoading, setListLoading] = useState(false);

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

  // Check watchlist status whenever user or show changes
  useEffect(() => {
    if (!user || !tmdbId) { setInList(false); return; }
    isInWatchlist(user.uid, Number(tmdbId), 'tv')
      .then(setInList)
      .catch(() => setInList(false));
  }, [user, tmdbId]);

  // 5-minute watch history timer
  useWatchTimer({
    tmdbId:      Number(tmdbId ?? 0),
    mediaType:   'tv',
    title:       show?.name ?? '',
    posterPath:  show?.posterPath ?? null,
    season,
    episode,
    episodeName: curEpisode?.name ?? null,
  });

  const toggleWatchlist = useCallback(async () => {
    if (!user || !show || !tmdbId) return;
    setListLoading(true);
    try {
      if (inList) {
        await removeFromWatchlist(user.uid, Number(tmdbId), 'tv');
        setInList(false);
      } else {
        await addToWatchlist(user.uid, {
          tmdbId:    Number(tmdbId),
          mediaType: 'tv',
          title:     show.name,
          posterPath: show.posterPath,
          addedAt:   Date.now(),
        });
        setInList(true);
      }
    } catch {
      // non-critical
    } finally {
      setListLoading(false);
    }
  }, [user, show, tmdbId, inList]);

  if (loading) return <Loader label="Loading episode" />;

  const embedUrl = tmdbId ? getTvEmbedUrl(tmdbId, season, episode) : '';

  // Navigation helpers
  function goEpisode(s: number, e: number) {
    navigate(`/watch-tv/${tmdbId}/${s}/${e}`);
  }

  const nextEp = seasonData?.episodes.find((e) => e.episodeNumber === episode + 1);
  const prevEp = seasonData?.episodes.find((e) => e.episodeNumber === episode - 1);

  return (
    <div className="bg-void min-h-screen pt-16">
      {/* ── Player (sticky so content overlaps it on scroll) ── */}
      <div className="sticky top-16 z-20 w-full aspect-video sm:aspect-auto sm:h-[calc(100vh-64px)] bg-black shadow-xl">
        {tmdbId && <EmbedPlayer embedUrl={getTvEmbedUrl(tmdbId, season, episode)} title={show?.name} />}
      </div>

      {/* ── Episode info & Season List ── */}
      <div className="relative z-30 bg-void">
        <div className="px-4 sm:px-8 lg:px-14 py-4 sm:py-6 max-w-7xl mx-auto flex flex-col gap-8 sm:gap-10">
          
          {/* Top Info Section */}
          <div className="max-w-4xl">
            {/* Breadcrumb (Desktop mainly, or very small on mobile) */}
            <div className="flex flex-wrap items-center gap-2 text-muted text-xs sm:text-sm mb-2 sm:mb-3">
              <Link to={`/tv/${tmdbId}`} className="hover:text-white transition-colors">
                {show?.name}
              </Link>
              <span>›</span>
              <span>Season {season}</span>
              <span>›</span>
              <span className="text-white">Episode {episode}</span>
            </div>

            <h1 className="text-xl sm:text-3xl font-black text-white mb-2 leading-tight">
              S{season}E{episode}{curEpisode?.name ? ` · ${curEpisode.name}` : ''}
            </h1>

            <div className="flex items-center flex-wrap gap-2 text-xs sm:text-sm font-semibold mb-4 text-[#8c8c8c]">
              {curEpisode?.voteAverage && curEpisode.voteAverage > 0 && (
                <span className="text-green-400">★ {curEpisode.voteAverage.toFixed(1)}</span>
              )}
              {curEpisode?.airDate && (
                <span className="text-white/60">{curEpisode.airDate}</span>
              )}
              <span className="bg-white/10 text-white/70 px-1 rounded-sm text-[10px] sm:text-xs">U/A 16+</span>
              {curEpisode?.runtime && (
                <span className="text-white/60">{curEpisode.runtime}m</span>
              )}
              <span className="border border-white/20 text-white/50 text-[10px] sm:text-xs px-1 rounded-sm">HD</span>
            </div>

            {/* Play / My List Buttons */}
            <div className="flex flex-col gap-2.5 mb-4">
              <button className="flex items-center justify-center gap-2 bg-white text-black font-bold py-2 sm:py-3 rounded-[4px] text-sm sm:text-base hover:bg-white/90 transition-colors w-full">
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M8 5v14l11-7z"/></svg>
                Play
              </button>
              {user && (
                <button
                  onClick={toggleWatchlist}
                  disabled={listLoading}
                  id="rh-tv-watchlist-toggle"
                  className={`flex items-center justify-center gap-2 font-bold py-2 sm:py-3 rounded-[4px] text-sm sm:text-base transition-colors w-full ${
                    inList
                      ? 'bg-white/15 text-white hover:bg-white/20 border border-white/20'
                      : 'bg-[#2b2b2b] text-white hover:bg-[#333]'
                  }`}
                >
                  {inList ? (
                    <><svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>In My List</>
                  ) : (
                    <><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>My List</>
                  )}
                </button>
              )}
            </div>

            {curEpisode?.overview && (
              <p className="text-white/85 text-sm sm:text-base leading-relaxed mb-4">{curEpisode.overview}</p>
            )}

            {/* Share */}
            <div className="flex gap-8 mb-6 sm:mb-0">
              <button className="flex flex-col items-center gap-1.5 text-white/70 hover:text-white transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                <span className="text-[10px] font-medium">Share</span>
              </button>
              {!user && (
                <div className="ml-2 p-3 rounded border border-white/10 bg-white/5 text-xs text-white/50">
                  <Link to="/auth" className="text-netflix hover:underline font-semibold">Sign in</Link> to save to My List
                </div>
              )}
            </div>

            {/* Prev / Next navigation */}
            <div className="flex gap-3 mt-5">
              {prevEp && (
                <button
                  onClick={() => goEpisode(season, prevEp.episodeNumber)}
                  className="flex items-center gap-2 bg-surface hover:bg-surface2 text-white text-xs font-semibold px-4 py-2 rounded-sm transition-colors border border-surface2"
                >
                  ← E{prevEp.episodeNumber}
                </button>
              )}
              {nextEp && (
                <button
                  onClick={() => goEpisode(season, nextEp.episodeNumber)}
                  className="flex items-center gap-2 bg-white text-black text-xs font-bold px-4 py-2 rounded-sm hover:bg-white/85 transition-colors"
                >
                  Next: E{nextEp.episodeNumber} →
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
