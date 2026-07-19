import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getGenres, getMoviesByGenre } from '../api/tmdb';
import type { Movie, Genre } from '../types/movie';
import MovieCard from '../components/MovieCard';
import Loader from '../components/Loader';
import ScrollableRow from '../components/ScrollableRow';

export default function GenrePage() {
  const { genreId }  = useParams();
  const [movies,    setMovies]    = useState<Movie[]>([]);
  const [allGenres, setAllGenres] = useState<Genre[]>([]);
  const [genreName, setGenreName] = useState('');
  const [page,      setPage]      = useState(1);
  const [loading,   setLoading]   = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!genreId) return;
    setLoading(true);
    setPage(2);
    Promise.all([
      getMoviesByGenre(Number(genreId), 1),
      getMoviesByGenre(Number(genreId), 2),
      getGenres()
    ]).then(([page1, page2, genres]) => {
      setMovies([...page1, ...page2]);
      setAllGenres(genres);
      setGenreName(genres.find((g) => g.id === Number(genreId))?.name ?? 'Genre');
      setLoading(false);
    });
  }, [genreId]);

  async function loadMore() {
    if (!genreId || loadingMore) return;
    setLoadingMore(true);
    const next = page + 1;
    const more = await getMoviesByGenre(Number(genreId), next);
    setMovies((prev) => [...prev, ...more]);
    setPage(next);
    setLoadingMore(false);
  }

  return (
    <div className="min-h-screen bg-void pt-24 pb-16">
      {/* Header */}
      <div className="px-4 sm:px-8 lg:px-14 mb-6 max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-black text-ink mb-4">
          {genreName} Movies
        </h1>
        
        {/* Genre Selector Pills */}
        <ScrollableRow>
          {allGenres.map((g) => (
            <Link
              key={g.id}
              to={`/genre/${g.id}`}
              className={`shrink-0 px-4 py-1.5 rounded-sm text-sm font-semibold transition-colors ${
                g.id === Number(genreId)
                  ? 'bg-white text-black'
                  : 'bg-surface2 hover:bg-surface text-muted hover:text-white border border-surface2'
              }`}
            >
              {g.name}
            </Link>
          ))}
        </ScrollableRow>
      </div>

      {loading ? (
        <Loader label="Sorting by category" />
      ) : (
        <div className="px-4 sm:px-8 lg:px-14 max-w-7xl mx-auto">
          {/* Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
            {movies.map((m) => (
              <MovieCard key={m.id} movie={m} variant="portrait" showTitle />
            ))}
          </div>

          {/* Load more */}
          <div className="flex justify-center mt-10">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-8 py-2.5 rounded-sm bg-surface2 hover:bg-surface2/80 text-ink text-sm font-semibold
                         transition-colors border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? 'Loading…' : 'Load More'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
