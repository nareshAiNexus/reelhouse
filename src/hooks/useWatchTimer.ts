import { useEffect, useRef } from 'react';
import { writeHistory } from '../firebase/db';
import { useAuth } from '../context/AuthContext';

interface WatchTimerOptions {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  /** TV only */
  season?: number | null;
  episode?: number | null;
  episodeName?: string | null;
}

const THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fires a single history write after the user has been on the watch page for
 * ≥ 5 continuous minutes. Safe no-op when the user is not signed in.
 *
 * Also fires immediately on unmount if more than half the threshold has passed
 * (graceful partial-watch capture — disabled by default, kept as comment).
 */
export function useWatchTimer(opts: WatchTimerOptions) {
  const { user } = useAuth();
  const firedRef  = useRef(false);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Only track authenticated users
    if (!user) return;
    // Reset on content change
    firedRef.current = false;

    timerRef.current = setTimeout(async () => {
      if (firedRef.current) return;
      firedRef.current = true;
      try {
        await writeHistory(user.uid, {
          tmdbId:      opts.tmdbId,
          mediaType:   opts.mediaType,
          title:       opts.title,
          posterPath:  opts.posterPath,
          watchedAt:   Date.now(),
          season:      opts.season ?? null,
          episode:     opts.episode ?? null,
          episodeName: opts.episodeName ?? null,
        });
      } catch (err) {
        // Non-critical — history write failure should not break the player
        console.warn('[useWatchTimer] history write failed:', err);
      }
    }, THRESHOLD_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // opts values are primitives — safe to spread as deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, opts.tmdbId, opts.mediaType, opts.season, opts.episode]);
}
