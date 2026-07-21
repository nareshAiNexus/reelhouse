import { useRef } from 'react';
import { Link } from 'react-router-dom';
import type { TvShow } from '../types/tv';
import TvCard from './TvCard';

interface Props {
  title: string;
  shows: TvShow[];
  viewAllHref?: string;
  variant?: 'landscape' | 'portrait';
  showRanks?: boolean;
}

export default function TvRow({ title, shows, viewAllHref, variant = 'landscape', showRanks = false }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollBy(delta: number) {
    scrollerRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  }

  if (!shows.length) return null;

  const cardCls   = variant === 'portrait' ? 'w-[100px] sm:w-[200px] lg:w-[240px]' : 'w-[110px] sm:w-[320px] lg:w-[380px]';
  const scrollDelta = variant === 'portrait' ? 800 : 1200;

  return (
    <section className="group/row py-3">
      <div className="px-4 sm:px-8 lg:px-14 mb-2 flex items-center gap-3">
        <h2 className="text-sm sm:text-base lg:text-lg font-bold text-white tracking-wide">{title}</h2>
        {viewAllHref && (
          <Link
            to={viewAllHref}
            className="text-xs text-netflix font-semibold opacity-0 group-hover/row:opacity-100 transition-opacity duration-300 hover:underline"
          >
            Explore All &rsaquo;
          </Link>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => scrollBy(-scrollDelta)}
          aria-label="Scroll left"
          className="absolute left-0 top-0 bottom-0 z-30 w-10 sm:w-14 bg-gradient-to-r from-void via-void/80 to-transparent flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity duration-200"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" width="22" height="22">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>

        <div ref={scrollerRef} className="flex gap-2 overflow-x-auto scrollbar-hide px-4 sm:px-8 lg:px-14 py-6 -my-6">
          {shows.map((s, i) => (
            <div key={s.id} className={`${cardCls} shrink-0`}>
              <TvCard show={s} variant={variant} rank={showRanks ? i + 1 : undefined} />
            </div>
          ))}
        </div>

        <button
          onClick={() => scrollBy(scrollDelta)}
          aria-label="Scroll right"
          className="absolute right-0 top-0 bottom-0 z-30 w-10 sm:w-14 bg-gradient-to-l from-void via-void/80 to-transparent flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity duration-200"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" width="22" height="22">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
    </section>
  );
}
