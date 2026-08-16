// ─── Reelhouse User Types ────────────────────────────────────────────────────

export interface ReelhouseProfile {
  displayName: string;
  age?: number;
  avatarColor: string; // hex color e.g. "#e50914"
  createdAt: number;   // Unix ms timestamp
}

export interface HistoryEntry {
  entryId: string;        // Firebase push key
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  watchedAt: number;      // Unix ms timestamp
  // TV-only fields
  season?: number | null;
  episode?: number | null;
  episodeName?: string | null;
}

export interface WatchlistItem {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  addedAt: number;        // Unix ms timestamp
}
