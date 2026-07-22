import { useMusic } from '../context/MusicContext';
import { useLocation } from 'react-router-dom';

export default function MusicPlayer() {
  const { activeTrack, isPlaying, togglePlayPause, playNext, playPrevious, playlist, addToPlaylist, removeFromPlaylist } = useMusic();
  const location = useLocation();

  if (!location.pathname.startsWith('/music')) return null;
  if (!activeTrack) return null;

  const isInPlaylist = playlist.some((t) => t.idTrack === activeTrack.idTrack);

  return (
    <div className="fixed bottom-[64px] md:bottom-0 left-0 right-0 bg-[#181818] border-t border-[#282828] p-2 px-3 md:px-4 z-40 flex items-center justify-between">
      {/* Track Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 md:w-14 md:h-14 shrink-0 bg-neutral-800 rounded shadow-md overflow-hidden flex items-center justify-center">
          {activeTrack.strTrackThumb ? (
            <img src={activeTrack.strTrackThumb} alt={activeTrack.strTrack} className="w-full h-full object-cover" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-500">
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-white text-sm md:text-base font-semibold truncate hover:underline cursor-pointer">
            {activeTrack.strTrack}
          </span>
          <span className="text-neutral-400 text-xs md:text-sm truncate hover:underline cursor-pointer">
            {activeTrack.strArtist}
          </span>
        </div>
        
        {/* Like / Add to Playlist Button */}
        <button 
          onClick={() => isInPlaylist ? removeFromPlaylist(activeTrack.idTrack) : addToPlaylist(activeTrack)}
          className="ml-2 text-neutral-400 hover:text-white transition-colors"
        >
          {isInPlaylist ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#1ed760" className="text-[#1ed760]">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          )}
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 flex-shrink-0 ml-4">
        <button onClick={playPrevious} className="text-neutral-400 hover:text-white hidden sm:block">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="19 20 9 12 19 4 19 20"></polygon>
            <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2"></line>
          </svg>
        </button>
        <button onClick={togglePlayPause} className="w-8 h-8 flex items-center justify-center bg-white rounded-full hover:scale-105 transition-transform text-black">
          {isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="ml-1">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          )}
        </button>
        <button onClick={playNext} className="text-neutral-400 hover:text-white hidden sm:block">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 4 15 12 5 20 5 4"></polygon>
            <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2"></line>
          </svg>
        </button>
      </div>

      {/* Progress Bar (Dummy) - Desktop only */}
      <div className="hidden md:flex absolute top-0 left-0 right-0 h-1 bg-neutral-800">
        <div className="h-full bg-white group-hover:bg-[#1db954] w-1/3 rounded-full"></div>
      </div>
    </div>
  );
}
