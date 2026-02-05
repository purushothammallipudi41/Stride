import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MusicProvider } from './context/MusicContext';
import { ServerProvider } from './context/ServerContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Sidebar from './components/layout/Sidebar';
import BottomPlayer from './components/layout/BottomPlayer';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const Explore = lazy(() => import('./pages/Explore'));
const Reels = lazy(() => import('./pages/Reels'));
const Messages = lazy(() => import('./pages/Messages'));
const Profile = lazy(() => import('./pages/Profile'));
const Servers = lazy(() => import('./pages/Servers'));
const ServerView = lazy(() => import('./pages/ServerView'));
const Login = lazy(() => import('./pages/Login'));
const Settings = lazy(() => import('./pages/Settings'));

const LoadingFallback = () => (
  <div className="flex-center" style={{ height: '100%', width: '100%' }}>
    <div className="loading-spinner"></div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MusicProvider>
          <ServerProvider>
            <Router>
              <div className="app-layout">
                <Sidebar />
                <main className="main-content">
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/explore" element={<Explore />} />
                      <Route path="/reels" element={<Reels />} />
                      <Route path="/messages" element={<Messages />} />
                      <Route path="/servers" element={<Servers />} />
                      <Route path="/servers/:serverId" element={<ServerView />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </main>
                <BottomPlayer />
              </div>
            </Router>
          </ServerProvider>
        </MusicProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
