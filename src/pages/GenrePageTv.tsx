import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getTvGenres, tmdb } from '../api/tmdb';
import type { TvShow } from '../types/tv';
import type { Genre } from '../types/movie';
import TvCard from '../components/TvCard';
import Loader from '../components/Loader';
import ScrollableRow from '../components/ScrollableRow';

async function getTvShowsByGenre(genreId: number, page = 1): Promise<TvShow[]> {
  const { data } = await tmdb.get('/discover/tv', {
    params: { with_genres: genreId, page, sort_by: 'popularity.desc' },
  });
  return data.results.map((raw: any) => ({
    id: raw.id,
    name: raw.name ?? raw.title ?? 'Untitled',
    overview: raw.overview ?? '',
    posterPath: raw.poster_path ?? null,
    backdropPath: raw.backdrop_path ?? null,
    firstAirDate: raw.first_air_date ?? '',
    voteAverage: raw.vote_average ?? 0,
    genreIds: raw.genre_ids ?? [],
  }));
}

export default function GenrePageTv() {
  const { genreId }  = useParams();
  const [shows,     setShows]     = useState<TvShow[]>([]);
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
      getTvShowsByGenre(Number(genreId), 1),
      getTvShowsByGenre(Number(genreId), 2),
      getTvGenres()
    ]).then(([page1, page2, genres]) => {
      setShows([...page1, ...page2]);
      setAllGenres(genres);
      setGenreName(genres.find((g: Genre) => g.id === Number(genreId))?.name ?? 'Genre');
      setLoading(false);
    });
  }, [genreId]);

  async function loadMore() {
    if (!genreId || loadingMore) return;
    setLoadingMore(true);
    const next = page + 1;
    const more = await getTvShowsByGenre(Number(genreId), next);
    setShows((prev) => [...prev, ...more]);
    setPage(next);
    setLoadingMore(false);
  }

  return (
    <div className="min-h-screen bg-void pt-24 pb-16">
      <div className="px-4 sm:px-8 lg:px-14 mb-6 max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-black text-ink mb-4">
          {genreName} Series
        </h1>
        <ScrollableRow>
          {allGenres.map((g) => (
            <Link
              key={g.id}
              to={`/genre-tv/${g.id}`}
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
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
            {shows.map((s) => (
              <TvCard key={s.id} show={s} variant="portrait" showTitle />
            ))}
          </div>
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
