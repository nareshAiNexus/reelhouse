export interface TvShow {
  id: number;
  name: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  firstAirDate: string;
  voteAverage: number;
  genreIds: number[];
}

export interface TvSeasonInfo {
  id: number;
  name: string;
  seasonNumber: number;
  episodeCount: number;
  overview: string;
  posterPath: string | null;
  airDate: string;
}

export interface TvShowDetail extends TvShow {
  numberOfSeasons: number;
  numberOfEpisodes: number;
  status?: string;
  networks?: string[];
  seasons: TvSeasonInfo[];
}

export interface TvEpisode {
  id: number;
  name: string;
  episodeNumber: number;
  seasonNumber: number;
  overview: string;
  stillPath: string | null;
  airDate: string;
  runtime: number | null;
  voteAverage: number;
}

export interface TvSeasonDetail {
  id: number;
  name: string;
  seasonNumber: number;
  overview: string;
  posterPath: string | null;
  airDate: string;
  episodes: TvEpisode[];
}
