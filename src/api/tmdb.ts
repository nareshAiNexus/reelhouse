import axios from 'axios';
import type { Genre, Movie } from '../types/movie';
import type { TvShow, TvShowDetail, TvSeasonDetail } from '../types/tv';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY as string;
const BASE_URL = (import.meta.env.VITE_TMDB_BASE_URL as string) || 'https://api.themoviedb.org/3';
export const IMAGE_BASE_URL = (import.meta.env.VITE_TMDB_IMAGE_BASE_URL as string) || 'https://image.tmdb.org/t/p';

export const tmdb = axios.create({
  baseURL: BASE_URL,
  params: { api_key: API_KEY },
  timeout: 5000,
});

// Normalizes TMDB's snake_case payloads into our internal Movie shape.
function mapMovie(raw: any): Movie {
  return {
    id: raw.id,
    title: raw.title ?? raw.name ?? 'Untitled',
    overview: raw.overview ?? '',
    posterPath: raw.poster_path ?? null,
    backdropPath: raw.backdrop_path ?? null,
    releaseDate: raw.release_date ?? raw.first_air_date ?? '',
    voteAverage: raw.vote_average ?? 0,
    genreIds: raw.genre_ids ?? raw.genres?.map((g: any) => g.id) ?? [],
    mediaType: raw.media_type,
  };
}

export async function getTrending(window: 'day' | 'week' = 'week'): Promise<Movie[]> {
  const { data } = await tmdb.get(`/trending/movie/${window}`);
  return data.results.map(mapMovie);
}

export async function getPopular(page = 1): Promise<Movie[]> {
  const { data } = await tmdb.get('/movie/popular', { params: { page } });
  return data.results.map(mapMovie);
}

export async function getTopRated(page = 1): Promise<Movie[]> {
  const { data } = await tmdb.get('/movie/top_rated', { params: { page } });
  return data.results.map(mapMovie);
}

export async function getGoatedMixed(): Promise<Movie[]> {
  const [p1, p2, t1, t2] = await Promise.all([
    getTopRated(1), 
    getTopRated(2),
    getTopRatedTv(1),
    getTopRatedTv(2)
  ]);
  
  const movies = [...p1, ...p2].map(m => ({ ...m, mediaType: 'movie' as const }));
  const tvs = [...t1, ...t2].map(t => ({ 
    id: t.id, 
    title: t.name, 
    overview: t.overview, 
    posterPath: t.posterPath, 
    backdropPath: t.backdropPath, 
    releaseDate: t.firstAirDate, 
    voteAverage: t.voteAverage, 
    genreIds: t.genreIds, 
    mediaType: 'tv' as const
  }));
  
  const all = [...movies, ...tvs];
  all.sort((a, b) => b.voteAverage - a.voteAverage);
  
  return all.slice(0, 40);
}

export async function getNowPlaying(page = 1): Promise<Movie[]> {
  const { data } = await tmdb.get('/movie/now_playing', { params: { page } });
  return data.results.map(mapMovie);
}

export async function searchMovies(query: string, page = 1): Promise<Movie[]> {
  if (!query.trim()) return [];
  const { data } = await tmdb.get('/search/movie', { params: { query, page, include_adult: true } });
  return data.results.map(mapMovie);
}

export async function searchMulti(query: string, pages = 2): Promise<Movie[]> {
  if (!query.trim()) return [];
  const promises = [];
  for (let p = 1; p <= pages; p++) {
    promises.push(tmdb.get('/search/multi', { params: { query, page: p, include_adult: true } }));
  }
  const responses = await Promise.all(promises);
  const allResults = responses.flatMap((r) => r.data.results);
  
  // Filter out people, we only want movies/tv
  const filtered = allResults.filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv');
  return filtered.map(mapMovie);
}

export async function getGenres(): Promise<Genre[]> {
  const { data } = await tmdb.get('/genre/movie/list');
  return data.genres;
}

export async function getMoviesByGenre(genreId: number, page = 1): Promise<Movie[]> {
  const { data } = await tmdb.get('/discover/movie', {
    params: { with_genres: genreId, page, sort_by: 'popularity.desc' },
  });
  return data.results.map(mapMovie);
}

export async function getMovieDetails(tmdbId: number): Promise<Movie & { runtime?: number }> {
  const { data } = await tmdb.get(`/movie/${tmdbId}`);
  return { ...mapMovie(data), runtime: data.runtime };
}

// The IMDb ID is what gets passed to your own streaming/trailer API.
export async function getImdbId(tmdbId: number): Promise<string | null> {
  const { data } = await tmdb.get(`/movie/${tmdbId}/external_ids`);
  return data.imdb_id ?? null;
}

export function posterUrl(path: string | null, size: 'w200' | 'w342' | 'w500' | 'original' = 'w342') {
  if (!path) return '/poster-placeholder.svg';
  return `${IMAGE_BASE_URL}/${size}${path}`;
}

export function backdropUrl(path: string | null, size: 'w780' | 'w1280' | 'original' = 'w1280') {
  if (!path) return '/backdrop-placeholder.svg';
  return `${IMAGE_BASE_URL}/${size}${path}`;
}

export async function getSimilarMovies(tmdbId: number, page = 1): Promise<Movie[]> {
  const { data } = await tmdb.get(`/movie/${tmdbId}/similar`, { params: { page } });
  return data.results.map(mapMovie);
}

export async function getRecommendedMovies(tmdbId: number, page = 1): Promise<Movie[]> {
  const { data } = await tmdb.get(`/movie/${tmdbId}/recommendations`, { params: { page } });
  return data.results.map(mapMovie);
}

