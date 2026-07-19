/**
 * Thin wrapper that converts a TvShow into MovieCard props.
 * Links to the TV detail page (/tv/:id) instead of the watch page.
 */
import MovieCard from './MovieCard';
import type { TvShow } from '../types/tv';

interface Props {
  show: TvShow;
  variant?: 'landscape' | 'portrait';
  showTitle?: boolean;
  rank?: number;
}

export default function TvCard({ show, ...rest }: Props) {
  const movieLike = {
    id: show.id,
    title: show.name,
    overview: show.overview,
    posterPath: show.posterPath,
    backdropPath: show.backdropPath,
    releaseDate: show.firstAirDate,
    voteAverage: show.voteAverage,
    genreIds: show.genreIds,
  };

  return (
    <MovieCard
      movie={movieLike}
      to={`/tv/${show.id}`}
      badge="Series"
      {...rest}
    />
  );
}
