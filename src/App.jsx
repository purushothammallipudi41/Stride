import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { HelmetProvider } from 'react-helmet-async';
import socket from './services/socket';
import { useUI } from './hooks/useUI';
import { getStoredUser } from './utils/storage';
import { MusicProvider } from './context/MusicContext';
import { ServerProvider } from './context/ServerContext';
import { UIProvider } from './context/UIContext';
import { ActivityProvider } from './context/ActivityContext';
import { Web3Provider } from './context/Web3Provider';

// Pages
import Home from './pages/Home';
import Explore from './pages/Explore';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
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
import Articles from './pages/Articles';
import Achievements from './pages/Achievements';
import Insights from './pages/Insights';
import Marketplace from './pages/Marketplace';
import Wallet from './pages/Wallet';

// Components
import Sidebar from './components/layout/Sidebar';
import GlobalNotifications from './components/GlobalNotifications';
import CreatePostModal from './components/CreatePostModal';
import ExploreModal from './components/ExploreModal';
import VaultModal from './components/social/VaultModal';
import OnboardingModal from './components/OnboardingModal';
import CallOverlay from './components/chat/CallOverlay';
import ErrorBoundary from './components/common/ErrorBoundary';

const AppContent = () => {
  const { isCreateModalOpen, isExplorerOpen, isVaultOpen, callInfo, setCallInfo } = useUI();
  const location = useLocation();
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const isPublicPath = ['/login', '/signup', '/verify'].includes(location.pathname);

  useEffect(() => {
    // Configure mobile status bar
    if (Capacitor.isNativePlatform()) {
      try {
        StatusBar.setOverlaysWebView({ overlay: true });
        StatusBar.setStyle({ style: Style.Dark });
      } catch (e) {
        console.warn('StatusBar plugin not fully available:', e);
      }
    }

    const user = getStoredUser();

    const applyTheme = (userData = {}) => {
      const storedColor = localStorage.getItem('stride_theme_color');
      const userColor = userData?.accentColor;
      const themeColor = storedColor || userColor || '#8b5cf6';
      
      const root = document.documentElement;
      root.style.setProperty('--theme-primary', themeColor);
      root.style.setProperty('--theme-accent', themeColor + '80');
      root.style.setProperty('--theme-primary-glow', themeColor + '40');
      document.body.style.setProperty('--theme-primary', themeColor);
    };

    applyTheme(user);

    if (isAuthenticated && user?.username) {
        socket.emit('register_user', user);
        socket.emit('join_user_room', user.username);
    }
  }, [isAuthenticated, isPublicPath]);

  useEffect(() => {
    socket.on('incoming-call', (data) => {
        setCallInfo({ isOpen: true, isIncoming: true, callerData: data, type: data.type || 'video' });
    });

    socket.on('start-direct-call', (data) => {
        setCallInfo({ isOpen: true, isIncoming: false, callerData: data, type: data.type || 'video' });
    });

    return () => {
        socket.off('incoming-call');
        socket.off('start-direct-call');
    };
  }, [setCallInfo]);

  return (
    <div className="app-layout">
      {!isPublicPath && <Sidebar />}
      
      <div className="layout-primary">
        <main className="main-content">
          <ErrorBoundary>
            <div className="full-view-container">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
                <Route path="/profile/:username" element={<Profile />} />
                <Route path="/notifications" element={isAuthenticated ? <Notifications /> : <Navigate to="/login" />} />
                <Route path="/settings" element={isAuthenticated ? <Settings /> : <Navigate to="/login" />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/login" element={<Login />} />
                <Route path="/verify" element={<VerifyEmail />} />
                <Route path="/artist-dashboard" element={isAuthenticated ? <ArtistDashboard /> : <Navigate to="/login" />} />
                <Route path="/music" element={<Music />} />
                <Route path="/reels" element={<Reels />} />
                <Route path="/communities/discover" element={<Communities />} />
                <Route path="/servers" element={<Servers />} />
                <Route path="/community/:communityId/:channelId?" element={<ServerView />} />
                <Route path="/playlist/:id" element={<PlaylistView />} />
                <Route path="/articles" element={<Articles />} />
                <Route path="/achievements" element={<Achievements />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/wallet" element={isAuthenticated ? <Wallet /> : <Navigate to="/login" />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              
              {isCreateModalOpen && <CreatePostModal />}
              {isExplorerOpen && <ExploreModal />}
              {isVaultOpen && <VaultModal />}
            </div>
          </ErrorBoundary>
        </main>
      </div>

      {isAuthenticated && (
          <OnboardingModal 
            isOpen={!localStorage.getItem('onboardingCompleted')} 
            onClose={() => {
                localStorage.setItem('onboardingCompleted', 'true');
                window.location.reload();
            }} 
          />
      )}
      
      {callInfo.isOpen && (
        <CallOverlay 
            isOpen={callInfo.isOpen}
            isIncoming={callInfo.isIncoming}
            callerData={callInfo.callerData}
            callType={callInfo.type}
            onReject={() => setCallInfo({ ...callInfo, isOpen: false })}
            onEnd={() => setCallInfo({ ...callInfo, isOpen: false })}
        />
      )}
    </div>
  );
};

function App() {
  return (
    <HelmetProvider>
      <Web3Provider>
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
      </Web3Provider>
    </HelmetProvider>
  );
}

export default App;



