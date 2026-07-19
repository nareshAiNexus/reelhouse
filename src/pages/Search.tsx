import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchMulti } from '../api/tmdb';
import type { Movie } from '../types/movie';
import MovieCard from '../components/MovieCard';
import Loader from '../components/Loader';

export default function Search() {
  const [params]  = useSearchParams();
  const query     = params.get('q') ?? '';
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    searchMulti(query).then((r) => {
      if (!cancelled) { setResults(r); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [query]);

  return (
    <div className="min-h-screen bg-void pt-24 px-4 sm:px-8 lg:px-14 pb-16">
      {query && (
        <div className="max-w-7xl mx-auto mb-8">
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