// ─────────────────────────────────────────────────────────────────────
// TV Show helpers
// ─────────────────────────────────────────────────────────────────────
function mapTvShow(raw: any): TvShow {
  return {
    id: raw.id,
    name: raw.name ?? raw.title ?? 'Untitled',
    overview: raw.overview ?? '',
    posterPath: raw.poster_path ?? null,
    backdropPath: raw.backdrop_path ?? null,
    firstAirDate: raw.first_air_date ?? '',
    voteAverage: raw.vote_average ?? 0,
    genreIds: raw.genre_ids ?? raw.genres?.map((g: any) => g.id) ?? [],
  };
}

export async function getTrendingTv(window: 'day' | 'week' = 'week'): Promise<TvShow[]> {
  const { data } = await tmdb.get(`/trending/tv/${window}`);
  return data.results.map(mapTvShow);
}

export async function getPopularTv(page = 1): Promise<TvShow[]> {
  const { data } = await tmdb.get('/tv/popular', { params: { page } });
  return data.results.map(mapTvShow);
}

export async function getTopRatedTv(page = 1): Promise<TvShow[]> {
  const { data } = await tmdb.get('/tv/top_rated', { params: { page } });
  return data.results.map(mapTvShow);
}

export async function getGoatedTv(): Promise<TvShow[]> {
  const [p1, p2] = await Promise.all([getTopRatedTv(1), getTopRatedTv(2)]);
  return [...p1, ...p2];
}

export async function getAiringTodayTv(page = 1): Promise<TvShow[]> {
  const { data } = await tmdb.get('/tv/airing_today', { params: { page } });
  return data.results.map(mapTvShow);
}

export async function getTvShowDetails(tmdbId: number): Promise<TvShowDetail> {
  const { data } = await tmdb.get(`/tv/${tmdbId}`);
  return {
    id: data.id,
    name: data.name,
    overview: data.overview ?? '',
    posterPath: data.poster_path ?? null,
    backdropPath: data.backdrop_path ?? null,
    firstAirDate: data.first_air_date ?? '',
    voteAverage: data.vote_average ?? 0,
    genreIds: data.genres?.map((g: any) => g.id) ?? [],
    numberOfSeasons: data.number_of_seasons ?? 0,
    numberOfEpisodes: data.number_of_episodes ?? 0,
    status: data.status,
    networks: data.networks?.map((n: any) => n.name) ?? [],
    seasons: (data.seasons ?? [])
      .filter((s: any) => s.season_number > 0)
      .map((s: any) => ({
        id: s.id,
        name: s.name,
        seasonNumber: s.season_number,
        episodeCount: s.episode_count ?? 0,
        overview: s.overview ?? '',
        posterPath: s.poster_path ?? null,
        airDate: s.air_date ?? '',
      })),
  };
}

export async function getTvSeason(tmdbId: number, seasonNum: number): Promise<TvSeasonDetail> {
  const { data } = await tmdb.get(`/tv/${tmdbId}/season/${seasonNum}`);
  return {
    id: data.id,
    name: data.name,
    seasonNumber: data.season_number,
    overview: data.overview ?? '',
    posterPath: data.poster_path ?? null,
    airDate: data.air_date ?? '',
    episodes: (data.episodes ?? []).map((e: any) => ({
      id: e.id,
      name: e.name,
      episodeNumber: e.episode_number,
      seasonNumber: e.season_number,
      overview: e.overview ?? '',
      stillPath: e.still_path ?? null,
      airDate: e.air_date ?? '',
      runtime: e.runtime ?? null,
      voteAverage: e.vote_average ?? 0,
    })),
  };
}

export async function getSimilarTv(tmdbId: number): Promise<TvShow[]> {
  const { data } = await tmdb.get(`/tv/${tmdbId}/similar`);
  return data.results.map(mapTvShow);
}

export async function getRecommendedTv(tmdbId: number): Promise<TvShow[]> {
  const { data } = await tmdb.get(`/tv/${tmdbId}/recommendations`);
  return data.results.map(mapTvShow);
}

// ─────────────────────────────────────────────────────────────────────
// Anime (TMDB keyword 210024 = "anime")
// ─────────────────────────────────────────────────────────────────────
export async function getAnimeSeries(page = 1): Promise<TvShow[]> {
  const { data } = await tmdb.get('/discover/tv', {
    params: { with_keywords: 210024, sort_by: 'popularity.desc', page },
  });
  return data.results.map(mapTvShow);
}

export async function getGoatedAnime(): Promise<TvShow[]> {
  const [p1, p2] = await Promise.all([
    tmdb.get('/discover/tv', { params: { with_keywords: 210024, sort_by: 'vote_average.desc', 'vote_count.gte': 500, page: 1 } }),
    tmdb.get('/discover/tv', { params: { with_keywords: 210024, sort_by: 'vote_average.desc', 'vote_count.gte': 500, page: 2 } }),
  ]);
  return [...p1.data.results, ...p2.data.results].map(mapTvShow);
}

export async function getAnimeMovies(page = 1): Promise<Movie[]> {
  const { data } = await tmdb.get('/discover/movie', {
    params: { with_keywords: 210024, sort_by: 'popularity.desc', page },
  });
  return data.results.map(mapMovie);
}

export async function getTvGenres(): Promise<Genre[]> {
  const { data } = await tmdb.get('/genre/tv/list');
  return data.genres;
}

/** Episode still image URL */
export function stillUrl(path: string | null, size: 'w185' | 'w300' | 'w780' | 'original' = 'w300'): string | null {
  if (!path) return null;
  return `${IMAGE_BASE_URL}/${size}${path}`;
}
