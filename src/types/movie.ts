export interface Genre {
  id: number;
  name: string;
}

export interface Movie {
  id: number; // TMDB id, used for catalog lookups
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  voteAverage: number;
  genreIds: number[];
  mediaType?: 'movie' | 'tv' | 'person';
}
