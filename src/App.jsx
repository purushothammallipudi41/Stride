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
import Studio from './pages/Studio';
import LiveStage from './pages/LiveStage';
import Governance from './pages/Governance';
import Checkout from './pages/Checkout';

// Components
import Sidebar from './components/layout/Sidebar';
import GlobalNotifications from './components/GlobalNotifications';
import CreatePostModal from './components/CreatePostModal';
import CreateArticleModal from './components/CreateArticleModal';
import ExploreModal from './components/ExploreModal';
import VaultModal from './components/social/VaultModal';
import OnboardingModal from './components/OnboardingModal';
import CallOverlay from './components/chat/CallOverlay';
import LiveOverlay from './components/chat/LiveOverlay';
import OfflineStatus from './components/common/OfflineStatus';
import PushManager from './components/notifications/PushManager';
import ErrorBoundary from './components/common/ErrorBoundary';

const AppContent = () => {
  const { isCreateModalOpen, isExplorerOpen, isVaultOpen, isStoryModalOpen, callInfo, setCallInfo, liveInfo, setLiveInfo } = useUI();
  const location = useLocation();
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const isPublicPath = ['/login', '/signup', '/verify'].includes(location.pathname);

    const requestEssentialPermissions = async () => {
        if (Capacitor.isNativePlatform() && isPublicPath) {
            try {
                const { Camera } = await import('@capacitor/camera');
                const { PushNotifications } = await import('@capacitor/push-notifications');
                
                await Camera.requestPermissions();
                await PushNotifications.requestPermissions();
            } catch (e) {
                console.warn('Permission request failed:', e);
            }
        }
    };

    useEffect(() => {
        // Configure mobile status bar
        if (Capacitor.isNativePlatform()) {
            try {
                StatusBar.setOverlaysWebView({ overlay: true });
                StatusBar.setStyle({ style: Style.Light });
            } catch (e) {
                console.warn('StatusBar plugin not fully available:', e);
            }
        }

        requestEssentialPermissions();

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
      {!isPublicPath && !isStoryModalOpen && !location.pathname.startsWith('/live/') && <Sidebar />}
      
      <div className="layout-primary">
        <main className="main-content">
          <ErrorBoundary>
            <div className="full-view-container">
              <Routes>
                <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/login" replace />} />
                <Route path="/explore" element={isAuthenticated ? <Explore /> : <Navigate to="/login" replace />} />
                <Route path="/messages" element={isAuthenticated ? <Messages /> : <Navigate to="/login" replace />} />
                <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" replace />} />
                <Route path="/profile/:username" element={isAuthenticated ? <Profile /> : <Navigate to="/login" replace />} />
                <Route path="/notifications" element={isAuthenticated ? <Notifications /> : <Navigate to="/login" replace />} />
                <Route path="/settings" element={isAuthenticated ? <Settings /> : <Navigate to="/login" replace />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
                <Route path="/verify" element={<VerifyEmail />} />
                <Route path="/artist-dashboard" element={isAuthenticated ? <ArtistDashboard /> : <Navigate to="/login" replace />} />
                <Route path="/music" element={isAuthenticated ? <Music /> : <Navigate to="/login" replace />} />
                <Route path="/reels" element={isAuthenticated ? <Reels /> : <Navigate to="/login" replace />} />
                <Route path="/communities/discover" element={isAuthenticated ? <Communities /> : <Navigate to="/login" replace />} />
                <Route path="/communities/joined" element={isAuthenticated ? <Servers /> : <Navigate to="/login" replace />} />
                <Route path="/servers" element={isAuthenticated ? <Navigate to="/communities/joined" replace /> : <Navigate to="/login" replace />} />
                <Route path="/communities" element={isAuthenticated ? <Navigate to="/communities/discover" replace /> : <Navigate to="/login" replace />} />
                <Route path="/community/:communityId/:channelId?" element={isAuthenticated ? <ServerView /> : <Navigate to="/login" replace />} />
                <Route path="/playlist/:id" element={isAuthenticated ? <PlaylistView /> : <Navigate to="/login" replace />} />
                <Route path="/articles" element={isAuthenticated ? <Articles /> : <Navigate to="/login" replace />} />
                <Route path="/achievements" element={isAuthenticated ? <Achievements /> : <Navigate to="/login" replace />} />
                <Route path="/insights" element={isAuthenticated ? <Insights /> : <Navigate to="/login" replace />} />
                <Route path="/marketplace" element={isAuthenticated ? <Marketplace /> : <Navigate to="/login" replace />} />
                <Route path="/wallet" element={isAuthenticated ? <Wallet /> : <Navigate to="/login" replace />} />
                <Route path="/studio" element={isAuthenticated ? <Studio /> : <Navigate to="/login" replace />} />
                <Route path="/live/:username" element={isAuthenticated ? <LiveStage /> : <Navigate to="/login" replace />} />
                <Route path="/governance" element={isAuthenticated ? <Governance /> : <Navigate to="/login" replace />} />
                <Route path="/checkout" element={isAuthenticated ? <Checkout /> : <Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              
              {isCreateModalOpen && <CreatePostModal />}
              <CreateArticleModal />
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

      {liveInfo?.isOpen && (
        <LiveOverlay 
            streamId={liveInfo.streamId}
            streamerName={liveInfo.streamerName}
            communityName={liveInfo.communityName}
            onClose={() => setLiveInfo({ ...liveInfo, isOpen: false })}
        />
      )}

      <OfflineStatus />
      <PushManager />
      <GlobalNotifications />
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
                  
                  {/* Global Branding Gradients */}
                  <svg style={{ width: 0, height: 0, position: 'absolute' }} aria-hidden="true">
                    <defs>
                      <linearGradient id="stride-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-primary)" />
                        <stop offset="100%" stopColor="var(--color-accent)" />
                      </linearGradient>
                    </defs>
                  </svg>
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



