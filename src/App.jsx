import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useMusic } from './context/MusicContext';
import { ServerProvider } from './context/ServerContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import { ContentProvider } from './context/ContentContext';
import Sidebar from './components/layout/Sidebar';
import ServerSidebar from './components/server/ServerSidebar';
import BottomPlayer from './components/layout/BottomPlayer';
import { MusicProvider } from './context/MusicContext';
import { ToastProvider } from './context/ToastContext';
import { CallProvider, useCall } from './context/CallContext';
import { VoiceProvider } from './context/VoiceContext';
import CallOverlay from './components/chat/CallOverlay';
import NativePermissions from './components/NativePermissions';
import ErrorBoundary from './components/common/ErrorBoundary';

// Global Call UI Wrapper
const GlobalCallUI = () => {
  const { callState, callType, endCall, caller, callee } = useCall();
  if (callState === 'IDLE') return null;
  const remoteUsername = callState === 'INCOMING' ? caller?.username : callee?.username;
  return (
    <CallOverlay
      username={remoteUsername || 'Unknown'}
      type={callType || 'video'}
      onEndCall={endCall}
    />
  );
};

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const Explore = lazy(() => import('./pages/Explore'));
const Reels = lazy(() => import('./pages/Reels'));
const Messages = lazy(() => import('./pages/Messages'));
const Profile = lazy(() => import('./pages/Profile'));
const ServerView = lazy(() => import('./pages/ServerView'));
const Login = lazy(() => import('./pages/Login'));
const Settings = lazy(() => import('./pages/Settings'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Search = lazy(() => import('./pages/Search'));
const AdsManager = lazy(() => import('./pages/AdsManager'));
const TermsOfService = lazy(() => import('./pages/legal/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'));
const ServerNavigation = lazy(() => import('./pages/ServerNavigation'));

const LoadingFallback = () => (
  <div className="flex-center" style={{ height: '100%', width: '100%' }}>
    <div className="loading-spinner"></div>
  </div>
);

// Auth Guard Components
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingFallback />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingFallback />;
  if (user && !location.state?.addAccount) return <Navigate to="/" replace />;
  return children;
};

const Layout = ({ children }) => {
  const { pathname } = useLocation();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isServerRoute = pathname.startsWith('/servers');
  const isMessagesRoute = pathname.startsWith('/messages');

  // Show server sidebar ONLY on server routes
  const showServerSidebar = !isAuthPage && isServerRoute;

  // Hide standard app sidebar ONLY if inside a server (but NOT on messages)
  const isInsideServer = (isServerRoute && pathname.split('/').length > 2);
  const showAppSidebar = !isAuthPage && !isInsideServer;

  // New: Centralized navigation visibility for layout adjustment
  const isNavHiddenOnMobile = [
    '/messages',
    '/notifications',
    '/reels'
  ].some(path => pathname.startsWith(path)) || isInsideServer;

  return (
    <div className={`app-layout ${isNavHiddenOnMobile ? 'mobile-nav-hidden' : ''}`}>
      {showServerSidebar && <ServerSidebar />}
      {showAppSidebar && <Sidebar />}
      <div className={`main-layout-content ${(isAuthPage || isInsideServer || pathname.startsWith('/profile') || pathname.startsWith('/reels') || pathname.startsWith('/messages') || pathname.startsWith('/notifications')) ? 'full-width' : ''}`}>
        {children}
      </div>
    </div>
  );
};

import { useNavigate } from 'react-router-dom';
import { CreateServerModal } from './components/server/ServerModals';
import { useServer } from './context/ServerContext';

// Global Server Modals Wrapper
const GlobalServerModals = () => {
  const { isCreateModalOpen, setIsCreateModalOpen, addServer } = useServer();
  const navigate = useNavigate();

  const handleCreateServer = async (data) => {
    const newServer = await addServer(data);
    if (newServer) {
      navigate(`/servers/${newServer.id}`);
      setIsCreateModalOpen(false);
    }
  };

  return (
    <CreateServerModal
      isOpen={isCreateModalOpen}
      onClose={() => setIsCreateModalOpen(false)}
      onCreate={handleCreateServer}
    />
  );
};

function App() {
  return (
    <ErrorBoundary>
      <NativePermissions />
      <AuthProvider>
        <SocketProvider>
          <VoiceProvider>
            <CallProvider>
              <NotificationProvider>
                <ContentProvider>
                  <MusicProvider>
                    <ServerProvider>
                      <ToastProvider>
                        <Router>
                          <GlobalServerModals />
                          <Layout>
                            <GlobalCallUI />
                            <main className="main-content">
                              <Suspense fallback={<LoadingFallback />}>
                                <Routes>
                                  <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                                  <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
                                  <Route path="/reels" element={<ProtectedRoute><Reels /></ProtectedRoute>} />
                                  <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                                  <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                                  <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                                  <Route path="/servers" element={<ProtectedRoute><ServerNavigation /></ProtectedRoute>} />
                                  <Route path="/servers/:serverId" element={<ProtectedRoute><ServerView /></ProtectedRoute>} />
                                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                                  <Route path="/profile/:identifier" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                                  <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                                  <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
                                  <Route path="/ads" element={<ProtectedRoute><AdsManager /></ProtectedRoute>} />

                                  <Route path="/legal/terms" element={<TermsOfService />} />
                                  <Route path="/legal/privacy" element={<PrivacyPolicy />} />

                                  <Route path="*" element={<Navigate to="/" replace />} />
                                </Routes>
                              </Suspense>
                            </main>
                            <MusicPlayerController />
                          </Layout>
                        </Router>
                      </ToastProvider>
                    </ServerProvider>
                  </MusicProvider>
                </ContentProvider>
              </NotificationProvider>
            </CallProvider>
          </VoiceProvider>
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const MusicPlayerController = () => {
  const { pathname } = useLocation();
  const { currentTrack } = useMusic();
  if (pathname !== '/explore' || !currentTrack) return null;
  return <BottomPlayer />;
};

export default App;
