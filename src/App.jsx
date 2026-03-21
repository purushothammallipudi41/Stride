import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useUI } from './hooks/useUI';
import { MusicProvider } from './context/MusicContext';
import { ServerProvider } from './context/ServerContext';
import { UIProvider } from './context/UIContext';
import { ActivityProvider } from './context/ActivityContext';

// Pages
import Home from './pages/Home';
import Explore from './pages/Explore';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import More from './pages/More';
import Settings from './pages/Settings';
import Signup from './pages/Signup';
import Login from './pages/Login';
import VerifyEmail from './pages/VerifyEmail';
import ArtistDashboard from './pages/ArtistDashboard';
import Music from './pages/Music';
import Reels from './pages/Reels';
import Communities from './pages/Communities';
import Servers from './pages/Servers';
import ServerView from './pages/ServerView';
import PlaylistView from './pages/PlaylistView';

// Components
import Sidebar from './components/layout/Sidebar';
import GlobalNotifications from './components/GlobalNotifications';
import CreatePostModal from './components/CreatePostModal';

const AppContent = () => {
  const { isCreateModalOpen } = useUI();
  const location = useLocation();
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const isPublicPath = ['/login', '/signup', '/verify'].includes(location.pathname);

  useEffect(() => {
    if (!isAuthenticated && !isPublicPath) {
      // Redirect or handle guest state
    }
    
    // Apply dynamic theme if user has custom accent color
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.accentColor) {
      document.documentElement.style.setProperty('--theme-primary', user.accentColor);
      document.documentElement.style.setProperty('--theme-accent', user.accentColor + '80'); // 50% opacity for accent
      document.documentElement.style.setProperty('--theme-primary-glow', user.accentColor + '40');
    }
  }, [isAuthenticated, isPublicPath]);

  return (
    <div className="app-layout">
      {!isPublicPath && <Sidebar />}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/notifications" element={isAuthenticated ? <Notifications /> : <Navigate to="/login" />} />
          <Route path="/more" element={<More />} />
          <Route path="/settings" element={isAuthenticated ? <Settings /> : <Navigate to="/login" />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="/artist-dashboard" element={isAuthenticated ? <ArtistDashboard /> : <Navigate to="/login" />} />

          <Route path="/music" element={<Music />} />
          <Route path="/reels" element={<Reels />} />
          <Route path="/communities/discover" element={<Communities />} />
          <Route path="/servers" element={<Servers />} />
          <Route path="/community/:communityId" element={<ServerView />} />
          <Route path="/playlist/:id" element={<PlaylistView />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <GlobalNotifications />
      {isCreateModalOpen && <CreatePostModal />}
    </div>
  );
};

function App() {
  return (
    <MusicProvider>
      <ActivityProvider>
        <ServerProvider>
          <UIProvider>
            <Router>
              <AppContent />
            </Router>
          </UIProvider>
        </ServerProvider>
      </ActivityProvider>
    </MusicProvider>
  );
}


export default App;



