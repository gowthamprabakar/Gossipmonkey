import { useEffect, useMemo, useRef, useState } from 'react';
import ChatInput from './ui/ChatInput';
import ChatSettingsModal from './ChatSettingsModal';
import {
  connectSocket,
  disconnectSocket,
  joinRoom,
  leaveRoom,
  onSocket,
  offSocket,
  sendMessage,
  reactMessage,
  flagMessage,
  deleteMessage,
  tipUser,
  kickUser,
  approveEntry,
  deleteRoom,
  requestRoomAdminData,
  updateRoomSettingsSocket,
  resolveFlag,
  unbanUser,
  resetMonkeyMemory
} from '../services/socketService';

const REWARD_PATTERN = /(earned|\+\d+\s*bananas?)/i;

const formatTime = (ts) => {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

const formatDateChip = (messages) => {
  const first = messages.find((m) => m?.timestamp)?.timestamp;
  const base = first ? new Date(first) : new Date();
  return base.toLocaleDateString(undefined, {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '.');
};

const countReactions = (reactions = {}) => (
  Object.entries(
    Object.values(reactions).reduce((acc, emoji) => {
      acc[emoji] = (acc[emoji] || 0) + 1;
      return acc;
    }, {})
  )
);

const StateCard = ({ title, description, actionText, onAction }) => (
  <div className="flex flex-col h-full w-full bg-black border border-terminal-green/50 items-center justify-center p-8 text-center font-mono text-terminal-green">
    <h3 className="text-2xl font-bold mb-4 border-b border-terminal-green pb-2">[ {title.toUpperCase()} ]</h3>
    <p className="text-terminal-dim mb-8 max-w-md">
      &gt; {description}
    </p>
    <button
      onClick={onAction}
      className="bg-terminal-green text-black px-6 py-2 uppercase font-bold hover:bg-white"
    >
      {actionText}
    </button>
  </div>
);

const Chat = ({ token, persona, roomInfo, onLeave, onRoomDeleted, onToast, onRoomSettingsChanged, initialUsersOpen = false }) => {
  const roomId = roomInfo?.id;
  const isAdmin = roomInfo?.creatorId === persona.id;

  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [pendingKnocks, setPendingKnocks] = useState([]);
  const [flags, setFlags] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [roomSettings, setRoomSettings] = useState(roomInfo?.settings || {});
  const [monkeyConfig, setMonkeyConfig] = useState(roomInfo?.monkeyConfig || {});
  const [systemStatus, setSystemStatus] = useState({ aiAvailable: true, reason: null });
  const [kicked, setKicked] = useState(false);
  const [knockPending, setKnockPending] = useState(false);
  const [entryDenied, setEntryDenied] = useState('');

  const [showUsers, setShowUsers] = useState(initialUsersOpen);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const messagesEndRef = useRef(null);
  const onToastRef = useRef(onToast);
  const onRoomDeletedRef = useRef(onRoomDeleted);
  const onRoomSettingsChangedRef = useRef(onRoomSettingsChanged);
  useEffect(() => { onToastRef.current = onToast; }, [onToast]);
  useEffect(() => { onRoomDeletedRef.current = onRoomDeleted; }, [onRoomDeleted]);
  useEffect(() => { onRoomSettingsChangedRef.current = onRoomSettingsChanged; }, [onRoomSettingsChanged]);

  const bananas = useMemo(() => persona.score || 100, [persona.score]);

  const troopGroups = useMemo(() => {
    const admins = participants.filter((p) => p.role === 'admin');
    const monkeys = participants.filter((p) => p.role !== 'admin');
    return { admins, monkeys };
  }, [participants]);

  const monkeyStatusLabel = useMemo(() => {
    if (!systemStatus.aiAvailable) return 'AI:OFFLINE';
    return 'AI:READY';
  }, [systemStatus.aiAvailable]);

  useEffect(() => {
    if (!token || !roomId) return;

    connectSocket(token);

    const listeners = {
      receive_message: (msg) => setMessages((prev) => [...prev, msg]),
      system_message: (msg) => {
        if (String(msg?.text || '').toLowerCase().includes('monkey ai is currently unavailable')) {
          setSystemStatus({ aiAvailable: false, reason: 'OLLAMA_UNAVAILABLE' });
        }
        setMessages((prev) => [...prev, { ...msg, id: `sys-${Date.now()}-${Math.random()}` }]);
      },
      room_history: ({ messages: history }) => setMessages(history || []),
      participants_updated: ({ participants: next }) => setParticipants(next || []),
      message_updated: (updated) => {
        setMessages((prev) => prev.map((m) => (m.id === updated.id ? { ...m, reactions: updated.reactions } : m)));
      },
      message_deleted: ({ messageId }) => setMessages((prev) => prev.filter((m) => m.id !== messageId)),
      balance_update: ({ userId, newScore }) => {
        if (userId === persona.id) {
          onRoomSettingsChangedRef.current?.((prevPersona) => ({ ...prevPersona, score: newScore }));
        }
      },
      knock_request: (data) => setPendingKnocks((prev) => [...prev, data]),
      knock_pending: () => setKnockPending(true),
      entry_granted: () => setKnockPending(false),
      entry_denied: ({ message }) => {
        setEntryDenied(message || 'Access denied');
        setKnockPending(false);
      },
      flags_updated: ({ flags: nextFlags }) => setFlags(nextFlags || []),
      banned_users_updated: ({ users }) => setBannedUsers(users || []),
      room_settings_updated: ({ settings, monkeyConfig: newMonkeyConfig }) => {
        setRoomSettings(settings || {});
        if (newMonkeyConfig) setMonkeyConfig(newMonkeyConfig);
      },
      user_kicked: ({ targetUserId }) => {
        if (targetUserId === persona.id) {
          setKicked(true);
          onToast({ type: 'error', text: 'You were kicked from this room.' });
        }
      },
      room_deleted: () => {
        onToastRef.current?.({ type: 'error', text: 'Room deleted by admin.' });
        onRoomDeletedRef.current?.();
      },
      system_status: setSystemStatus,
      monkey_bank_update: ({ roomId: rId, monkeyBankBalance }) => {
        if (rId === roomId) {
          setMonkeyConfig(prev => ({ ...prev, monkeyBankBalance }));
          // Bridge to window for ChatSettingsModal liveBalance listener
          window.dispatchEvent(new CustomEvent('monkey_bank_update', { detail: { roomId: rId, monkeyBankBalance } }));
        }
      }
    };

    Object.entries(listeners).forEach(([event, handler]) => onSocket(event, handler));

    joinRoom(roomId);

    if (isAdmin) {
      requestRoomAdminData(roomId);
    }

    return () => {
      Object.entries(listeners).forEach(([event, handler]) => offSocket(event, handler));
      leaveRoom(roomId);
      disconnectSocket();
    };
  }, [token, roomId, persona.id, isAdmin]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setShowUsers(initialUsersOpen);
  }, [initialUsersOpen]);

  const handleSend = (payload) => {
    console.log('[Chat] handleSend called with payload:', payload, 'RoomID:', roomId);
    if (!roomId) {
      console.error('[Chat] Cannot send message: No Room ID');
      return;
    }
    sendMessage(roomId, payload);
  };

  const handleShareRoom = async () => {
    const code = roomInfo?.accessCode;
    if (!code) return;
    const inviteLink = `${window.location.origin}/join?room=${code}`;
    try {
      await navigator.clipboard.writeText(inviteLink);
      onToast({ type: 'success', text: 'LINK_COPIED' });
    } catch {
      onToast({ type: 'info', text: `Invite: ${inviteLink}` });
    }
  };

  const handleUpdateSettings = (patch) => {
    updateRoomSettingsSocket(roomId, patch);
  };

  const handleUpdateMonkey = (patch) => {
    updateRoomSettingsSocket(roomId, { monkeyConfig: patch });
    setMonkeyConfig(prev => ({ ...prev, ...patch }));
  };

  if (entryDenied) {
    return <StateCard title="ACCESS_DENIED" description={entryDenied} actionText="[ ABORT ]" onAction={onLeave} />;
  }

  if (knockPending) {
    return <StateCard title="HANDSHAKE_PENDING" description="Awaiting admin authorization..." actionText="[ ABORT ]" onAction={onLeave} />;
  }

  if (kicked) {
    return <StateCard title="CONNECTION_TERMINATED" description="You have been forcibly disconnected." actionText="[ ACKNOWLEDGE ]" onAction={onLeave} />;
  }

  return (
    <div className="h-[90vh] w-full max-w-[1600px] bg-black border border-terminal-green flex flex-col overflow-hidden font-mono text-sm relative shadow-[0_0_50px_rgba(57,255,20,0.1)]">

      {/* HEADER */}
      <header className="h-12 border-b border-terminal-green flex items-center justify-between px-4 bg-terminal-dim/10 shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-bold text-terminal-green uppercase tracking-widest">[ {roomInfo?.name} ]</span>
          <span className="text-terminal-dim text-xs">|</span>
          <span className="text-terminal-dim text-xs">{participants.length} NODES_ACTIVE</span>
          <span className="text-terminal-dim text-xs">|</span>
          <span className={`text-xs ${systemStatus.aiAvailable ? 'text-terminal-cyan' : 'text-terminal-alert'}`}>{monkeyStatusLabel}</span>
        </div>

        <div className="flex items-center gap-2">
          {!systemStatus.aiAvailable && <span className="text-terminal-alert text-xs animate-pulse">AI_OFFLINE</span>}
          <button onClick={handleShareRoom} className="hover:text-white text-terminal-green text-xs uppercase">[ SHARE ]</button>

          {isAdmin && (
            <button onClick={() => setShowSettingsModal(true)} className="hover:text-white text-terminal-cyan text-xs uppercase">[ CONFIG ]</button>
          )}

          <button onClick={() => setShowUsers((v) => !v)} className="hover:text-white text-terminal-green text-xs uppercase">[ USERS ]</button>

          {isAdmin && <button onClick={() => setShowAdmin((v) => !v)} className="hover:text-white text-terminal-alert text-xs uppercase">[ GATEKEEPER ]</button>}

          <button onClick={onLeave} className="hover:text-white text-terminal-dim text-xs uppercase">[ DISCONNECT ]</button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* CHAT AREA */}
        <div className="flex-1 flex flex-col relative bg-black">
          {/* Scrollable Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            <div className="text-center py-4 border-b border-terminal-dim/30 mb-4">
              <span className="text-xs text-terminal-dim uppercase tracking-widest">
                --- BEGIN_LOG: {formatDateChip(messages)} ---
              </span>
            </div>

            {!messages.length && (
              <div className="h-full flex items-center justify-center text-terminal-dim">
                &gt; NO_DATA_RECEIVED
              </div>
            )}

            {messages.map((msg, idx) => {
              const isSystem = msg.type === 'info' || msg.type === 'alert' || msg.type === 'success';
              const isMonkey = msg.sender?.id === 'monkey-ai-admin' || msg.type === 'monkey_action';

              if (isSystem) {
                return (
                  <div key={idx} className="text-terminal-dim text-xs py-1">
                    <span className="text-terminal-cyan">[SYSTEM]</span> {msg.text}
                  </div>
                );
              }

              return (
                <div key={msg.id} className="group hover:bg-white/5 py-0.5 px-2 -mx-2 flex items-start gap-2 break-words">
                  <span className="text-terminal-dim text-xs w-[50px] shrink-0 font-mono opacity-50">
                    {formatTime(msg.timestamp)}
                  </span>

                  <div className="flex-1 min-w-0">
                    <span className={`font-bold mr-2 ${isMonkey ? 'text-terminal-cyan' :
                      (msg.sender?.id === persona.id ? 'text-terminal-green' : 'text-white')
                      }`}>
                      {isMonkey
                        ? (monkeyConfig?.name || 'Gossip Monkey').toUpperCase().replace(/\s+/g, '_')
                        : `<${msg.sender?.name}>`}
                    </span>

                    {msg.imageUrl ? (
                      <div className="mt-1 mb-1">
                        <div className="text-xs text-terminal-dim mb-1">&gt; [IMAGE_DATA_PACKET]</div>
                        <img
                          src={msg.imageUrl}
                          alt="encrypted_media"
                          className="max-h-[300px] border-2 border-terminal-green p-1 bg-black/50 grayscale hover:grayscale-0 transition-all"
                        />
                        {msg.text && <div className="text-terminal-green mt-1 font-mono text-xs border-l-2 border-terminal-dim pl-2">{msg.text}</div>}
                      </div>
                    ) : (
                      <span className="text-white/90 font-mono tracking-tight">{msg.text}</span>
                    )}

                    {/* Reactions embedded in line */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <span className="ml-2 inline-flex gap-1 opacity-70">
                        {countReactions(msg.reactions).map(([emoji, count]) => (
                          <span key={emoji} className="text-[10px] bg-terminal-dim/20 px-1 rounded text-terminal-green">
                            {emoji}{count > 1 ? count : ''}
                          </span>
                        ))}
                      </span>
                    )}
                  </div>

                  {/* Hover Actions (Hidden by default, shown on group hover) */}
                  <div className="hidden group-hover:flex items-center gap-3 opacity-100 ml-4 select-none">
                    <button
                      onClick={() => reactMessage(roomId, msg.id, '❤️')}
                      className="text-[10px] text-terminal-dim hover:text-terminal-green hover:font-bold uppercase tracking-widest transition-colors"
                      title="Like (+1 Banana)"
                    >
                      [ LFE ]
                    </button>
                    <button
                      onClick={() => reactMessage(roomId, msg.id, '😂')}
                      className="text-[10px] text-terminal-dim hover:text-terminal-green hover:font-bold uppercase tracking-widest transition-colors"
                      title="Laugh (+1 Banana)"
                    >
                      [ LOL ]
                    </button>

                    {!isMonkey && msg.sender.id !== persona.id && (
                      <button
                        onClick={() => tipUser(roomId, msg.sender.id, 5)}
                        className="text-[10px] text-terminal-dim hover:text-terminal-cyan hover:font-bold uppercase tracking-widest transition-colors"
                        title="Tip 5 Bananas"
                      >
                        [ TIP:5 ]
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => deleteMessage(roomId, msg.id)}
                        className="text-[10px] text-terminal-dim hover:text-terminal-alert hover:font-bold uppercase tracking-widest transition-colors"
                      >
                        [ RM ]
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-terminal-green bg-black p-0">
            <ChatInput onSend={handleSend} />
          </div>
        </div>

        {/* RIGHT SIDEBAR - USERS/ADMIN */}
        {(showUsers || showAdmin) && (
          <aside className="w-64 border-l border-terminal-green bg-black flex flex-col overflow-y-auto shrink-0 transition-all">
            <div className="p-2 border-b border-terminal-green text-xs font-bold uppercase text-terminal-green bg-terminal-dim/10 flex justify-between">
              <span>{showAdmin ? 'GATEKEEPER_LOG' : 'CONNECTED_NODES'}</span>
              <button onClick={() => { setShowUsers(false); setShowAdmin(false); }}>[X]</button>
            </div>

            <div className="p-4 space-y-6">
              {showUsers && !showAdmin && (
                <>
                  <div>
                    <h5 className="text-xs text-terminal-dim uppercase mb-2 border-b border-terminal-dim/30">Admins / Kings</h5>
                    {troopGroups.admins.map(p => (
                      <div key={p.id} className="text-sm text-terminal-cyan mb-1 truncate">
                        @{p.alias} <span className="text-[10px] text-terminal-dim">[ADMIN]</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h5 className="text-xs text-terminal-dim uppercase mb-2 border-b border-terminal-dim/30">Peers</h5>
                    {troopGroups.monkeys.map(p => (
                      <div key={p.id} className="text-sm text-terminal-green mb-1 truncate cursor-pointer hover:bg-white/10 px-1 -mx-1">
                        @{p.alias} <span className="text-[10px] text-terminal-dim">({p.score})</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {showAdmin && isAdmin && (
                <div className="space-y-4">
                  <div className="text-xs text-terminal-alert uppercase border-b border-terminal-alert mb-2">Pending Access</div>
                  {pendingKnocks.length === 0 && <div className="text-terminal-dim text-xs italic">No pending requests</div>}
                  {pendingKnocks.map(k => (
                    <div key={k.socketId} className="text-xs mb-2">
                      <div className="text-white">{k.persona.name}</div>
                      <div className="flex gap-2 mt-1">
                        <button onClick={() => approveEntry(k.socketId, roomId, true)} className="text-terminal-green hover:underline">[ALLOW]</button>
                        <button onClick={() => approveEntry(k.socketId, roomId, false)} className="text-terminal-alert hover:underline">[DENY]</button>
                      </div>
                    </div>
                  ))}

                  <div className="text-xs text-terminal-alert uppercase border-b border-terminal-alert mb-2 mt-4">Danger Zone</div>
                  <button onClick={() => resetMonkeyMemory(roomId)} className="mt-1 text-xs border border-terminal-dim text-terminal-dim px-2 py-1 w-full hover:border-terminal-alert hover:text-terminal-alert transition-colors">
                    WIPE_MONKEY_MEMORY
                  </button>
                  <button onClick={() => deleteRoom(roomId)} className="mt-2 text-xs bg-terminal-alert text-black px-2 py-1 w-full font-bold hover:opacity-80">
                    DELETE_ROOM
                  </button>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {showSettingsModal && (
        <ChatSettingsModal
          settings={roomSettings}
          monkeyConfig={monkeyConfig}
          roomId={roomId}
          personaId={persona.id}
          onUpdate={handleUpdateSettings}
          onUpdateMonkey={handleUpdateMonkey}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  );
};

export default Chat;
