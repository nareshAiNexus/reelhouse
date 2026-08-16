import {
  ref,
  get,
  set,
  push,
  remove,
} from 'firebase/database';
import { db } from './firebase';
import type { ReelhouseProfile, HistoryEntry, WatchlistItem } from '../types/user';

// ─── MAX history entries kept per user ────────────────────────────────────────
const MAX_HISTORY = 20;

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────────────────────

export async function saveProfile(uid: string, data: Partial<ReelhouseProfile>): Promise<void> {
  const profileRef = ref(db, `users/${uid}/profile`);
  const snap = await get(profileRef);
  const existing = snap.exists() ? snap.val() : {};
  await set(profileRef, { ...existing, ...data });
}

export async function fetchProfile(uid: string): Promise<ReelhouseProfile | null> {
  const snap = await get(ref(db, `users/${uid}/profile`));
  return snap.exists() ? (snap.val() as ReelhouseProfile) : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// WATCH HISTORY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Write a history entry. Deduplicates by tmdbId (+ season/episode for TV):
 * if an entry for the same content already exists it is removed first so the
 * new timestamp floats to the top. Trims to MAX_HISTORY entries after writing.
 */
export async function writeHistory(
  uid: string,
  entry: Omit<HistoryEntry, 'entryId'>
): Promise<void> {
  const histRef = ref(db, `users/${uid}/history`);

  // Read existing to deduplicate
  const snap = await get(histRef);
  if (snap.exists()) {
    const existing = snap.val() as Record<string, Omit<HistoryEntry, 'entryId'>>;
    for (const [key, val] of Object.entries(existing)) {
      const sameContent =
        val.tmdbId === entry.tmdbId &&
        val.mediaType === entry.mediaType &&
        (entry.mediaType === 'movie' ||
          (val.season === entry.season && val.episode === entry.episode));
      if (sameContent) {
        await remove(ref(db, `users/${uid}/history/${key}`));
      }
    }
  }

  // Push new entry
  await push(histRef, entry);

  // Trim: keep only the latest MAX_HISTORY entries
  const afterSnap = await get(histRef);
  if (afterSnap.exists()) {
    const entries = Object.entries(
      afterSnap.val() as Record<string, Omit<HistoryEntry, 'entryId'>>
    ).sort(([, a], [, b]) => a.watchedAt - b.watchedAt); // oldest first

    if (entries.length > MAX_HISTORY) {
      const toRemove = entries.slice(0, entries.length - MAX_HISTORY);
      await Promise.all(
        toRemove.map(([key]) => remove(ref(db, `users/${uid}/history/${key}`)))
      );
    }
  }
}

/** Returns last MAX_HISTORY history entries, newest first. */
export async function fetchHistory(uid: string): Promise<HistoryEntry[]> {
  // Plain read (no Firebase ordering) — we sort client-side.
  // This avoids requiring a .indexOn rule and works for ≤20 entries.
  const snap = await get(ref(db, `users/${uid}/history`));
  if (!snap.exists()) return [];

  const entries: HistoryEntry[] = [];
  snap.forEach((child) => {
    entries.push({ entryId: child.key!, ...(child.val() as Omit<HistoryEntry, 'entryId'>) });
  });

  // Sort newest-first, then cap to MAX_HISTORY
  return entries
    .sort((a, b) => b.watchedAt - a.watchedAt)
    .slice(0, MAX_HISTORY);
}

export async function removeHistoryEntry(uid: string, entryId: string): Promise<void> {
  await remove(ref(db, `users/${uid}/history/${entryId}`));
}

export async function clearHistory(uid: string): Promise<void> {
  await set(ref(db, `users/${uid}/history`), null);
}

// ─────────────────────────────────────────────────────────────────────────────
// WATCHLIST (My List)
// ─────────────────────────────────────────────────────────────────────────────

export async function addToWatchlist(uid: string, item: WatchlistItem): Promise<void> {
  // Key by tmdbId + mediaType so duplicates are impossible
  const key = `${item.mediaType}_${item.tmdbId}`;
  await set(ref(db, `users/${uid}/watchlist/${key}`), item);
}

export async function removeFromWatchlist(
  uid: string,
  tmdbId: number,
  mediaType: 'movie' | 'tv'
): Promise<void> {
  const key = `${mediaType}_${tmdbId}`;
  await remove(ref(db, `users/${uid}/watchlist/${key}`));
}

export async function fetchWatchlist(uid: string): Promise<WatchlistItem[]> {
  const snap = await get(ref(db, `users/${uid}/watchlist`));
  if (!snap.exists()) return [];
  const items: WatchlistItem[] = [];
  snap.forEach((child) => { items.push(child.val() as WatchlistItem); });
  return items.sort((a, b) => b.addedAt - a.addedAt); // newest first
}

export async function isInWatchlist(
  uid: string,
  tmdbId: number,
  mediaType: 'movie' | 'tv'
): Promise<boolean> {
  const key = `${mediaType}_${tmdbId}`;
  const snap = await get(ref(db, `users/${uid}/watchlist/${key}`));
  return snap.exists();
}

// ─────────────────────────────────────────────────────────────────────────────
// RATINGS
// ─────────────────────────────────────────────────────────────────────────────

export async function saveRating(
  uid: string,
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  rating: number
): Promise<void> {
  const key = `${mediaType}_${tmdbId}`;
  await set(ref(db, `users/${uid}/ratings/${key}`), rating);
}

export async function fetchRating(
  uid: string,
  tmdbId: number,
  mediaType: 'movie' | 'tv'
): Promise<number | null> {
  const key = `${mediaType}_${tmdbId}`;
  const snap = await get(ref(db, `users/${uid}/ratings/${key}`));
  return snap.exists() ? (snap.val() as number) : null;
}
