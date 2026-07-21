import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchMulti } from '../api/tmdb';
import type { Movie } from '../types/movie';
import MovieCard from '../components/MovieCard';
import Loader from '../components/Loader';

export default function Search() {
  const [params]  = useSearchParams();
  const query     = params.get('q') ?? '';
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    searchMulti(query).then((r) => {
      if (!cancelled) { setResults(r); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [query]);

  return (
    <div className="min-h-screen bg-void pt-20 sm:pt-24 px-4 sm:px-8 lg:px-14 pb-16">
      <div className="max-w-7xl mx-auto mb-6">
        {/* Mobile Search Bar */}
        <div className="md:hidden relative mb-6">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-white/50">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <input 
            type="text" 
            value={query}
            onChange={(e) => {
              const newQuery = e.target.value;
              if (newQuery) {
                navigate(`/search?q=${encodeURIComponent(newQuery)}`, { replace: true });
              } else {
                navigate(`/search`, { replace: true });
              }
            }}
            placeholder="Search for a show, movie, genre, etc." 
            className="w-full bg-[#333333] text-white rounded-[4px] py-3 pl-10 pr-4 text-sm outline-none placeholder:text-[#8c8c8c]"
            autoFocus
          />
        </div>

        {query && (
          <div>
            <h1 className="text-2xl font-bold text-ink mb-1">
              Results for <span className="text-netflix">"{query}"</span>
            </h1>
            {!loading && (
              <p className="text-muted text-sm">
                {results.length} title{results.length !== 1 ? 's' : ''} found
              </p>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <Loader label="Searching the archive" />
      ) : results.length === 0 ? (
        <div className="max-w-7xl mx-auto text-center py-16">
          <p className="text-muted text-lg">No results found for "{query}"</p>
          <p className="text-muted/60 text-sm mt-2">Try a different title or keyword.</p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3">
          {results.map((m) => (
            <MovieCard key={m.id} movie={m} variant="portrait" showTitle />
          ))}
        </div>
      )}
    </div>
  );
}
