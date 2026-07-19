/**
 * EmbedPlayer — fills exactly the viewport below the fixed navbar (64 px).
 * The iframe fills 100 % of that space; 111movies.net handles the 16:9
 * letterboxing internally so the video always looks correct.
 *
 * NOTE: The "locked in" badge, LOADMAXING text, and player icons are rendered
 * by 111movies.net inside a cross-origin iframe — we cannot modify them.
 * The iframe's own fullscreen button works via the allow="fullscreen *" policy.
 */
interface Props {
  embedUrl: string;
  title?: string;
}

export default function EmbedPlayer({ embedUrl, title = 'Player' }: Props) {
  return (
    <div
      style={{
        height: 'calc(100vh - 64px)',
        width: '100%',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* 16:9 inner box — width-constrained so height never exceeds viewport */}
      <div style={{
        position: 'relative',
        width: '100%',
        /* max width = (viewport-height - navbar) × (16/9), so it never overflows vertically */
        maxWidth: 'calc((100vh - 64px) * 16 / 9)',
        aspectRatio: '16 / 9',
      }}>
        <iframe
          src={embedUrl}
          title={title}
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen *; gyroscope; picture-in-picture; web-share"
          referrerPolicy="no-referrer-when-downgrade"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', display: 'block' }}
        />
      </div>
    </div>
  );
}
