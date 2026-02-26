import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Chat from '../components/Chat';
import { getRoomById } from '../services/roomService';

const ChannelChatPage = ({
  roomId,
  token,
  persona,
  onToast,
  onPersonaScoreChange,
  onRoomDeleted,
  onJoinRoom,
  onLeaveRoom
}) => {
  const [roomInfo, setRoomInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const loadRoom = useCallback(async () => {
    setLoading(true);
    const result = await getRoomById(roomId);
    if (result.success) {
      setRoomInfo(result.data);
      onJoinRoom(roomId);
    } else {
      onToast({ type: 'error', text: result.message || 'Channel not found.' });
      navigate('/channels', { replace: true });
    }
    setLoading(false);
  }, [roomId, onJoinRoom, onToast, navigate]);

  useEffect(() => {
    loadRoom();
  }, [loadRoom]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#e8f70c]">
        Loading channel...
      </div>
    );
  }

  if (!roomInfo) return null;

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <Chat
        token={token}
        persona={persona}
        roomInfo={roomInfo}
        initialUsersOpen={searchParams.get('panel') === 'people'}
        onLeave={() => {
          onLeaveRoom();
          navigate('/channels');
        }}
        onRoomDeleted={() => {
          onRoomDeleted();
          navigate('/channels');
        }}
        onToast={onToast}
        onRoomSettingsChanged={onPersonaScoreChange}
      />
    </div>
  );
};

export default ChannelChatPage;
