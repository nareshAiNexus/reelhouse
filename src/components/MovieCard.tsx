import { Link } from 'react-router-dom';
import type { Movie } from '../types/movie';
import { backdropUrl, posterUrl } from '../api/tmdb';
import { GENRE_MAP } from '../utils/genres';

interface Props {
  movie: Movie;
  /** 'landscape' = 16:9 backdrop card (rows), 'portrait' = 2:3 poster card (grids) */
  variant?: 'landscape' | 'portrait';
  showTitle?: boolean;
  rank?: number;
  /** Override the default /watch/:id link (e.g. for TV shows → /tv/:id) */
  to?: string;
  /** Badge label shown on the card e.g. 'SERIES', 'ANIME' */
  badge?: string;
}

export default function MovieCard({ movie, variant = 'landscape', showTitle = false, rank, to, badge }: Props) {
  const year   = movie.releaseDate?.slice(0, 4) ?? '';
  const match  = Math.round(movie.voteAverage * 10);
  const genres = movie.genreIds.slice(0, 2).map((id) => GENRE_MAP[id]).filter(Boolean);

  const imgSrc =
    variant === 'portrait'
      ? posterUrl(movie.posterPath, 'w342')
      : movie.backdropPath
        ? backdropUrl(movie.backdropPath, 'w780')
        : posterUrl(movie.posterPath, 'w500');

  const matchColor =
    match >= 70 ? 'text-green-400' : match >= 50 ? 'text-yellow-400' : 'text-red-400';

  const linkTo = to ?? (movie.mediaType === 'tv' ? `/tv/${movie.id}` : `/watch/${movie.id}`);
  const displayBadge = badge ?? (movie.mediaType === 'tv' ? 'SERIES' : undefined);

  return (
    /* 'group' on the root enables group-hover on child elements */
    <Link
      to={linkTo}
      className="group relative block w-full cursor-pointer transition-transform duration-300 hover:scale-105 hover:z-20"
      title={movie.title}
    >
      {/* ── Image container ── */}
      <div
        className={`relative w-full overflow-hidden rounded-sm bg-surface ${
          variant === 'portrait' ? 'aspect-[2/3]' : 'aspect-[2/3] sm:aspect-video'
        }`}
      >
        {/* Backdrop / Poster image */}
        <img
          src={imgSrc}
          alt={movie.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Rank badge */}
        {rank && rank <= 10 && (
          <div className="absolute top-0 left-0 bg-netflix text-white text-[10px] font-black px-2 py-0.5 rounded-br-md z-10">
            #{rank}
          </div>
        )}

        {/* Content type badge */}
        {displayBadge && !rank && (
          <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm tracking-widest z-10">
            {displayBadge.toUpperCase()}
          </div>
        )}

        {/* Dark gradient — visible on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* ── Info overlay (slides up on hover) ── */}
        <div className="absolute inset-x-0 bottom-0 p-2.5 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          {/* Action icons row */}
          <div className="flex items-center gap-1.5 mb-2">
            {/* Play */}
            <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0 shadow">
              <svg viewBox="0 0 24 24" fill="black" width="11" height="11"><path d="M8 5v14l11-7z"/></svg>
            </span>
            {/* Add to list */}
            <span className="w-7 h-7 rounded-full border-2 border-white/70 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="11" height="11">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </span>
            {/* Like */}
            <span className="w-7 h-7 rounded-full border-2 border-white/70 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="11" height="11">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"/>
                <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
              </svg>
            </span>
            {/* Chevron */}
            <span className="w-7 h-7 rounded-full border-2 border-white/70 flex items-center justify-center shrink-0 ml-auto">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="11" height="11">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </span>
          </div>

          {/* Title */}
          <p className="text-xs font-bold text-white line-clamp-1">{movie.title}</p>

          {/* Match + Year */}
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] font-bold ${matchColor}`}>{match}% Match</span>
            {year && <span className="text-[10px] text-white/60">{year}</span>}
          </div>

          {/* Genres */}
          {genres.length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              {genres.map((g, i) => (
                <span key={g} className="text-[10px] text-white/50">
                  {g}{i < genres.length - 1 ? ' · ' : ''}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Title below card (for search/grid layouts) */}
      {showTitle && (
        <p className="mt-1.5 text-xs text-muted group-hover:text-white transition-colors duration-200 line-clamp-1 px-0.5">
          {movie.title}
        </p>
      )}
    </Link>
  );
}
