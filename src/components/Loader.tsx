/** Netflix-style loader: sliding red bar across the top + centered spinner. */
export default function Loader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: '40vh' }}>
      {/* The red sliding bar — defined in index.css as .nf-loader-bar */}
      <div className="nf-loader-bar" />

      {/* Centered N-logo spinner */}
      <div className="flex flex-col items-center gap-3 mt-4">
        <div className="relative w-10 h-10">
          {/* Outer thin track */}
          <div className="absolute inset-0 rounded-full"
               style={{ border: '2px solid rgba(255,255,255,0.08)' }} />
          {/* Spinning red arc */}
          <div className="absolute inset-0 rounded-full animate-spin"
               style={{ border: '2px solid transparent', borderTopColor: '#E50914' }} />
        </div>
        {label && (
          <p className="text-xs font-medium tracking-wider" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {label}
          </p>
        )}
      </div>
    </div>
  );
}
