import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import socket from './services/socket';
import { useUI } from './hooks/useUI';
import { MusicProvider } from './context/MusicContext';
import { ServerProvider } from './context/ServerContext';
import { UIProvider } from './context/UIContext';
import { ActivityProvider } from './context/ActivityContext';
// Pages
const Home = lazy(() => import('./pages/Home'));
const Explore = lazy(() => import('./pages/Explore'));
const Messages = lazy(() => import('./pages/Messages'));
const Profile = lazy(() => import('./pages/Profile'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Settings = lazy(() => import('./pages/Settings'));
const Signup = lazy(() => import('./pages/Signup'));
const Login = lazy(() => import('./pages/Login'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ArtistDashboard = lazy(() => import('./pages/ArtistDashboard'));
const Music = lazy(() => import('./pages/Music'));
const Reels = lazy(() => import('./pages/Reels'));
const Communities = lazy(() => import('./pages/Communities'));
const Servers = lazy(() => import('./pages/Servers'));
const ServerView = lazy(() => import('./pages/ServerView'));
const PlaylistView = lazy(() => import('./pages/PlaylistView'));
const Articles = lazy(() => import('./pages/Articles'));
const Achievements = lazy(() => import('./pages/Achievements'));
const Insights = lazy(() => import('./pages/Insights'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const Wallet = lazy(() => import('./pages/Wallet'));

// Components
import Sidebar from './components/layout/Sidebar';
import GlobalNotifications from './components/GlobalNotifications';
import CreatePostModal from './components/CreatePostModal';
import ExploreModal from './components/ExploreModal';
import OnboardingModal from './components/OnboardingModal';
import CallOverlay from './components/chat/CallOverlay';

const AppContent = () => {
  const { isCreateModalOpen, isExplorerOpen } = useUI();
  const location = useLocation();
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const isPublicPath = ['/login', '/signup', '/verify'].includes(location.pathname);
  const [callInfo, setCallInfo] = useState({ isOpen: false, isIncoming: false, callerData: null, type: 'video' });

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

    if (isAuthenticated && user.username) {
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
  }, []);

  return (
    <div className="app-layout">
      {!isPublicPath && <Sidebar />}
      <main className="main-content">
        <Suspense fallback={<div className="loading-screen">Loading Stride...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
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
            <Route path="/community/:communityId" element={<ServerView />} />
            <Route path="/playlist/:id" element={<PlaylistView />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/wallet" element={isAuthenticated ? <Wallet /> : <Navigate to="/login" />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <GlobalNotifications />
      {isCreateModalOpen && <CreatePostModal />}
      {isExplorerOpen && <ExploreModal />}
      <OnboardingModal 
        isOpen={!localStorage.getItem('onboardingCompleted')} 
        onClose={() => {
            localStorage.setItem('onboardingCompleted', 'true');
            window.location.reload(); // Refresh to ensure state is clean
        }} 
      />
      
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
    </HelmetProvider>
  );
}


export default App;



