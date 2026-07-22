import { useEffect, useState } from 'react';
import { getTrendingAlbums, getTrendingSingles, getTop10Tracks } from '../api/audioDb';
import type { AudioAlbum, AudioTrack } from '../types/audio';
import MusicRow from '../components/MusicRow';
import { useMusic } from '../context/MusicContext';
import Loader from '../components/Loader';

export default function Music() {
  const [trendingAlbums, setTrendingAlbums] = useState<AudioAlbum[]>([]);
  const [trendingSingles, setTrendingSingles] = useState<AudioTrack[]>([]);
  const [topColdplay, setTopColdplay] = useState<AudioTrack[]>([]);
  const [topTaylorSwift, setTopTaylorSwift] = useState<AudioTrack[]>([]);
  const [topTheWeeknd, setTopTheWeeknd] = useState<AudioTrack[]>([]);
  const [topDrake, setTopDrake] = useState<AudioTrack[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { playlist } = useMusic();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [albums, singles, coldplay, taylor, weeknd, drake] = await Promise.all([
          getTrendingAlbums(),
          getTrendingSingles(),
          getTop10Tracks('coldplay'),
          getTop10Tracks('taylor swift'),
          getTop10Tracks('the weeknd'),
          getTop10Tracks('drake'),
        ]);
        if (cancelled) return;
        setTrendingAlbums(albums);
        setTrendingSingles(singles);
        setTopColdplay(coldplay);
        setTopTaylorSwift(taylor);
        setTopTheWeeknd(weeknd);
        setTopDrake(drake);
      } catch (err) {
        console.error('Failed to load music', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Loader label="Loading Music" />;

  return (
    <div className="bg-[#121212] min-h-screen pb-32 pt-6">
      {/* Header */}
      <div className="px-4 sm:px-8 lg:px-14 mb-8 flex justify-between items-center">
        <h1 className="text-white text-3xl font-bold tracking-tight">Music</h1>
        <div className="flex gap-4 text-neutral-400">
          <button className="hover:text-white transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
          <button className="hover:text-white transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Your Library (Playlist) - 2 Column Grid for top items */}
      {playlist.length > 0 && (
        <div className="px-4 sm:px-8 lg:px-14 mb-10">
          <h2 className="text-white text-xl md:text-2xl font-bold mb-4 tracking-tight">Your Library</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {playlist.slice(0, 8).map((track) => (
              <div 
                key={track.idTrack} 
                className="bg-white/10 hover:bg-white/20 transition-colors rounded-md overflow-hidden flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-14 h-14 md:w-16 md:h-16 shrink-0 bg-neutral-800 shadow-lg">
                  {track.strTrackThumb ? (
                    <img src={track.strTrackThumb} alt={track.strTrack} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-500">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9 18V5l12-2v13"></path>
                        <circle cx="6" cy="18" r="3"></circle>
                        <circle cx="18" cy="16" r="3"></circle>
                      </svg>
                    </div>
                  )}
                </div>
                <span className="text-white text-sm font-bold truncate pr-3">{track.strTrack}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Content Rows */}
      {trendingAlbums.length > 0 && <MusicRow title="Trending Albums" items={trendingAlbums} />}
      {trendingSingles.length > 0 && <MusicRow title="Trending Singles" items={trendingSingles} isTracks={true} />}
      {topTaylorSwift.length > 0 && <MusicRow title="Top 10: Taylor Swift" items={topTaylorSwift} isTracks={true} />}
      {topTheWeeknd.length > 0 && <MusicRow title="Top 10: The Weeknd" items={topTheWeeknd} isTracks={true} />}
      {topColdplay.length > 0 && <MusicRow title="Top 10: Coldplay" items={topColdplay} isTracks={true} />}
      {topDrake.length > 0 && <MusicRow title="Top 10: Drake" items={topDrake} isTracks={true} />}
    </div>
  );
}
