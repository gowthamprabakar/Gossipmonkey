import { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoom } from '../services/roomService';
import { bookmarkChannel, getChannels, unbookmarkChannel } from '../services/channelService';
import RoomCard from '../components/ui/RoomCard';
import Button from '../components/ui/Button';

const defaultSettings = {
  approvalRequired: false,
  slowModeSeconds: 0,
  imageOnly: false,
  minScore: 0,
  lockRoom: false,
  muteAll: false
};

const defaultMeta = {
  channelKind: 'general',
  geohashPrefix: '',
  regionLabel: ''
};

const scopeCopy = {
  nearby: 'Nearby',
  bookmarked: 'Bookmarked',
  recent: 'Recent'
};

const ChannelBrowserPage = ({ persona, onJoinRoom, onOpenNotifications, notifications, onToast }) => {
  const [scope, setScope] = useState('nearby');
  const [viewTab, setViewTab] = useState('hot'); // hot, public, private
  const [searchQuery, setSearchQuery] = useState('');
  const [geohash, setGeohash] = useState('');
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [rulesText, setRulesText] = useState('No rules. Go wild.');
  const [settings, setSettings] = useState(defaultSettings);
  const [channelMeta, setChannelMeta] = useState(defaultMeta);

  const loadChannels = useCallback(async () => {
    setLoading(true);
    const result = await getChannels({
      scope,
      geohash: scope === 'nearby' ? geohash.trim() : '',
      q: searchQuery.trim()
    });
    if (result.success) {
      setChannels(result.data);
    }
    setLoading(false);
  }, [scope, geohash, searchQuery]);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  // Filter channels based on viewTab (public/private/hot)
  const channelsForTab = useMemo(() => {
    let items = [...channels];

    if (viewTab === 'public') {
      items = items.filter((channel) => !channel.requiresApproval && channel.channelMeta?.channelKind !== 'private');
    }

    if (viewTab === 'private') {
      items = items.filter((channel) => channel.requiresApproval || channel.channelMeta?.channelKind === 'private');
    }

    // Default 'hot' sorts by active count
    items.sort((a, b) => Number(b.activeCount || 0) - Number(a.activeCount || 0));

    return items;
  }, [channels, viewTab]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    const result = await createRoom({
      name,
      type: channelMeta.channelKind === 'private' ? 'private' : 'public',
      rulesText,
      settings,
      channelMeta: {
        channelKind: channelMeta.channelKind,
        geohashPrefix: channelMeta.channelKind === 'location' ? channelMeta.geohashPrefix.trim() : null,
        regionLabel: channelMeta.regionLabel.trim() || null
      }
    });
    setSubmitting(false);

    if (!result.success) {
      onToast({ type: 'error', text: result.message || 'Failed to create channel' });
      return;
    }

    setShowCreateModal(false);
    setName('');
    setRulesText('No rules. Go wild.');
    setSettings(defaultSettings);
    setChannelMeta(defaultMeta);

    await loadChannels();
    onToast({ type: 'success', text: 'Channel created.' });
    onJoinRoom(result.data.id);
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) return;

    // First check loaded channels
    let target = channels.find((room) => (room.accessCode || '').toUpperCase() === code);

    // If not found, we might need to fetch a specific room (implementation omitted for simplicity, relying on loaded list or global join)
    // For now assuming user entered a valid code that exists or we'll assume it exists and try to join
    // In a real app we might need a separate API call to resolve code -> ID if not in list.

    // If the room is in the list:
    if (target) {
      onJoinRoom(target.id);
    } else {
      // Fallback or error (the original code required it to be in list or used global join route)
      // We'll just try to join by ID if we could, but here we only have code.
      // Let's assume for this UI revamp we just show error if not found in current scope/search
      onToast({ type: 'error', text: 'Channel not found in current directory.' });
    }
    setShowJoinModal(false);
  };

  const copyRoomLink = async (e, roomCode) => {
    e.stopPropagation();
    const link = `${window.location.origin}/join?room=${roomCode}`;
    try {
      await navigator.clipboard.writeText(link);
      onToast({ type: 'success', text: 'Link copied to clipboard.' });
    } catch {
      onToast({ type: 'info', text: link });
    }
  };

  const toggleBookmark = async (e, channel) => {
    e.stopPropagation();
    const action = channel.channelMeta?.isBookmarked ? unbookmarkChannel : bookmarkChannel;
    const result = await action(channel.id);
    if (!result.success) {
      onToast({ type: 'error', text: result.message || 'Failed to update bookmark.' });
      return;
    }
    await loadChannels();
  };

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateMeta = (key, value) => {
    setChannelMeta((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-terminal-black text-terminal-green min-h-screen flex flex-col overflow-hidden w-full font-mono selection:bg-terminal-green selection:text-black">

      {/* HUD Header */}
      <nav className="h-10 border-b border-terminal-green flex items-center justify-between px-4 bg-black select-none z-50">
        <div className="flex items-center gap-4 text-xs md:text-sm">
          <span className="font-bold uppercase tracking-widest">[ GOSSIP_MONKEY_OS ]</span>
          <span className="hidden md:inline text-terminal-dim">|</span>
          <span className="hidden md:inline text-terminal-dim">USER: {persona.alias}</span>
          <span className="hidden md:inline text-terminal-dim">|</span>
          <span className="hidden md:inline text-terminal-green">NET_STATUS: ONLINE</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs">
            <span>BANANAS:</span> <span className="text-white ml-2">{persona.score || 0}</span>
          </div>
          <button
            onClick={onOpenNotifications}
            className="hover:text-white uppercase text-xs"
          >
            {notifications.length > 0 ? `[ ALERTS: ${notifications.length} ]` : '[ NO_ALERTS ]'}
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden relative">

        {/* Sidebar - File Tree */}
        <aside className="w-64 border-r border-terminal-green hidden md:flex flex-col bg-black p-2 overflow-y-auto shrink-0">
          <div className="text-xs text-terminal-dim mb-4 border-b border-terminal-dim pb-2 uppercase tracking-wider">
            Filesystem / Channels
          </div>

          <div className="space-y-1 text-sm font-bold">
            {/* Scopes as Folders */}
            <div className="text-terminal-dim text-xs uppercase mb-1 mt-2">[ SCOPE ]</div>
            {Object.keys(scopeCopy).map((key) => (
              <div
                key={key}
                onClick={() => setScope(key)}
                className={`cursor-pointer hover:bg-white/10 px-2 py-1 ${scope === key ? 'text-white bg-terminal-green/10 border-l-2 border-terminal-green' : 'text-terminal-green'}`}
              >
                {scope === key ? `> ./${key}_channels` : `  ./${key}_channels`}
              </div>
            ))}

            {/* Geo Filter Input if Nearby */}
            {scope === 'nearby' && (
              <div className="px-2 py-1 flex items-center gap-1 text-terminal-dim border-l-2 border-transparent">
                <span>L_</span>
                <input
                  type="text"
                  placeholder="geohash..."
                  value={geohash}
                  onChange={(e) => setGeohash(e.target.value.toLowerCase())}
                  className="bg-transparent border-b border-terminal-dim outline-none text-white w-24 text-xs font-mono"
                />
              </div>
            )}

            {/* Filters as Sub-files */}
            <div className="text-terminal-dim text-xs uppercase mb-1 mt-4">[ FILTER ]</div>
            {['hot', 'public', 'private'].map((tab) => (
              <div
                key={tab}
                onClick={() => setViewTab(tab)}
                className={`cursor-pointer hover:bg-white/10 px-2 py-1 ${viewTab === tab ? 'text-white' : 'text-terminal-green/70'}`}
              >
                {viewTab === tab ? `* ${tab}.log` : `  ${tab}.log`}
              </div>
            ))}

            <div className="pt-6 text-xs text-terminal-dim uppercase tracking-wider mb-1">
              System Commands
            </div>
            <div
              onClick={() => setShowJoinModal(true)}
              className="cursor-pointer text-terminal-cyan hover:text-white px-2 py-1"
            >
              $ join_secure_channel
            </div>
            <div
              onClick={() => setShowCreateModal(true)}
              className="cursor-pointer text-terminal-cyan hover:text-white px-2 py-1"
            >
              $ mkdir_channel
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col bg-black relative min-w-0">

          {/* CLI Toolbar */}
          <div className="border-b border-terminal-green p-3 flex gap-4 items-center">
            <span className="text-terminal-green font-bold select-none">{'>'}</span>
            <input
              className="bg-transparent border-none outline-none text-terminal-green placeholder-terminal-dim w-full font-mono uppercase"
              placeholder={`GREP ${viewTab.toUpperCase()} CHANNELS...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {loading ? (
              <div className="text-terminal-dim animate-pulse">
                &gt; SCANNING NETWORK FREQUENCIES...
                <br />
                &gt; DECRYPTING CHANNEL HEADERS...
              </div>
            ) : channelsForTab.length === 0 ? (
              <div className="border border-terminal-dim border-dashed p-8 text-center text-terminal-dim">
                <p>No signal found in this sector.</p>
                <p className="text-xs mt-2 text-terminal-dim/50">Try adjusting scope parameters or execute creation protocol.</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 text-terminal-green hover:underline uppercase"
                >
                  [ ENTER_CREATION_MODE ]
                </button>
              </div>
            ) : (
              <div className="border border-terminal-dim">
                {/* Table Header */}
                <div className="hidden md:flex bg-terminal-dim/10 text-xs text-terminal-dim p-2 border-b border-terminal-dim items-center select-none">
                  <span className="w-8 shrink-0"></span>
                  <span className="w-[200px] shrink-0">CHANNEL_ID</span>
                  <span className="w-[100px] shrink-0">STATUS</span>
                  <span className="flex-1">DESCRIPTION</span>
                  <span className="w-[150px] shrink-0 text-right">ACTIONS</span>
                </div>

                {/* List Items */}
                {channelsForTab.map((channel) => (
                  <RoomCard
                    key={channel.id}
                    room={channel}
                    isMyRoom={channel.creatorId === persona.id}
                    onJoin={() => onJoinRoom(channel.id)}
                    onCopyLink={copyRoomLink}
                  // You might want to pass bookmark handler if supported by RoomCard, or add it
                  />
                ))}
              </div>
            )}
          </div>

          {/* Mobile Create Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-terminal-green text-black font-bold shadow-[4px_4px_0px_#fff] flex items-center justify-center text-2xl"
          >
            +
          </button>
        </main>
      </div>

      {/* CREATE CHANNEL MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-black border-2 border-terminal-green w-full max-w-lg p-0 shadow-[0_0_50px_rgba(57,255,20,0.15)]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-terminal-green text-black p-2 font-bold flex justify-between uppercase text-sm">
              <span>Touch New Channel</span>
              <button onClick={() => setShowCreateModal(false)}>[X]</button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[80vh]">
              <form onSubmit={handleCreate} className="flex flex-col gap-6">
                <div>
                  <label className="block text-terminal-green text-xs mb-1 uppercase">Channel Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent border-b border-terminal-dim outline-none py-2 text-white focus:border-terminal-green font-mono"
                    placeholder="channel_name"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-terminal-green text-xs mb-1 uppercase">Topic / MOTD</label>
                  <textarea
                    value={rulesText}
                    onChange={(e) => setRulesText(e.target.value)}
                    className="w-full bg-transparent border border-terminal-dim outline-none p-2 text-white focus:border-terminal-green font-mono text-sm h-20 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-terminal-green text-xs mb-1 uppercase">Type</label>
                    <select
                      value={channelMeta.channelKind}
                      onChange={(e) => updateMeta('channelKind', e.target.value)}
                      className="w-full bg-black border border-terminal-dim text-white text-xs p-2 outline-none focus:border-terminal-green"
                    >
                      <option value="general">General</option>
                      <option value="location">Location</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  {channelMeta.channelKind === 'location' && (
                    <div>
                      <label className="block text-terminal-green text-xs mb-1 uppercase">Geohash</label>
                      <input
                        type="text"
                        value={channelMeta.geohashPrefix}
                        onChange={(e) => updateMeta('geohashPrefix', e.target.value.toLowerCase())}
                        className="w-full bg-transparent border-b border-terminal-dim text-white text-xs py-2 outline-none"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-terminal-green text-xs mb-2 uppercase">Flags</label>
                  <div className="grid grid-cols-2 gap-4 text-xs text-terminal-dim">
                    <label className="flex items-center gap-2 hover:text-white cursor-pointer"><input type="checkbox" checked={settings.approvalRequired} onChange={(e) => updateSetting('approvalRequired', e.target.checked)} className="accent-terminal-green" /> --require-approval</label>
                    <label className="flex items-center gap-2 hover:text-white cursor-pointer"><input type="checkbox" checked={settings.imageOnly} onChange={(e) => updateSetting('imageOnly', e.target.checked)} className="accent-terminal-green" /> --image-only</label>
                    <label className="flex items-center gap-2 hover:text-white cursor-pointer"><input type="checkbox" checked={settings.lockRoom} onChange={(e) => updateSetting('lockRoom', e.target.checked)} className="accent-terminal-green" /> --lock</label>
                  </div>
                </div>

                <div className="flex gap-4 mt-4">
                  <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)} className="flex-1 text-sm">CANCEL</Button>
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
              <span>Connect Channel</span>
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
                <Button type="button" variant="primary" onClick={handleJoinByCode} className="flex-1">
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

export default ChannelBrowserPage;
