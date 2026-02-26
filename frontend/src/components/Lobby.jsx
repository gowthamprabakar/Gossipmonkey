import { useEffect, useMemo, useState } from 'react';
import { createRoom } from '../services/roomService';
import { filterAndSortRooms } from '../utils/featureUtils';
import RoomCard from './ui/RoomCard'; // Now a row item
import Button from './ui/Button';

const defaultSettings = {
  approvalRequired: false,
  slowModeSeconds: 0,
  imageOnly: false,
  minScore: 0,
  lockRoom: false,
  muteAll: false
};

const Lobby = ({ persona, rooms, loading, onRefresh, onJoinRoom, onOpenNotifications, notifications }) => {
  const [activeTab, setActiveTab] = useState('hot');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [rulesText, setRulesText] = useState('No rules. Go wild.');
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    onRefresh();
  }, [onRefresh]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const onJoinPath = window.location.pathname === '/join';
    if (onJoinPath || params.get('join') === '1') {
      setShowJoinModal(true);
    }
  }, []);

  const filteredRooms = useMemo(() => (
    filterAndSortRooms({ rooms, activeTab, searchQuery })
  ), [rooms, activeTab, searchQuery]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    const result = await createRoom({
      name,
      type: 'public',
      rulesText,
      settings
    });
    setSubmitting(false);

    if (!result.success) {
      alert(result.message || 'Failed to create room');
      return;
    }

    setShowCreateModal(false);
    setName('');
    setRulesText('No rules. Go wild.');
    setSettings(defaultSettings);
    await onRefresh();
    onJoinRoom(result.data.id);
  };

  const handleJoinByCode = (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    const target = rooms.find((r) => (r.accessCode || '').toUpperCase() === joinCode.toUpperCase());
    if (!target) {
      alert('Invalid room code');
      return;
    }

    onJoinRoom(target.id);
    setShowJoinModal(false);
  };

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const copyRoomLink = async (roomCode) => {
    const link = `${window.location.origin}/?room=${roomCode}`;
    try {
      await navigator.clipboard.writeText(link);
      alert('Invite link copied');
    } catch {
      alert(link);
    }
  };

  return (
    <div className="bg-terminal-black text-terminal-green min-h-screen flex flex-col overflow-hidden w-full font-mono selection:bg-terminal-green selection:text-black">

      {/* Top Status Bar like a HUD */}
      <nav className="h-10 border-b border-terminal-green flex items-center justify-between px-4 bg-black select-none">
        <div className="flex items-center gap-4 text-xs md:text-sm">
          <span className="font-bold uppercase tracking-widest">[ GOSSIP_MONKEY_OS ]</span>
          <span className="hidden md:inline text-terminal-dim">|</span>
          <span className="hidden md:inline text-terminal-dim">USER: {persona.alias}</span>
          <span className="hidden md:inline text-terminal-dim">|</span>
          <span className="hidden md:inline text-terminal-green">NET_STATUS: CONNECTED</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs">
            <span>BANANAS:</span> <span className="text-white">{persona.score}</span>
          </div>
          <button
            onClick={onOpenNotifications}
            className="hover:text-white uppercase text-xs"
          >
            {notifications.length > 0 ? `[ NOTIFICATIONS: ${notifications.length} ]` : '[ NO_ALERTS ]'}
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden relative">

        {/* Left Sidebar - Terminal Tree View */}
        <aside className="w-64 border-r border-terminal-green hidden md:flex flex-col bg-black p-2 overflow-y-auto">
          <div className="text-xs text-terminal-dim mb-4 border-b border-terminal-dim pb-2 uppercase tracking-wider">
            Filesystem / Rooms
          </div>

          <div className="space-y-1 text-sm">
            <div onClick={() => setActiveTab('hot')} className={`cursor-pointer hover:bg-white/10 ${activeTab === 'hot' ? 'text-white font-bold' : ''}`}>
              {activeTab === 'hot' ? '> ./hot_rooms' : '  ./hot_rooms'}
            </div>
            <div onClick={() => setActiveTab('public')} className={`cursor-pointer hover:bg-white/10 ${activeTab === 'public' ? 'text-white font-bold' : ''}`}>
              {activeTab === 'public' ? '> ./public_dir' : '  ./public_dir'}
            </div>
            <div onClick={() => setActiveTab('private')} className={`cursor-pointer hover:bg-white/10 ${activeTab === 'private' ? 'text-white font-bold' : ''}`}>
              {activeTab === 'private' ? '> ./private_keys' : '  ./private_keys'}
            </div>

            <div className="pt-4 text-xs text-terminal-dim uppercase tracking-wider mb-1">
              Commands
            </div>
            <div
              onClick={() => setShowJoinModal(true)}
              className="cursor-pointer text-terminal-cyan hover:text-white"
            >
              $ join_by_code
            </div>
            <div
              onClick={() => setShowCreateModal(true)}
              className="cursor-pointer text-terminal-cyan hover:text-white"
            >
              $ mkdir_new_room
            </div>
          </div>
        </aside>

        {/* Main Content - Directory Listing */}
        <main className="flex-1 flex flex-col bg-black relative">

          {/* Toolbar */}
          <div className="border-b border-terminal-green p-3 flex gap-4 items-center">
            <span className="text-terminal-green font-bold">{'>'}</span>
            <input
              className="bg-transparent border-none outline-none text-terminal-green placeholder-terminal-dim w-full font-mono uppercase"
              placeholder="GREP ROOMS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Room List (Table/Rows) */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {loading ? (
              <div className="animate-pulse text-terminal-dim"> Scanning network frequencies...</div>
            ) : filteredRooms.length === 0 ? (
              <div className="border border-terminal-dim border-dashed p-8 text-center text-terminal-dim">
                <p>No directories found matching criteria.</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 text-terminal-green hover:underline"
                >
                  [ ENTER_CREATION_MODE ]
                </button>
              </div>
            ) : (
              <div className="border border-terminal-dim">
                <div className="hidden md:flex bg-terminal-dim/10 text-xs text-terminal-dim p-2 border-b border-terminal-dim items-center">
                  <span className="flex-1">NAME</span>
                  <span className="w-1/3">DESCRIPTION</span>
                  <span className="w-24">STATUS</span>
                </div>
                {filteredRooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    isMyRoom={room.creatorId === persona.id}
                    onJoin={() => onJoinRoom(room.id)}
                    onCopyLink={copyRoomLink}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Mobile Fab */}
          <button onClick={() => setShowCreateModal((v) => !v)} className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-terminal-green text-black font-bold rounded-none shadow-[4px_4px_0px_#fff]">
            +
          </button>
        </main>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-black border-2 border-terminal-green w-full max-w-lg p-0 shadow-[0_0_50px_rgba(57,255,20,0.15)]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-terminal-green text-black p-2 font-bold flex justify-between uppercase text-sm">
              <span>Create New Room</span>
              <button onClick={() => setShowCreateModal(false)}>[X]</button>
            </div>
            <div className="p-6">
              <form onSubmit={handleCreate} className="flex flex-col gap-6">
                <div>
                  <label className="block text-terminal-green text-xs mb-1 uppercase">Directory Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent border-b border-terminal-dim outline-none py-2 text-white focus:border-terminal-green font-mono"
                    placeholder="my_new_room"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-terminal-green text-xs mb-1 uppercase">Rules / MOTD</label>
                  <textarea
                    value={rulesText}
                    onChange={(e) => setRulesText(e.target.value)}
                    className="w-full bg-transparent border border-terminal-dim outline-none p-2 text-white focus:border-terminal-green font-mono text-sm h-20 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-terminal-green text-xs mb-2 uppercase">Permissions</label>
                  <div className="grid grid-cols-2 gap-4 text-xs text-terminal-dim">
                    <label className="flex items-center gap-2 hover:text-white cursor-pointer"><input type="checkbox" checked={settings.approvalRequired} onChange={(e) => updateSetting('approvalRequired', e.target.checked)} className="accent-terminal-green" /> --require-approval</label>
                    <label className="flex items-center gap-2 hover:text-white cursor-pointer"><input type="checkbox" checked={settings.imageOnly} onChange={(e) => updateSetting('imageOnly', e.target.checked)} className="accent-terminal-green" /> --image-only</label>
                    <label className="flex items-center gap-2 hover:text-white cursor-pointer"><input type="checkbox" checked={settings.lockRoom} onChange={(e) => updateSetting('lockRoom', e.target.checked)} className="accent-terminal-green" /> --lock</label>
                  </div>
                </div>

                <div className="flex gap-4 mt-4">
                  <Button type="submit" variant="primary" disabled={submitting} className="flex-1">
                    {submitting ? 'ALLOCATING...' : 'EXECUTE'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* JOIN MODAL */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowJoinModal(false)}>
          <div className="bg-black border-2 border-terminal-green w-full max-w-md p-0" onClick={(e) => e.stopPropagation()}>
            <div className="bg-terminal-green text-black p-2 font-bold flex justify-between uppercase text-sm">
              <span>Join Secure Channel</span>
              <button onClick={() => setShowJoinModal(false)}>[X]</button>
            </div>
            <div className="p-8 text-center">
              <p className="text-terminal-dim text-xs mb-6 uppercase tracking-widest">Enter Access Token</p>
              <input
                type="text"
                value={joinCode}
                maxLength={6}
                onChange={(e) => setJoinCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
                className="w-full bg-black border border-terminal-green text-center text-4xl text-white font-mono py-4 outline-none tracking-[0.5em] mb-8 focus:shadow-[0_0_20px_rgba(57,255,20,0.3)]"
                placeholder="______"
                autoFocus
              />
              <div className="flex gap-4">
                <Button type="button" variant="ghost" onClick={() => setShowJoinModal(false)} className="flex-1">
                  ABORT
                </Button>
                <Button type="submit" variant="primary" onClick={handleJoinByCode} className="flex-1">
                  CONNECT
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lobby;
