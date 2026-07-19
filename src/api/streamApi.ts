/**
 * Embed URL builder for 111movies.net
 *
 * Accepts either a TMDB numeric ID or an IMDb ID (tt-prefixed string).
 *
 * Movie:  https://111movies.net/movie/{id}
 * TV:     https://111movies.net/tv/{id}/{season}/{episode}
 */
const BASE = 'https://111movies.net';

export function getMovieEmbedUrl(id: string | number): string {
  return `${BASE}/movie/${id}`;
}

export function getTvEmbedUrl(id: string | number, season: number, episode: number): string {
  return `${BASE}/tv/${id}/${season}/${episode}`;
}
