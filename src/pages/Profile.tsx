import { useEffect, useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  saveProfile, fetchHistory, fetchWatchlist,
  removeHistoryEntry, removeFromWatchlist, clearHistory,
  saveRating, fetchRating,
} from '../firebase/db';
import type { HistoryEntry, WatchlistItem } from '../types/user';
import { posterUrl } from '../api/tmdb';
import Loader from '../components/Loader';

// ─── Avatar color presets (Netflix palette) ───────────────────────────────────
const AVATAR_COLORS = [
  { label: 'Netflix Red',    value: '#e50914' },
  { label: 'Royal Blue',     value: '#0071eb' },
  { label: 'Amber',          value: '#e8a217' },
  { label: 'Teal',           value: '#54b9c5' },
  { label: 'Purple',         value: '#8e44ad' },
  { label: 'Emerald',        value: '#27ae60' },
  { label: 'Coral',          value: '#e74c3c' },
  { label: 'Sapphire',       value: '#2980b9' },
];

type Section = 'overview' | 'history' | 'watchlist';

export default function Profile() {
  const { user, profile, signOut, resendVerification, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // ── Form state ────────────────────────────────────────────────────────────
  const [displayName,  setDisplayName]  = useState('');
  const [age,          setAge]          = useState('');
  const [avatarColor,  setAvatarColor]  = useState('#e50914');
  const [saveStatus,   setSaveStatus]   = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // ── Data ──────────────────────────────────────────────────────────────────
  const [history,   setHistory]   = useState<HistoryEntry[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [histLoading, setHistLoading] = useState(true);
  const [listLoading, setListLoading] = useState(true);

  // ── Star rating per tmdb item (key = `${mediaType}_${tmdbId}`) ──────────
  const [ratings,    setRatings]    = useState<Record<string, number>>({});

  // ── Active section ────────────────────────────────────────────────────────
  const [section, setSection] = useState<Section>('overview');

  // ── Verification resend feedback ──────────────────────────────────────────
  const [verifyMsg, setVerifyMsg] = useState('');

  // ─── Populate form from profile ─────────────────────────────────────────
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? '');
      setAge(profile.age ? String(profile.age) : '');
      setAvatarColor(profile.avatarColor ?? '#e50914');
    }
  }, [profile]);

  // ─── Load history & watchlist ────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    fetchHistory(user.uid).then(setHistory).finally(() => setHistLoading(false));
    fetchWatchlist(user.uid).then(setWatchlist).finally(() => setListLoading(false));
  }, [user]);

  // ─── Save profile ────────────────────────────────────────────────────────
  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!displayName.trim()) return;
    setSaveStatus('saving');
    try {
      await saveProfile(user.uid, {
        displayName: displayName.trim(),
        age:         age ? Number(age) : undefined,
        avatarColor,
        createdAt:   profile?.createdAt ?? Date.now(),
      });
      await refreshProfile();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2500);
    }
  }

  // ─── History management ──────────────────────────────────────────────────
  async function handleRemoveHistory(entryId: string) {
    if (!user) return;
    setHistory((p) => p.filter((h) => h.entryId !== entryId));
    await removeHistoryEntry(user.uid, entryId);
  }

  async function handleClearHistory() {
    if (!user) return;
    if (!confirm('Clear all watch history? This cannot be undone.')) return;
    setHistory([]);
    await clearHistory(user.uid);
  }

  // ─── Watchlist management ─────────────────────────────────────────────────
  async function handleRemoveWatchlist(item: WatchlistItem) {
    if (!user) return;
    setWatchlist((p) => p.filter((w) => !(w.tmdbId === item.tmdbId && w.mediaType === item.mediaType)));
    await removeFromWatchlist(user.uid, item.tmdbId, item.mediaType);
  }

  // ─── Star rating ─────────────────────────────────────────────────────────
  async function handleRate(tmdbId: number, mediaType: 'movie' | 'tv', rating: number) {
    if (!user) return;
    const key = `${mediaType}_${tmdbId}`;
    setRatings((p) => ({ ...p, [key]: rating }));
    await saveRating(user.uid, tmdbId, mediaType, rating);
  }

  // Load ratings for visible history items
  useEffect(() => {
    if (!user || history.length === 0) return;
    Promise.all(
      history.map(async (h) => {
        const key = `${h.mediaType}_${h.tmdbId}`;
        const r = await fetchRating(user.uid, h.tmdbId, h.mediaType);
        return { key, rating: r };
      })
    ).then((results) => {
      const map: Record<string, number> = {};
      results.forEach(({ key, rating }) => { if (rating) map[key] = rating; });
      setRatings(map);
    });
  }, [user, history]);

  // ─── Derived ──────────────────────────────────────────────────────────────
  const initials = displayName?.trim()?.charAt(0)?.toUpperCase() ?? (user?.email?.charAt(0)?.toUpperCase() ?? 'U');
  const isEmailUser = user?.providerData[0]?.providerId === 'password';
  const verified = user?.emailVerified;

  if (!user) return <Loader label="Loading profile" />;

  return (
    <div className="min-h-screen bg-void pt-20 pb-24 px-4 sm:px-8 lg:px-14">
      <div className="max-w-4xl mx-auto">

        {/* ── Email verification banner ── */}
        {isEmailUser && !verified && (
          <div className="mb-6 p-4 rounded-lg border border-yellow-600/40 bg-yellow-900/20 flex items-start gap-3">
            <svg className="text-yellow-400 shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div className="flex-1">
              <p className="text-yellow-300 text-sm font-semibold">Email not verified</p>
              <p className="text-yellow-300/70 text-xs mt-0.5">
                Check your inbox for a verification email.{' '}
                <button
                  onClick={async () => {
                    await resendVerification();
                    setVerifyMsg('Verification email resent! Check your inbox.');
                    setTimeout(() => setVerifyMsg(''), 4000);
                  }}
                  className="underline hover:text-yellow-200"
                >
                  Resend
                </button>
              </p>
              {verifyMsg && <p className="text-green-400 text-xs mt-1">{verifyMsg}</p>}
            </div>
          </div>
        )}

        {/* ── Profile header ── */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
          {/* Avatar */}
          <div
            className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg flex items-center justify-center text-white font-black text-4xl sm:text-5xl shadow-2xl shrink-0 select-none transition-colors duration-300"
            style={{ backgroundColor: avatarColor }}
          >
            {initials}
          </div>

          {/* Name + meta */}
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-white">{profile?.displayName ?? 'Your Profile'}</h1>
            <p className="text-white/40 text-sm mt-1">{user.email}</p>
            {profile?.age && <p className="text-white/30 text-xs mt-0.5">Age: {profile.age}</p>}
            <div className="flex gap-3 mt-3 justify-center sm:justify-start">
              <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-full">
                {history.length} watched
              </span>
              <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-full">
                {watchlist.length} in list
              </span>
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={async () => { await signOut(); navigate('/'); }}
            className="sm:ml-auto flex items-center gap-2 text-white/50 hover:text-white text-sm font-medium transition-colors"
            id="rh-signout-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </div>

        {/* ── Section tabs ── */}
        <div className="flex border-b border-white/10 mb-8 gap-1">
          {(['overview', 'history', 'watchlist'] as Section[]).map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`px-4 py-2.5 text-sm font-semibold capitalize transition-colors rounded-t-sm ${
                section === s
                  ? 'text-white border-b-2 border-netflix -mb-px bg-white/5'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {s === 'history' ? `History (${history.length})` : s === 'watchlist' ? `My List (${watchlist.length})` : 'Edit Profile'}
            </button>
          ))}
        </div>

        {/* ══ OVERVIEW (Edit Profile) ══ */}
        {section === 'overview' && (
          <form onSubmit={handleSave} className="space-y-6 max-w-md">
            {/* Display name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="profile-name" className="text-xs font-semibold text-white/50 uppercase tracking-wider">Display Name</label>
              <input
                id="profile-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                className="w-full bg-[#2a2a2a] text-white rounded px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-netflix transition"
                required
              />
            </div>

            {/* Age */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="profile-age" className="text-xs font-semibold text-white/50 uppercase tracking-wider">Age <span className="normal-case font-normal">(optional)</span></label>
              <input
                id="profile-age"
                type="number"
                min={1}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 25"
                className="w-full bg-[#2a2a2a] text-white rounded px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-netflix transition placeholder:text-white/20"
              />
            </div>

            {/* Avatar color picker */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Avatar Color</label>
              <div className="flex flex-wrap gap-3">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    onClick={() => setAvatarColor(c.value)}
                    className={`w-10 h-10 rounded-lg transition-all duration-200 ${
                      avatarColor === c.value
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-void scale-110'
                        : 'hover:scale-105 opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.value }}
                    aria-label={c.label}
                  />
                ))}
              </div>
              {/* Preview */}
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-lg"
                  style={{ backgroundColor: avatarColor }}
                >
                  {initials}
                </div>
                <span className="text-white/40 text-xs">Preview</span>
              </div>
            </div>

            {/* Save button */}
            <button
              type="submit"
              disabled={saveStatus === 'saving'}
              id="rh-save-profile-btn"
              className={`flex items-center gap-2 px-6 py-3 rounded font-bold text-sm transition-all ${
                saveStatus === 'saved'
                  ? 'bg-green-600 text-white'
                  : saveStatus === 'error'
                    ? 'bg-red-700 text-white'
                    : 'bg-netflix hover:bg-[#c1121f] text-white disabled:opacity-60'
              }`}
            >
              {saveStatus === 'saving' && 'Saving…'}
              {saveStatus === 'saved'  && '✓ Saved!'}
              {saveStatus === 'error'  && 'Error saving'}
              {saveStatus === 'idle'   && 'Save Profile'}
            </button>
          </form>
        )}

        {/* ══ HISTORY ══ */}
        {section === 'history' && (
          <div>
            {histLoading ? (
              <Loader label="Loading history" />
            ) : history.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-white/40 text-lg">No watch history yet.</p>
                <p className="text-white/20 text-sm mt-2">Watch a movie or show for 5+ minutes to see it here.</p>
                <Link to="/" className="mt-4 inline-block text-netflix hover:underline text-sm font-semibold">Browse titles →</Link>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-white/40 text-xs">Last {history.length} items</p>
                  <button onClick={handleClearHistory} className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium">
                    Clear all history
                  </button>
                </div>
                <div className="space-y-3">
                  {history.map((entry) => {
                    const href = entry.mediaType === 'tv' && entry.season && entry.episode
                      ? `/watch-tv/${entry.tmdbId}/${entry.season}/${entry.episode}`
                      : `/watch/${entry.tmdbId}`;
                    const subtitle = entry.mediaType === 'tv' && entry.season && entry.episode
                      ? `S${entry.season} E${entry.episode}${entry.episodeName ? ` · ${entry.episodeName}` : ''}`
                      : null;
                    const ratingKey = `${entry.mediaType}_${entry.tmdbId}`;
                    const myRating  = ratings[ratingKey] ?? 0;

                    return (
                      <div
                        key={entry.entryId}
                        className="flex gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/8 transition-colors group/entry"
                      >
                        {/* Poster */}
                        <Link to={href} className="shrink-0">
                          <img
                            src={posterUrl(entry.posterPath, 'w200')}
                            alt={entry.title}
                            className="w-14 h-20 object-cover rounded-sm bg-surface2"
                            loading="lazy"
                          />
                        </Link>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <Link to={href} className="text-white font-semibold text-sm hover:text-netflix transition-colors line-clamp-1">
                            {entry.title}
                          </Link>
                          {subtitle && <p className="text-white/50 text-xs mt-0.5">{subtitle}</p>}
                          <p className="text-white/30 text-xs mt-1">
                            {new Date(entry.watchedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>

                          {/* Star rating */}
                          <div className="flex gap-0.5 mt-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => handleRate(entry.tmdbId, entry.mediaType, star)}
                                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                                className={`text-base transition-colors ${star <= myRating ? 'text-yellow-400' : 'text-white/20 hover:text-yellow-300'}`}
                              >
                                ★
                              </button>
                            ))}
                            {myRating > 0 && (
                              <span className="text-white/30 text-xs ml-1 self-center">{myRating}/5</span>
                            )}
                          </div>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => handleRemoveHistory(entry.entryId)}
                          aria-label="Remove from history"
                          className="shrink-0 text-white/20 hover:text-white/70 transition-colors opacity-0 group-hover/entry:opacity-100 self-start mt-1"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ WATCHLIST / MY LIST ══ */}
        {section === 'watchlist' && (
          <div>
            {listLoading ? (
              <Loader label="Loading your list" />
            ) : watchlist.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-white/40 text-lg">Your list is empty.</p>
                <p className="text-white/20 text-sm mt-2">Hit "+ My List" on any title to save it here.</p>
                <Link to="/" className="mt-4 inline-block text-netflix hover:underline text-sm font-semibold">Browse titles →</Link>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
                {watchlist.map((item) => {
                  const href = item.mediaType === 'tv' ? `/tv/${item.tmdbId}` : `/watch/${item.tmdbId}`;
                  return (
                    <div key={`${item.mediaType}_${item.tmdbId}`} className="relative group/wl">
                      <Link to={href}>
                        <div className="aspect-[2/3] rounded-sm overflow-hidden bg-surface2">
                          <img
                            src={posterUrl(item.posterPath, 'w342')}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover/wl:scale-105"
                            loading="lazy"
                          />
                        </div>
                        <p className="text-white text-xs font-medium mt-1 line-clamp-1">{item.title}</p>
                        {item.mediaType === 'tv' && (
                          <span className="text-[9px] text-white/40 font-bold">SERIES</span>
                        )}
                      </Link>
                      {/* Remove */}
                      <button
                        onClick={() => handleRemoveWatchlist(item)}
                        aria-label="Remove from list"
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/90 opacity-0 group-hover/wl:opacity-100 transition-all"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
