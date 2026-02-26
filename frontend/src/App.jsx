import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ErrorBoundary from './components/ui/ErrorBoundary';
import NotificationsPanel from './components/panels/NotificationsPanel';
import ToastViewport from './components/panels/ToastViewport';
import { useAuth } from './contexts/AuthContext';
import { useRoom } from './contexts/RoomContext';
import { useUI } from './contexts/UIContext';
import { computeProfileStats } from './utils/featureUtils';
import SplashPage from './pages/SplashPage';
import OnboardingPage from './pages/OnboardingPage';
import ChannelBrowserPage from './pages/ChannelBrowserPage';
import JoinPrivateChannelPage from './pages/JoinPrivateChannelPage';
import ChannelChatPage from './pages/ChannelChatPage';
import PeopleRouteBridge from './pages/PeopleRouteBridge';
import PrivacyPage from './pages/PrivacyPage';
import ProfilePage from './pages/ProfilePage';

const LoadingScreen = () => (
  <div className="min-h-screen bg-[#040603] flex items-center justify-center text-[#e8f70c]">
    <div className="animate-pulse text-sm font-semibold tracking-[0.22em] uppercase">Loading Jungle</div>
  </div>
);

const RequireAuth = ({ isAuthenticated, loading, children }) => {
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/onboarding" replace />;
  return children;
};

const JoinRoute = ({ rooms, roomsLoading, refreshRooms, onJoinByRoomId, onToast }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleJoinByCode = async (code) => {
    let pool = rooms;
    let target = pool.find((room) => (room.accessCode || '').toUpperCase() === code.toUpperCase());

    if (!target) {
      const result = await refreshRooms();
      if (result.success) {
        pool = result.data;
        target = pool.find((room) => (room.accessCode || '').toUpperCase() === code.toUpperCase());
      }
    }

    if (!target) {
      onToast({ type: 'error', text: 'Invite code not found.' });
      return;
    }

    onJoinByRoomId(target.id);
    navigate(`/channels/${target.id}`);
  };

  return (
    <JoinPrivateChannelPage
      initialCode={searchParams.get('room') || ''}
      onJoinByCode={handleJoinByCode}
      onBack={() => navigate('/channels')}
      loading={roomsLoading}
    />
  );
};

const ChatRoute = ({ token, persona, onToast, onRoomDeleted, onPersonaScoreChange, onJoinRoom, onLeaveRoom }) => {
  const { roomId } = useParams();

  if (!roomId) {
    return <Navigate to="/channels" replace />;
  }

  return (
    <ChannelChatPage
      roomId={roomId}
      token={token}
      persona={persona}
      onToast={onToast}
      onRoomDeleted={onRoomDeleted}
      onPersonaScoreChange={onPersonaScoreChange}
      onJoinRoom={onJoinRoom}
      onLeaveRoom={onLeaveRoom}
    />
  );
};

