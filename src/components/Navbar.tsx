import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { searchMulti } from '../api/tmdb';
import type { Movie } from '../types/movie';

const NAV_LINKS = [
  { label: 'Home',          to: '/' },
  { label: 'Movies',        to: '/genre/28' },
  { label: 'TV Shows',      to: '/tv-shows' },
  { label: 'Anime',         to: '/anime' },
  { label: 'New & Popular', to: '/genre/12' },
];

export default function Navbar() {
  const [query, setQuery]         = useState('');
  const [searchOpen, setSearch]   = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const [suggestions, setSuggestions] = useState<Movie[]>([]);
  const navigate  = useNavigate();
  const location  = useLocation();

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
      <div className="mx-auto max-w-[1800px] px-4 sm:px-8 lg:px-14 h-16 flex items-center gap-6">

        {/* Logo */}
        <Link to="/" className="text-netflix font-black text-2xl tracking-widest shrink-0 select-none">
          REEL<span className="text-ink">HOUSE</span>
        </Link>

        {/* Primary nav */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
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

        {/* Right controls */}
        <div className="ml-auto flex items-center gap-4">

          {/* Search */}
          <form onSubmit={handleSubmit} className="flex items-center">
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

          {/* Notification bell */}
          <button className="text-faint hover:text-ink transition-colors p-1 hidden sm:block" aria-label="Notifications">
            <BellIcon />
          </button>

          {/* Profile avatar */}
          <div className="w-8 h-8 rounded bg-netflix flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity select-none">
            R
          </div>
        </div>
      </div>
    </header>
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
