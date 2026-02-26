import { useState } from 'react';

const Landing = ({ onEnter }) => {
  const [isEntering, setIsEntering] = useState(false);

  const handleEnterClick = () => {
    setIsEntering(true);
    setTimeout(() => {
      onEnter();
    }, 500);
  };

  const asciiArt = `
   ▄██████▄   ▄█    █▄       ▄████████     ███      
  ███    ███ ███    ███     ███    ███ ▀█████████▄  
  ███    █▀  ███    ███     ███    ███    ▀███▀▀██  
  ███        ███    ███     ███    ███     ███   ▀  
  ███        ███    ███   ▀███████████     ███      
  ███    █▄  ███    ███     ███    ███     ███      
  ███    ███ ███    ███     ███    ███     ███      
   ▀██████▀   ▀██████▀      ███    █▀     ▄███▀     
  `;

  return (
    <div className="relative min-h-screen bg-terminal-black text-terminal-green font-mono selection:bg-terminal-green selection:text-black overflow-hidden flex flex-col">
      {/* HUD Header */}
      <header className="border-b border-terminal-green p-2 flex justify-between items-center bg-black z-20">
        <div className="flex gap-4 text-xs md:text-sm">
          <span>[ SYSTEM: MONITORING ]</span>
          <span>[ ENCRYPTION: AES-256 ]</span>
        </div>
        <div className="text-xs md:text-sm">
          <span>v2.0.4-beta</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row items-stretch relative z-10">

        {/* Left Panel: Brand & Entry */}
        <section className="flex-1 p-8 md:p-16 flex flex-col justify-center border-r border-terminal-green relative">

          <div className="mb-8 opacity-80 pointer-events-none hidden md:block text-[10px] leading-[10px] whitespace-pre text-terminal-green/50">
            {asciiArt}
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tighter uppercase terminal-glow">
            GOSSIP<br />MONKEY
          </h1>

          <p className="max-w-md text-lg text-terminal-green/80 mb-10 leading-relaxed">
            &gt; ESTABLISHING SECURE CONNECTION...<br />
            &gt; ANONYMOUS PROTOCOLS ENGAGED.<br />
            &gt; WELCOME TO THE UNDERGROUND.
          </p>

          <div className="flex flex-col gap-4 items-start">
            <button
              onClick={handleEnterClick}
              disabled={isEntering}
              className="group relative inline-flex items-center justify-center px-8 py-4 bg-terminal-green text-black font-bold text-xl uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEntering ? '> INITIALIZING...' : '> ENTER_SYSTEM'}
              <span className="absolute inset-0 border-2 border-transparent group-hover:border-white animate-pulse"></span>
            </button>
            <p className="text-xs text-terminal-dim uppercase tracking-widest">
              *NO USER LOGS RETAINED
            </p>
          </div>
        </section>

        {/* Right Panel: Data Stream / Context */}
        <section className="hidden md:flex flex-1 p-8 md:p-16 flex-col justify-between bg-white/[0.02]">
          <div>
            <h3 className="text-sm font-bold border-b border-terminal-dim mb-4 pb-2 uppercase tracking-widest">
                    // CHANNEL_PREVIEW
            </h3>
            <div className="space-y-4 font-mono text-sm">
              <div className="flex gap-4 opacity-70">
                <span className="text-terminal-dim">[10:42:01]</span>
                <span>&lt;@banana_king&gt; status report?</span>
              </div>
              <div className="flex gap-4 opacity-70">
                <span className="text-terminal-dim">[10:42:05]</span>
                <span>&lt;@glitch_ape&gt; network stable.</span>
              </div>
              <div className="flex gap-4">
                <span className="text-terminal-dim">[10:42:12]</span>
                <span className="text-terminal-cyan">&lt;@monkey_ai&gt; analyzing sector 7...</span>
              </div>
              <div className="flex gap-4 opacity-70">
                <span className="text-terminal-dim">[10:42:15]</span>
                <span>&lt;@ghost_user&gt; silence is golden.</span>
              </div>
              <div className="animate-pulse text-terminal-green">_</div>
            </div>
          </div>

          <div className="border border-terminal-dim p-4">
            <h4 className="text-xs uppercase text-terminal-dim mb-2">[ SYSTEM_STATS ]</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-terminal-dim">NODES:</span> 42
              </div>
              <div>
                <span className="text-terminal-dim">LATENCY:</span> 12ms
              </div>
              <div>
                <span className="text-terminal-dim">UPTIME:</span> 99.9%
              </div>
              <div>
                <span className="text-terminal-dim">MODE:</span> CLI
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-terminal-green p-2 text-center text-[10px] md:text-xs text-terminal-dim uppercase">
        TERMINAL_UI_V1 // BITCHAT_COMPATIBLE // END_OF_LINE
      </footer>
    </div>
  );
};

export default Landing;
