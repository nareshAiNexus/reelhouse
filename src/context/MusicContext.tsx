import { createContext, useContext, useState, ReactNode } from 'react';
import type { AudioTrack } from '../types/audio';

interface MusicContextType {
  activeTrack: AudioTrack | null;
  isPlaying: boolean;
  playlist: AudioTrack[];
  setActiveTrack: (track: AudioTrack) => void;
  togglePlayPause: () => void;
  addToPlaylist: (track: AudioTrack) => void;
  removeFromPlaylist: (trackId: string) => void;
  playNext: () => void;
  playPrevious: () => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: ReactNode }) {
  const [activeTrack, setActiveTrackState] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState<AudioTrack[]>([]);

  const setActiveTrack = (track: AudioTrack) => {
    setActiveTrackState(track);
    setIsPlaying(true);
    // Automatically add to playlist if it's not there
    if (!playlist.find((t) => t.idTrack === track.idTrack)) {
      setPlaylist((prev) => [...prev, track]);
    }
  };

  const togglePlayPause = () => {
    if (activeTrack) {
      setIsPlaying((p) => !p);
    }
  };

  const addToPlaylist = (track: AudioTrack) => {
    setPlaylist((prev) => {
      if (prev.find((t) => t.idTrack === track.idTrack)) return prev;
      return [...prev, track];
    });
  };

  const removeFromPlaylist = (trackId: string) => {
    setPlaylist((prev) => prev.filter((t) => t.idTrack !== trackId));
  };

  const playNext = () => {
    if (!activeTrack || playlist.length === 0) return;
    const currentIndex = playlist.findIndex((t) => t.idTrack === activeTrack.idTrack);
    const nextIndex = (currentIndex + 1) % playlist.length;
    setActiveTrackState(playlist[nextIndex]);
    setIsPlaying(true);
  };

  const playPrevious = () => {
    if (!activeTrack || playlist.length === 0) return;
    const currentIndex = playlist.findIndex((t) => t.idTrack === activeTrack.idTrack);
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    setActiveTrackState(playlist[prevIndex]);
    setIsPlaying(true);
  };

  return (
    <MusicContext.Provider
      value={{
        activeTrack,
        isPlaying,
        playlist,
        setActiveTrack,
        togglePlayPause,
        addToPlaylist,
        removeFromPlaylist,
        playNext,
        playPrevious,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}
