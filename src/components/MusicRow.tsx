import { useRef } from 'react';
import { useMusic } from '../context/MusicContext';
import type { AudioAlbum, AudioTrack } from '../types/audio';

interface MusicRowProps {
  title: string;
  items: (AudioAlbum | AudioTrack)[];
  isTracks?: boolean;
}

export default function MusicRow({ title, items, isTracks = false }: MusicRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const { setActiveTrack, activeTrack, isPlaying, togglePlayPause } = useMusic();

  if (!items || items.length === 0) return null;

  const handlePlay = (item: AudioAlbum | AudioTrack) => {
    if (isTracks) {
      const track = item as AudioTrack;
      if (activeTrack?.idTrack === track.idTrack) {
        togglePlayPause();
      } else {
        setActiveTrack(track);
      }
    } else {
      // If it's an album, we'd ideally fetch its tracks and play the first one.
      // For now, let's create a dummy track from the album metadata to preview it.
      const album = item as AudioAlbum;
      const dummyTrack: AudioTrack = {
        idTrack: `dummy-${album.idAlbum}`,
        idAlbum: album.idAlbum,
        idArtist: album.idArtist,
        strTrack: album.strAlbum, // Play the "album"
        strAlbum: album.strAlbum,
        strArtist: album.strArtist,
        strTrackThumb: album.strAlbumThumb,
      };
      setActiveTrack(dummyTrack);
    }
  };

  return (
    <div className="mb-8 pl-4 sm:pl-8 lg:pl-14">
      <h2 className="text-white text-xl md:text-2xl font-bold mb-4 tracking-tight hover:underline cursor-pointer w-fit">
        {title}
      </h2>
      <div 
        ref={rowRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x"
        style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
      >
        {items.map((item) => {
          const id = 'idTrack' in item ? item.idTrack : item.idAlbum;
          const titleText = 'strTrack' in item ? item.strTrack : item.strAlbum;
          const subtitleText = item.strArtist;
          const thumb = 'strTrackThumb' in item ? item.strTrackThumb : (item as AudioAlbum).strAlbumThumb;
          
          const isActive = 'idTrack' in item && activeTrack?.idTrack === item.idTrack;

          return (
            <div 
              key={id} 
              className="flex-none w-[130px] md:w-[160px] snap-start group cursor-pointer bg-[#181818] hover:bg-[#282828] p-3 md:p-4 rounded-md transition-colors"
              onClick={() => handlePlay(item)}
            >
              <div className="relative w-full aspect-square mb-3 md:mb-4 bg-neutral-800 rounded shadow-lg overflow-hidden flex items-center justify-center">
                {thumb ? (
                  <img src={thumb} alt={titleText} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-500">
                    <path d="M9 18V5l12-2v13"></path>
                    <circle cx="6" cy="18" r="3"></circle>
                    <circle cx="18" cy="16" r="3"></circle>
                  </svg>
                )}
                
                {/* Play Button Overlay (Spotify Style) */}
                <div className={`absolute bottom-2 right-2 w-10 h-10 md:w-12 md:h-12 bg-[#1ed760] rounded-full flex items-center justify-center shadow-xl transition-all duration-300 transform ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'} hover:scale-105 hover:bg-[#1fdf64]`}>
                  {isActive && isPlaying ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="black">
                      <rect x="6" y="4" width="4" height="16"></rect>
                      <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="black" className="ml-1">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  )}
                </div>
              </div>
              <h3 className="text-white text-sm md:text-base font-bold truncate mb-1">
                {titleText}
              </h3>
              <p className="text-neutral-400 text-xs md:text-sm truncate font-medium">
                {subtitleText}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
