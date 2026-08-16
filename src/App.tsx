import { Route, Routes } from 'react-router-dom';
import Navbar        from './components/Navbar';
import BottomNav     from './components/BottomNav';
import Home          from './pages/Home';
import Search        from './pages/Search';
import GenrePage     from './pages/GenrePage';
import GenrePageTv   from './pages/GenrePageTv';
import GenrePageAnime from './pages/GenrePageAnime';
import Watch         from './pages/Watch';
import TvShows       from './pages/TvShows';
import TvDetail      from './pages/TvDetail';
import WatchTv       from './pages/WatchTv';
import Anime         from './pages/Anime';
import Music         from './pages/Music';
import Auth          from './pages/Auth';
import Profile       from './pages/Profile';
import { MusicProvider } from './context/MusicContext';
import { AuthProvider }  from './context/AuthContext';
import MusicPlayer   from './components/MusicPlayer';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <MusicProvider>
        <div className="min-h-screen bg-void text-ink">
          <Navbar />
          <main className="pb-16">
            <Routes>
              {/* Auth */}
              <Route path="/auth"    element={<Auth />} />

              {/* Profile (protected) */}
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

              {/* Movies */}
              <Route path="/"               element={<Home />} />
              <Route path="/search"         element={<Search />} />
              <Route path="/genre/:genreId" element={<GenrePage />} />
              <Route path="/watch/:tmdbId"  element={<Watch />} />

              {/* TV Shows */}
              <Route path="/tv-shows"                            element={<TvShows />} />
              <Route path="/genre-tv/:genreId"                   element={<GenrePageTv />} />
              <Route path="/tv/:tmdbId"                          element={<TvDetail />} />
              <Route path="/watch-tv/:tmdbId/:season/:episode"   element={<WatchTv />} />

              {/* Anime */}
              <Route path="/anime"                element={<Anime />} />
              <Route path="/genre-anime/:genreId" element={<GenrePageAnime />} />

              {/* Music */}
              <Route path="/music" element={<Music />} />
            </Routes>
          </main>
          <MusicPlayer />
          <BottomNav />
        </div>
      </MusicProvider>
    </AuthProvider>
  );
}
