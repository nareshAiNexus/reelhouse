import { useRef, useState, useEffect } from 'react';

interface Props {
  children: React.ReactNode;
  className?: string;
}

export default function ScrollableRow({ children, className = '' }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [children]);

  const scrollBy = (amount: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
      // We check after a small delay to allow smooth scroll to finish
      setTimeout(checkScroll, 350);
    }
  };

  return (
    <div className={`relative group flex items-center ${className}`}>
      {/* Left button */}
      {canScrollLeft && (
        <button
          onClick={() => scrollBy(-300)}
          className="absolute left-0 z-10 h-full px-2 bg-gradient-to-r from-[#141414] to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          aria-label="Scroll left"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}

      {/* Scroll container */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full flex-nowrap whitespace-nowrap"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>

      {/* Right button */}
      {canScrollRight && (
        <button
          onClick={() => scrollBy(300)}
          className="absolute right-0 z-10 h-full px-2 bg-gradient-to-l from-[#141414] to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          aria-label="Scroll right"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}
    </div>
  );
}
