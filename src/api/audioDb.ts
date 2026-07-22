import type { AudioAlbum, AudioArtist, AudioTrack } from '../types/audio';

// Vite env vars
const API_KEY = import.meta.env.VITE_AUDIODB_API_KEY || '123';
const BASE_URL = import.meta.env.VITE_AUDIODB_BASE_URL || `https://www.theaudiodb.com/api/v1/json/${API_KEY}`;

async function fetchAudioDB<T>(endpoint: string): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`AudioDB API error: ${res.status}`);
    return res.json();
  } catch (error) {
    console.error('Failed to fetch from AudioDB', error);
    throw error;
  }
}

export async function getTrendingAlbums(): Promise<AudioAlbum[]> {
  const data = await fetchAudioDB<{ trending: AudioAlbum[] }>('/trending.php?country=us&type=itunes&format=albums');
  return data.trending || [];
}

export async function getTrendingSingles(): Promise<AudioTrack[]> {
  const data = await fetchAudioDB<{ trending: AudioTrack[] }>('/trending.php?country=us&type=itunes&format=singles');
  return data.trending || [];
}

export async function getTop10Tracks(artistName: string): Promise<AudioTrack[]> {
  const data = await fetchAudioDB<{ track: AudioTrack[] }>(`/track-top10.php?s=${encodeURIComponent(artistName)}`);
  return data.track || [];
}

export async function getArtist(artistId: string): Promise<AudioArtist | null> {
  const data = await fetchAudioDB<{ artists: AudioArtist[] }>(`/artist.php?i=${artistId}`);
  return data.artists?.[0] || null;
}

export async function getAlbum(albumId: string): Promise<AudioAlbum | null> {
  const data = await fetchAudioDB<{ album: AudioAlbum[] }>(`/album.php?m=${albumId}`);
  return data.album?.[0] || null;
}

export async function getAlbumTracks(albumId: string): Promise<AudioTrack[]> {
  const data = await fetchAudioDB<{ track: AudioTrack[] }>(`/track.php?m=${albumId}`);
  return data.track || [];
}

// Helper to get most loved tracks (another endpoint mentioned in the screenshot)
export async function getMostLovedTracks(): Promise<AudioTrack[]> {
  const data = await fetchAudioDB<{ track: AudioTrack[] }>('/mostloved.php?format=track');
  return data.track || [];
}
