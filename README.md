# Reelhouse

A movie streaming front-end: browse trending titles, split by genre, search,
and play trailers/streams through an advanced video player.

## How the data flows

1. **Catalog data** (trending, search, genres, posters) comes from **TMDB**
   (The Movie Database). IMDb itself has no public API, so TMDB is used as the
   catalog layer — every TMDB movie can resolve to its `imdb_id`.
2. When you click a movie, the app:
   - looks up the movie's `imdb_id` via TMDB's `external_ids` endpoint
   - calls **your** backend at `{VITE_STREAM_API_BASE_URL}/movie/{imdbId}`
   - feeds whatever video URL your API returns into the player

## Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

```env
VITE_TMDB_API_KEY=...          # free key from https://www.themoviedb.org/settings/api
VITE_STREAM_API_BASE_URL=https://example.com   # your API's base URL/IP
```

If your endpoint requires an API key header, set `VITE_STREAM_API_KEY` and
`VITE_STREAM_API_KEY_HEADER` too.

Then run:

```bash
npm run dev       # http://localhost:5173
npm run build     # production build -> dist/
```

## Adjusting to your API's response shape

Your endpoint's exact JSON shape wasn't specified, so
`src/api/streamApi.ts` accepts several common shapes out of the box:

```json
{ "sources": [{ "url": "https://.../movie.m3u8", "type": "application/x-mpegURL", "label": "1080p" }] }
```
```json
{ "url": "https://.../movie.mp4" }
```
```json
"https://.../movie.mp4"
```

If your real response looks different, edit the `normalize()` function in
that file — it's the single place that maps your API's fields to the
player's expected `{ sources: [...] }` shape. `type` auto-detects `.m3u8`
(HLS), `.mpd` (DASH), `.webm`, and defaults to `video/mp4`.

## Video player features

Built on Video.js + `@videojs/http-streaming`:

- HLS/DASH adaptive streaming with a quality-level selector (auto-appears
  when your stream has multiple renditions)
- Play/pause, seek, volume, mute
- 10s skip forward/back buttons
- Playback speed control (0.5x–2x)
- Fullscreen and Picture-in-Picture
- Keyboard shortcuts (space to play/pause, arrow keys to seek/volume)
- Subtitle/caption track support (pass `subtitles` in your API response)
- Responsive/fluid layout

## Project structure

```
src/
  api/
    tmdb.ts        # TMDB catalog calls (trending, search, genres, details)
    streamApi.ts   # calls YOUR /movie/{imdbId} endpoint
  components/
    Navbar.tsx
    MovieCard.tsx
    MovieRow.tsx   # horizontal genre carousels
    VideoPlayer.tsx
    Loader.tsx
  pages/
    Home.tsx       # hero + trending + genre rows
    Search.tsx
    GenrePage.tsx  # full genre grid with pagination
    Watch.tsx       # detail + player
  types/movie.ts
```

## Notes

- Streaming actual copyrighted movie content requires proper licensing —
  this app is a technical scaffold for wiring up your own licensed/authorized
  video source, not a source of movie content itself.
- The production bundle is a single ~920KB JS chunk (Video.js is the bulk of
  it). If that matters for your deploy target, the `Watch` page is a good
  candidate for `React.lazy()` code-splitting.
