import React, { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';
import { CreateServerModal } from './components/server/ServerModals';

import { useAuth, AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { VoiceProvider } from './context/VoiceContext';
import { CallProvider, useCall } from './context/CallContext';
import { NotificationProvider } from './context/NotificationContext';
import { ContentProvider } from './context/ContentContext';
import { MusicProvider, useMusic } from './context/MusicContext';
import { ToastProvider } from './context/ToastContext';
import { ServerProvider, useServer } from './context/ServerContext';
import { HapticProvider } from './context/HapticContext';
import { SecurityProvider } from './context/SecurityContext';
import { GamificationProvider } from './context/GamificationContext';

import Sidebar from './components/layout/Sidebar';
import ServerSidebar from './components/server/ServerSidebar';
import CallOverlay from './components/chat/CallOverlay';
import BottomPlayer from './components/layout/BottomPlayer';
import CanvasView from './components/layout/CanvasView';
import NativePermissions from './components/NativePermissions';
import { ShortcutProvider } from './context/ShortcutContext';
import CommandPalette from './components/common/CommandPalette';
import MobileTopBar from './components/layout/MobileTopBar';

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
const CreatorDashboard = lazy(() => import('./pages/CreatorDashboard'));
const ExploreServers = lazy(() => import('./pages/ExploreServers'));
const InvitePage = lazy(() => import('./pages/InvitePage'));
const MarketplacePage = lazy(() => import('./pages/MarketplacePage'));
const ReferralPage = lazy(() => import('./pages/ReferralPage'));
const SpacesPage = lazy(() => import('./pages/SpacesPage'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
const WikiPage = lazy(() => import('./pages/WikiPage'));
const StrideInsights = lazy(() => import('./pages/StrideInsights'));
const HashtagPage = lazy(() => import('./pages/HashtagPage'));
const AchievementsPage = lazy(() => import('./pages/AchievementsPage'));
const ModerationPage = lazy(() => import('./pages/ModerationPage'));

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
  const isDiscoveryPage = pathname === '/servers/explore';

  // Show server sidebar ONLY on server routes (but NOT on discovery)
  const showServerSidebar = !isAuthPage && isServerRoute && !isDiscoveryPage;

  // Hide standard app sidebar ONLY if inside a server (but NOT on messages)
  const isInsideServer = (isServerRoute && pathname.split('/').length > 2);
  const showAppSidebar = !isAuthPage && (!isInsideServer || isDiscoveryPage);

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
      <HapticProvider>
        <AuthProvider>
          <SocketProvider>
            <SecurityProvider>
              <VoiceProvider>

                <CallProvider>
                  <NotificationProvider>
                    <ContentProvider>
                      <MusicProvider>
                        <ServerProvider>
                          <ToastProvider>
                            <ShortcutProvider>
                              <GamificationProvider>
                                <Router>
                                  <CommandPalette />
                                  <GlobalServerModals />
                                  <Layout>
                                    <GlobalCallUI />
                                    <MobileTopBar />
                                    <main className="main-content">
                                      <Suspense fallback={<LoadingFallback />}>
                                        <Routes>
                                          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                                          <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
                                          <Route path="/reels" element={<ProtectedRoute><Reels /></ProtectedRoute>} />
                                          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                                          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                                          <Route path="/servers" element={<ProtectedRoute><ServerNavigation /></ProtectedRoute>} />
                                          <Route path="/servers/explore" element={<ProtectedRoute><ExploreServers /></ProtectedRoute>} />
                                          <Route path="/servers/:serverId" element={<ProtectedRoute><ServerView /></ProtectedRoute>} />
                                          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                                          <Route path="/profile/:identifier" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                                          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                                          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                                          <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
                                          <Route path="/ads" element={<ProtectedRoute><AdsManager /></ProtectedRoute>} />
                                          <Route path="/dashboard" element={<ProtectedRoute><CreatorDashboard /></ProtectedRoute>} />
                                          <Route path="/marketplace" element={<ProtectedRoute><MarketplacePage /></ProtectedRoute>} />
                                          <Route path="/referral" element={<ProtectedRoute><ReferralPage /></ProtectedRoute>} />
                                          <Route path="/spaces" element={<ProtectedRoute><SpacesPage /></ProtectedRoute>} />
                                          <Route path="/articles" element={<ProtectedRoute><ArticlePage /></ProtectedRoute>} />
                                          <Route path="/articles/:id" element={<ProtectedRoute><ArticlePage /></ProtectedRoute>} />
                                          <Route path="/servers/:serverId/wiki" element={<ProtectedRoute><WikiPage /></ProtectedRoute>} />
                                          <Route path="/insights" element={<ProtectedRoute><StrideInsights /></ProtectedRoute>} />
                                          <Route path="/hashtag/:tag" element={<ProtectedRoute><HashtagPage /></ProtectedRoute>} />
                                          <Route path="/achievements" element={<ProtectedRoute><AchievementsPage /></ProtectedRoute>} />
                                          <Route path="/servers/:serverId/moderation" element={<ProtectedRoute><ModerationPage /></ProtectedRoute>} />

                                          {/* Invite flow is public so non-logged in users can see the join screen */}
                                          <Route path="/invite/:code" element={<InvitePage />} />

                                          <Route path="/legal/terms" element={<TermsOfService />} />
                                          <Route path="/legal/privacy" element={<PrivacyPolicy />} />

                                          <Route path="*" element={<Navigate to="/" replace />} />
                                        </Routes>
                                      </Suspense>
                                    </main>
                                    <MusicPlayerController />
                                  </Layout>
                                </Router>
                              </GamificationProvider>
                            </ShortcutProvider>
                          </ToastProvider>
                        </ServerProvider>
                      </MusicProvider>
                    </ContentProvider>
                  </NotificationProvider>
                </CallProvider>
              </VoiceProvider>
            </SecurityProvider>
          </SocketProvider>

        </AuthProvider>
      </HapticProvider>
    </ErrorBoundary>
  );
}

const MusicPlayerController = () => {
  const { pathname } = useLocation();
  const { currentTrack } = useMusic();
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);

  if (!currentTrack) return null;

  // Only show bottom bar on Explore for now, but Canvas can be toggled
  const showBottomBar = pathname === '/explore';

  return (
    <>
      {showBottomBar && <BottomPlayer onExpand={() => setIsCanvasOpen(true)} />}
      <CanvasView isOpen={isCanvasOpen} onClose={() => setIsCanvasOpen(false)} />
    </>
  );
};

export default App;
