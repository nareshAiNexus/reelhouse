import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { searchMulti } from '../api/tmdb';
import type { Movie } from '../types/movie';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { label: 'Home',          to: '/' },
  { label: 'Movies',        to: '/genre/28' },
  { label: 'TV Shows',      to: '/tv-shows' },
  { label: 'Anime',         to: '/anime' },
  { label: 'New & Popular', to: '/genre/12' },
];

export default function Navbar() {
  const [query, setQuery]           = useState('');
  const [searchOpen, setSearch]     = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const [suggestions, setSuggestions] = useState<Movie[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, profile, signOut } = useAuth();

  useEffect(() => {
    let cancelled = false;
    if (query.trim().length > 1) {
      const timer = setTimeout(() => {
        searchMulti(query, 1).then(res => {
          if (!cancelled) setSuggestions(res.slice(0, 5));
        });
      }, 300);
      return () => { cancelled = true; clearTimeout(timer); };
    } else {
      setSuggestions([]);
    }
  }, [query]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const closeMenu = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
      setMobileMenuOpen(false);
    };
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, []);

  const isHome = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setSearch(false);
      setQuery('');
    }
  }

  const solid = !isHome || scrolled;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        solid
          ? 'bg-void shadow-lg shadow-black/40'
          : 'bg-gradient-to-b from-black/80 via-black/30 to-transparent'
      }`}
    >
      <div className="mx-auto max-w-[1800px] px-4 sm:px-8 lg:px-14 h-16 flex items-center justify-between gap-6">

        {/* Logo (N for mobile, REELHOUSE for desktop) */}
        <Link to="/" className="text-netflix font-black text-3xl tracking-widest shrink-0 select-none hidden md:block">
          REEL<span className="text-ink">HOUSE</span>
        </Link>
        <Link to="/" className="text-netflix font-black text-3xl shrink-0 select-none md:hidden">
          N
        </Link>

        {/* Primary nav (Desktop) */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium mr-auto">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-faint hover:text-ink transition-colors duration-200"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Secondary Nav has been removed as per user request */}

        {/* Right controls */}
        <div className="flex items-center gap-4">

          {/* Search (Desktop only) */}
          <form onSubmit={handleSubmit} className="hidden md:flex items-center">
              <div className="relative flex items-center justify-end">
                <div 
                  onClick={() => !searchOpen && setSearch(true)}
                  className={`flex items-center gap-2 border transition-all duration-300 ease-in-out cursor-pointer ${
                    searchOpen 
                      ? 'w-44 sm:w-64 bg-black/80 border-white px-3 py-1.5' 
                      : 'w-8 bg-transparent border-transparent px-1 py-1'
                  }`}
                >
                  <SearchIcon className={`shrink-0 transition-colors ${searchOpen ? 'text-white' : 'text-faint hover:text-ink'}`} />
                  <input
                    ref={(el) => { if (searchOpen && el) el.focus(); }}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onBlur={() => { 
                      setTimeout(() => { if (!query) setSearch(false); setSuggestions([]); }, 200); 
                    }}
                    placeholder="Titles, people, genres"
                    className={`bg-transparent text-white text-sm outline-none placeholder:text-muted transition-all duration-300 ${
                      searchOpen ? 'w-full opacity-100' : 'w-0 opacity-0'
                    }`}
                    style={{ visibility: searchOpen ? 'visible' : 'hidden' }}
                  />
                </div>
                
                {/* Autocomplete dropdown */}
                {suggestions.length > 0 && searchOpen && (
                  <div className="absolute top-full right-0 mt-2 w-72 bg-[#181818] border border-white/10 shadow-2xl shadow-black/80 flex flex-col z-50 rounded-sm overflow-hidden">
                    {suggestions.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          navigate(s.mediaType === 'tv' ? `/tv/${s.id}` : `/watch/${s.id}`);
                          setSearch(false);
                          setQuery('');
                          setSuggestions([]);
                        }}
                        className="flex items-center gap-3 p-2 hover:bg-white/10 transition-colors text-left"
                      >
                        {s.posterPath ? (
                          <img src={`https://image.tmdb.org/t/p/w92${s.posterPath}`} alt={s.title} className="w-10 h-14 object-cover rounded-sm" />
                        ) : (
                          <div className="w-10 h-14 bg-surface2 rounded-sm shrink-0" />
                        )}
                        <div className="overflow-hidden">
                          <p className="text-sm font-semibold text-white line-clamp-1">{s.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {s.mediaType === 'tv' && <span className="bg-white/20 text-white text-[9px] font-bold px-1 py-0.5 rounded-sm">SERIES</span>}
                            <p className="text-[10px] text-muted">{s.releaseDate?.slice(0, 4)}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                    <button type="submit" className="text-xs font-semibold text-center py-2.5 text-white/60 hover:text-white bg-black/40 hover:bg-black/60 transition-colors">
                      View all results
                    </button>
                  </div>
                )}
              </div>

          </form>

          {/* Cast Icon (Mobile) */}
          <button className="text-white hover:text-white/80 transition-colors p-1 md:hidden" aria-label="Cast">
            <CastIcon />
          </button>

          {/* Notification bell (Desktop only) */}
          <button className="text-faint hover:text-ink transition-colors p-1 hidden md:block" aria-label="Notifications">
            <BellIcon />
          </button>

          {/* Profile avatar + dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <button
              id="rh-profile-avatar"
              onClick={(e) => { e.stopPropagation(); setProfileMenuOpen((p) => !p); }}
              aria-label="Profile menu"
              className="w-6 h-6 sm:w-8 sm:h-8 rounded flex items-center justify-center text-white text-xs sm:text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity select-none overflow-hidden focus:outline-none"
              style={{ backgroundColor: profile?.avatarColor ?? '#e50914' }}
            >
              {profile?.displayName
                ? profile.displayName.charAt(0).toUpperCase()
                : user
                  ? (user.email?.charAt(0).toUpperCase() ?? 'U')
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
              }
            </button>

            {/* Dropdown */}
            {profileMenuOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-48 bg-[#141414] border border-white/10 shadow-2xl shadow-black/80 rounded-sm overflow-hidden z-50"
                onClick={(e) => e.stopPropagation()}
              >
                {user ? (
                  <>
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-white text-sm font-semibold truncate">{profile?.displayName ?? user.email}</p>
                      {!user.emailVerified && user.providerData[0]?.providerId === 'password' && (
                        <p className="text-yellow-500 text-[10px] mt-0.5">Email not verified</p>
                      )}
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                      My Profile
                    </Link>
                    <button
                      onClick={async () => { await signOut(); setProfileMenuOpen(false); navigate('/'); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                    Sign In
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function CastIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"></path>
      <line x1="2" y1="20" x2="2.01" y2="20"></line>
    </svg>
  );
}

function SearchIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