function App() {
  const { persona, token, loading: authLoading, isAuthenticated, refreshPersona, logout } = useAuth();
  const { rooms, roomsLoading, joinRoom, leaveRoom, refreshRooms } = useRoom();
  const { notificationsOpen, setNotificationsOpen, pushToast } = useUI();

  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) return;
    refreshRooms();
  }, [isAuthenticated, refreshRooms]);

  const notify = useCallback((toast) => {
    pushToast(toast);
    setNotifications((prev) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        text: toast.text,
        timestamp: new Date().toISOString()
      },
      ...prev
    ]);
  }, [pushToast]);

  const personaView = useMemo(() => {
    if (!persona) return null;
    return {
      ...persona,
      name: persona.alias
    };
  }, [persona]);

  const stats = useMemo(() => {
    if (!personaView) return { roomsCreated: 0, rewards: 0 };
    return computeProfileStats({ rooms, personaId: personaView.id });
  }, [rooms, personaView]);

  const onIdentityComplete = async () => {
    await refreshRooms();
    notify({ type: 'success', text: 'Welcome to the jungle.' });
  };

  const onJoinRoom = (roomId) => {
    joinRoom(roomId);
    navigate(`/channels/${roomId}`);
  };

  const onRoomDeleted = () => {
    leaveRoom();
    navigate('/channels');
  };

  const handlePanicReset = () => {
    logout();
    leaveRoom();
    setNotifications([]);
    setNotificationsOpen(false);
  };

  if (authLoading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-[100dvh] bg-[#040603] text-white font-sans selection:bg-[#e8f70c] selection:text-black relative">
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute inset-0 bg-noise opacity-20 z-0" />
          <div className="absolute -top-[30%] -left-[20%] w-[70vw] h-[70vw] bg-[#b7cf07]/20 rounded-full blur-[130px]" />
          <div className="absolute top-[45%] -right-[10%] w-[60vw] h-[60vw] bg-[#1b5f23]/10 rounded-full blur-[130px]" />
        </div>

        {isAuthenticated && personaView && (
          <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
            <Link to="/privacy" className="rounded-full border border-white/15 bg-black/35 px-4 py-2 text-sm hover:border-white/30">Privacy</Link>
            <Link to="/profile" className="rounded-full border border-white/15 bg-black/35 px-4 py-2 text-sm hover:border-white/30">Profile</Link>
          </div>
        )}

        <div className="relative z-10">
          <Routes>
            <Route path="/" element={isAuthenticated ? <Navigate to="/channels" replace /> : <SplashPage />} />
            <Route
              path="/onboarding"
              element={isAuthenticated ? <Navigate to="/channels" replace /> : <OnboardingPage onComplete={onIdentityComplete} />}
            />
            <Route
              path="/channels"
              element={(
                <RequireAuth isAuthenticated={isAuthenticated} loading={authLoading}>
                  {personaView && (
                    <ChannelBrowserPage
                      persona={personaView}
                      onJoinRoom={onJoinRoom}
                      onOpenNotifications={() => setNotificationsOpen((value) => !value)}
                      notifications={notifications}
                      onToast={notify}
                    />
                  )}
                </RequireAuth>
              )}
            />
            <Route
              path="/channels/:roomId"
              element={(
                <RequireAuth isAuthenticated={isAuthenticated} loading={authLoading}>
                  {token && personaView && (
                    <ChatRoute
                      token={token}
                      persona={personaView}
                      onToast={notify}
                      onRoomDeleted={onRoomDeleted}
                      onJoinRoom={joinRoom}
                      onLeaveRoom={leaveRoom}
                      onPersonaScoreChange={(updateFn) => {
                        if (!personaView) return;
                        const next = typeof updateFn === 'function' ? updateFn(personaView) : updateFn;
                        if (next?.score !== personaView.score) {
                          refreshPersona();
                        }
                      }}
                    />
                  )}
                </RequireAuth>
              )}
            />
            <Route
              path="/join"
              element={(
                <RequireAuth isAuthenticated={isAuthenticated} loading={authLoading}>
                  <JoinRoute
                    rooms={rooms}
                    roomsLoading={roomsLoading}
                    refreshRooms={refreshRooms}
                    onJoinByRoomId={joinRoom}
                    onToast={notify}
                  />
                </RequireAuth>
              )}
            />
            <Route
              path="/people/:roomId"
              element={(
                <RequireAuth isAuthenticated={isAuthenticated} loading={authLoading}>
                  <PeopleRouteBridge />
                </RequireAuth>
              )}
            />
            <Route
              path="/privacy"
              element={(
                <RequireAuth isAuthenticated={isAuthenticated} loading={authLoading}>
                  <PrivacyPage onToast={notify} onAfterPanicReset={handlePanicReset} />
                </RequireAuth>
              )}
            />
            <Route
              path="/profile"
              element={(
                <RequireAuth isAuthenticated={isAuthenticated} loading={authLoading}>
                  {personaView && <ProfilePage persona={personaView} stats={stats} />}
                </RequireAuth>
              )}
            />
            <Route path="*" element={<Navigate to={isAuthenticated ? '/channels' : '/'} replace />} />
          </Routes>
        </div>

        {notificationsOpen && (
          <NotificationsPanel
            notifications={notifications}
            onClose={() => setNotificationsOpen(false)}
          />
        )}

        <ToastViewport />
      </div>
    </ErrorBoundary>
  );
}

export default App;
