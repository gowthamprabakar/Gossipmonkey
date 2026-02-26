import { useNavigate } from 'react-router-dom';
import IdentitySetup from '../components/IdentitySetup';

const OnboardingPage = ({ onComplete }) => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020502]">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_15%_20%,rgba(170,195,22,0.22),transparent_36%),radial-gradient(circle_at_90%_75%,rgba(44,98,31,0.2),transparent_40%)]" />
      <div className="absolute inset-0 pointer-events-none terminal-grid opacity-30" />
      <div className="absolute inset-0 pointer-events-none scanlines opacity-25" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
        <IdentitySetup
          onComplete={async () => {
            await onComplete();
            navigate('/channels', { replace: true });
          }}
        />
      </div>

      <div className="hidden md:flex absolute left-5 bottom-5 z-10 items-center gap-3 rounded-3xl border border-[#273a1b] bg-[#0d140a]/90 px-4 py-3 backdrop-blur-sm">
        <span className="size-10 rounded-full bg-[#112010] border border-[#315626] flex items-center justify-center text-[#80e56d] material-icons text-[20px]">smart_toy</span>
        <div>
          <p className="text-sm font-semibold text-white">Gossip Monkey</p>
          <p className="text-[11px] text-[#7ee16f] uppercase tracking-[0.14em]">Online</p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
