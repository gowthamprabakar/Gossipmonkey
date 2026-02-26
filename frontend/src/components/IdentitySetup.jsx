import { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import Button from './ui/Button';
import Avatar from './ui/Avatar';

const avatarSeeds = ['Cyber', 'King', 'Zen', 'Chaos', 'Neon', 'Ape', 'Gibbon', 'Marmoset'];

const avatarFromSeed = (seed) => `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`;

const randomAlias = () => {
  const adj = ['Cyber', 'Null', 'Void', 'Retro', 'Glitch', 'Sudo', 'Root'];
  const noun = ['User', 'Admin', 'Guest', 'Monkey', 'Daemon', 'Node'];
  const n1 = adj[Math.floor(Math.random() * adj.length)];
  const n2 = noun[Math.floor(Math.random() * noun.length)];
  return `${n1}_${n2}_${Math.floor(10 + Math.random() * 90)}`;
};

const IdentitySetup = ({ onComplete }) => {
  const { startSession } = useAuth();
  const { pushToast } = useUI();

  const avatars = useMemo(() => avatarSeeds.map((seed) => avatarFromSeed(seed)), []);
  const [alias, setAlias] = useState(randomAlias());
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    let result;
    try {
      result = await startSession({ alias, avatar: avatars[index] });
    } finally {
      setSaving(false);
    }

    if (!result.success) {
      pushToast({ type: 'error', text: result.message || 'Failed to create session' });
      return;
    }

    onComplete();
  };

  return (
    <div className="w-full max-w-2xl px-4 py-8">

      {/* Terminal Window Header */}
      <div className="border border-terminal-green bg-black p-4 mb-4">
        <div className="flex justify-between items-center text-xs text-terminal-green mb-6 border-b border-terminal-dim pb-2">
          <span>user@bitchat:~/setup</span>
          <span>--interactive</span>
        </div>

        <p className="text-terminal-dim mb-4">
          gossip-monkey-cli v2.0 <br />
          Initializing identity configuration wizard...
        </p>

        <form onSubmit={submit} className="space-y-8">

          {/* 1. Avatar Selection */}
          <div>
            <p className="text-terminal-green mb-2">
              <span className="text-white font-bold">[?]</span> SELECT_AVATAR_PROTOCOL:
            </p>
            <div className="flex items-center gap-4 bg-terminal-dim/10 p-4 border border-terminal-dim border-dashed">
              <button
                type="button"
                onClick={() => setIndex((prev) => (prev - 1 + avatars.length) % avatars.length)}
                className="text-terminal-green hover:text-white"
              >
                &lt; PREV
              </button>

              <div className="flex-1 flex justify-center">
                <Avatar src={avatars[index]} size="xl" />
              </div>

              <button
                type="button"
                onClick={() => setIndex((prev) => (prev + 1) % avatars.length)}
                className="text-terminal-green hover:text-white"
              >
                NEXT &gt;
              </button>
            </div>
          </div>

          {/* 2. Alias Input */}
          <div>
            <p className="text-terminal-green mb-2">
              <span className="text-white font-bold">[?]</span> SET_USER_ALIAS:
            </p>
            < div className="flex gap-2">
              <span className="text-terminal-dim py-3">$</span>
              <input
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                className="flex-1 bg-transparent border-b border-terminal-green text-xl text-white font-mono py-2 outline-none"
                maxLength={32}
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setAlias(randomAlias())}
                className="text-xs text-terminal-dim hover:text-terminal-green uppercase border border-terminal-dim px-2"
                title="Randomize"
              >
                RND()
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-6">
            <Button
              type="submit"
              variant="primary"
              disabled={saving}
              className="w-full text-lg"
            >
              {saving ? '> EXECUTING...' : '> INITIALIZE_SESSION'}
            </Button>
          </div>

        </form>
      </div>

      <p className="text-center text-xs text-terminal-dim mt-4">
        WARNING: Session data is ephemeral. Encryption keys generated locally.
      </p>

    </div>
  );
};

export default IdentitySetup;
