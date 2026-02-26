import { useEffect, useMemo, useRef, useState } from 'react';

const CODE_LENGTH = 6;

const JoinPrivateChannelPage = ({ initialCode = '', onJoinByCode, onBack, loading }) => {
  const [code, setCode] = useState((initialCode || '').toUpperCase().slice(0, CODE_LENGTH));
  const [submitting, setSubmitting] = useState(false);
  const [errorShake, setErrorShake] = useState(false);
  const hiddenInputRef = useRef(null);

  useEffect(() => {
    hiddenInputRef.current?.focus();
  }, []);

  const codeSlots = useMemo(() => {
    return Array.from({ length: CODE_LENGTH }, (_, idx) => code[idx] || '');
  }, [code]);

  const onChangeCode = (value) => {
    const clean = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, CODE_LENGTH);
    setCode(clean);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (code.length !== CODE_LENGTH || submitting) return;
    setSubmitting(true);
    try {
      await onJoinByCode(code);
    } catch (err) {
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 500);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black text-terminal-green font-mono relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[2] bg-[length:100%_2px,3px_100%] pointer-events-none" />
      <div className="absolute inset-0 bg-black opacity-90 z-0"></div>

      <form onSubmit={submit} className={`relative z-10 w-full max-w-[480px] border-2 border-terminal-green bg-black p-8 shadow-[0_0_50px_rgba(57,255,20,0.1)] ${errorShake ? 'animate-shake' : ''}`}>

        {/* Header */}
        <div className="text-center mb-10 border-b border-terminal-green pb-4">
          <h1 className="text-2xl font-bold tracking-widest uppercase mb-2 text-terminal-green">[ SECURITY_LAYER ]</h1>
          <p className="text-xs text-terminal-dim uppercase tracking-widest">AUTHENTICATION REQUIRED</p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="absolute top-4 right-4 text-terminal-dim hover:text-terminal-alert uppercase text-xs"
        >
          [ ABORT ]
        </button>

        <div className="mb-8 text-center text-sm text-terminal-green">
          &gt; ENTER_ACCESS_TOKEN:
        </div>

        {/* Input Slots */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => hiddenInputRef.current?.focus()}
          className="flex justify-center gap-3 mb-10"
        >
          {codeSlots.map((char, idx) => (
            <div
              key={`slot-${idx}`}
              className={`w-12 h-14 border border-terminal-green flex items-center justify-center text-3xl font-bold bg-black select-none
                ${idx === code.length ? 'animate-pulse bg-terminal-green/20' : ''}
              `}
            >
              {char || '_'}
            </div>
          ))}
        </div>

        <input
          ref={hiddenInputRef}
          value={code}
          onChange={(e) => onChangeCode(e.target.value)}
          className="sr-only"
          autoFocus={true}
          maxLength={CODE_LENGTH}
        />

        {/* Action Button */}
        <button
          type="submit"
          disabled={code.length !== CODE_LENGTH || submitting || loading}
          className="w-full bg-terminal-green text-black font-bold text-lg py-3 uppercase hover:bg-white hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 transition-all"
        >
          {submitting || loading ? 'VERIFYING_CREDENTIALS...' : '[ AUTHENTICATE ]'}
        </button>

        <div className="mt-6 text-center">
          <span className="text-xs text-terminal-dim">NO_TOKEN_FOUND? </span>
          <button type="button" onClick={onBack} className="text-xs text-terminal-cyan hover:underline uppercase">[ REQUEST_EXIT ]</button>
        </div>

        <div className="absolute bottom-2 right-2 text-[10px] text-terminal-dim/50">
          SECURE_CONN_EST
        </div>
      </form>
    </div>
  );
};

export default JoinPrivateChannelPage;
