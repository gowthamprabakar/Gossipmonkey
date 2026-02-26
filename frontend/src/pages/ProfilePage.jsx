import { Link } from 'react-router-dom';
import { useState } from 'react';

const MOCK_REWARDS = [
  { id: 1, title: 'FIRST_BLOOD', desc: 'Sent your first message', reward: 10, claimed: true },
  { id: 2, title: 'CHATTERBOX', desc: 'Send 100 messages', reward: 50, claimed: false },
  { id: 3, title: 'INFLUENCER', desc: 'Receive 50 reactions', reward: 100, claimed: false },
  { id: 4, title: 'ARTIST', desc: 'Generate 5 AI images', reward: 25, claimed: false },
];

const ProfilePage = ({ persona, stats }) => {
  const [rewards, setRewards] = useState(MOCK_REWARDS);

  const handleClaim = (id) => {
    setRewards(prev => prev.map(r => r.id === id ? { ...r, claimed: true } : r));
    // In a real app, this would call an API to update the score
    alert('REWARD_CLAIMED: Credits transfer pending...');
  };

  return (
    <div className="min-h-screen bg-black text-terminal-green p-4 md:p-8 font-mono overflow-y-auto">
      <div className="max-w-5xl mx-auto border border-terminal-green bg-black shadow-[0_0_80px_rgba(57,255,20,0.05)] relative">

        {/* Decorative corner markers */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-terminal-green"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-terminal-green"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-terminal-green"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-terminal-green"></div>

        {/* Header */}
        <header className="border-b border-terminal-green p-4 flex justify-between items-center bg-terminal-dim/10">
          <h1 className="text-xl font-bold tracking-widest uppercase">[ PERSONA_DOSSIER ]</h1>
          <Link to="/channels" className="text-sm hover:bg-terminal-green hover:text-black px-4 py-1 uppercase border border-terminal-green transition-colors">
            [ RETURN_TO_ROOT ]
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">

          {/* LEFT PANEL: IDENTITY */}
          <section className="p-8 border-b md:border-b-0 md:border-r border-terminal-green flex flex-col items-center text-center">
            <div className="relative mb-6 group">
              <div className="absolute inset-0 border-2 border-dashed border-terminal-green rounded-full animate-spin-slow opacity-30"></div>
              <img
                src={persona.avatar}
                alt={persona.alias}
                className="w-40 h-40 rounded-full grayscale sepia brightness-90 contrast-125 border-4 border-terminal-green group-hover:grayscale-0 transition-all"
              />
              <div className="absolute bottom-0 right-0 bg-black text-xs px-2 py-1 border border-terminal-green text-terminal-cyan uppercase">
                Lvl. {Math.floor(persona.score / 100) + 1}
              </div>
            </div>

            <h2 className="text-3xl font-bold mb-1 text-white uppercase tracking-tighter">{persona.alias}</h2>
            <p className="text-terminal-dim text-xs font-mono mb-8 uppercase tracking-widest">ID: {persona.id}</p>

            <div className="w-full space-y-4 text-left">
              <div className="border border-terminal-dim p-3">
                <div className="text-[10px] text-terminal-dim uppercase mb-1">Status</div>
                <div className="text-terminal-green font-bold flex items-center gap-2">
                  <span className="w-2 h-2 bg-terminal-green rounded-full animate-pulse"></span>
                  OPERATIONAL
                </div>
              </div>
              <div className="border border-terminal-dim p-3">
                <div className="text-[10px] text-terminal-dim uppercase mb-1">Joined</div>
                <div className="text-white">2023.10.24</div>
              </div>
            </div>
          </section>

          {/* RIGHT PANEL: STATS & REWARDS */}
          <section className="md:col-span-2 p-8 bg-black">

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="border border-terminal-green p-4 bg-terminal-dim/5">
                <div className="text-[10px] text-terminal-dim uppercase mb-2">Banana_Reserves</div>
                <div className="text-3xl font-bold text-terminal-green">{persona.score}</div>
              </div>
              <div className="border border-terminal-dim p-4">
                <div className="text-[10px] text-terminal-dim uppercase mb-2">Rooms_Deployed</div>
                <div className="text-2xl font-bold text-white">{stats.roomsCreated}</div>
              </div>
              <div className="border border-terminal-dim p-4">
                <div className="text-[10px] text-terminal-dim uppercase mb-2">Reputation</div>
                <div className="text-2xl font-bold text-white">{stats.rewards}</div>
              </div>
            </div>

            {/* Rewards List */}
            <h3 className="text-sm font-bold uppercase border-b border-terminal-green/50 pb-2 mb-4 text-terminal-cyan">
              [ BOUNTY_BOARD ]
            </h3>

            <div className="space-y-3">
              {rewards.map(reward => (
                <div key={reward.id} className={`flex items-center justify-between p-3 border ${reward.claimed ? 'border-terminal-dim opacity-50' : 'border-white/20 bg-white/5'}`}>
                  <div>
                    <div className={`font-bold text-sm ${reward.claimed ? 'text-terminal-dim line-through' : 'text-white'}`}>
                      {reward.title}
                    </div>
                    <div className="text-xs text-terminal-dim">{reward.desc}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-terminal-green text-sm font-bold">+{reward.reward} 🍌</span>
                    <button
                      onClick={() => handleClaim(reward.id)}
                      disabled={reward.claimed}
                      className={`text-xs px-3 py-1 uppercase font-bold text-black ${reward.claimed ? 'bg-terminal-dim cursor-not-allowed' : 'bg-terminal-green hover:bg-white'}`}
                    >
                      {reward.claimed ? '[ CLAIMED ]' : '[ CLAIM ]'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </section>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
