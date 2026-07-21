/**
 * EmbedPlayer — fills exactly the container provided to it.
 * The iframe fills 100% of that space.
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
    <div className="w-full h-full bg-black flex items-center justify-center overflow-hidden relative">
      <iframe
        src={embedUrl}
        title={title}
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen *; gyroscope; picture-in-picture; web-share"
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute inset-0 w-full h-full border-none block"
      />
    </div>
  );
}
