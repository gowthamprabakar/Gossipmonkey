import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { panicResetSession } from '../services/identityService';
import { getPrivacyPreferences, updatePrivacyPreferences } from '../services/privacyService';

const PrivacyPage = ({ onToast, onAfterPanicReset }) => {
  const [prefs, setPrefs] = useState({ allowLocation: false, panicModeEnabled: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [panicSubmitting, setPanicSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const result = await getPrivacyPreferences();
      if (result.success) {
        setPrefs({
          allowLocation: !!result.data.allowLocation,
          panicModeEnabled: !!result.data.panicModeEnabled
        });
      }
      setLoading(false);
    };

    load();
  }, []);

  const patchPrefs = async (patch) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    setSaving(true);
    const result = await updatePrivacyPreferences(patch);
    setSaving(false);
    if (!result.success) {
      onToast({ type: 'error', text: result.message || 'Unable to update privacy preferences.' });
      return;
    }
    setPrefs({
      allowLocation: !!result.data.allowLocation,
      panicModeEnabled: !!result.data.panicModeEnabled
    });
  };

  const handlePanicReset = async () => {
    setPanicSubmitting(true);
    const result = await panicResetSession();
    setPanicSubmitting(false);

    if (!result.success) {
      onToast({ type: 'error', text: result.message || 'Panic reset failed.' });
      return;
    }

    onToast({ type: 'info', text: 'Session reset complete. Re-enter with a new identity.' });
    onAfterPanicReset();
    navigate('/onboarding', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#050704] text-white px-4 py-6 md:py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-7">
          <h1 className="text-4xl font-black tracking-tight">Privacy Controls</h1>
          <Link to="/channels" className="text-sm rounded-full px-4 py-2 border border-white/20 hover:border-white/40">Back</Link>
        </div>

        <div className="rounded-3xl border border-[#28391f] bg-[#0d140a]/90 p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold">Session Privacy Lite</h2>
            <p className="text-white/60 mt-1">No tracking by default. Control location hints and emergency reset from one place.</p>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
              <div>
                <p className="font-semibold">Allow location-assisted channel discovery</p>
                <p className="text-xs text-white/55">Used only for virtual geochannel suggestions.</p>
              </div>
              <input
                type="checkbox"
                checked={prefs.allowLocation}
                onChange={(e) => patchPrefs({ allowLocation: e.target.checked })}
                disabled={loading || saving}
              />
            </label>

            <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
              <div>
                <p className="font-semibold">Panic mode enabled</p>
                <p className="text-xs text-white/55">Arms faster identity/session reset behavior.</p>
              </div>
              <input
                type="checkbox"
                checked={prefs.panicModeEnabled}
                onChange={(e) => patchPrefs({ panicModeEnabled: e.target.checked })}
                disabled={loading || saving}
              />
            </label>
          </div>

          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4">
            <p className="font-semibold text-red-100">Panic Reset</p>
            <p className="text-sm text-red-100/80 mt-1">Revokes the active session token and clears this browser identity.</p>
            <button
              type="button"
              onClick={handlePanicReset}
              disabled={panicSubmitting}
              className="mt-4 rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2.5 font-semibold disabled:opacity-50"
            >
              {panicSubmitting ? 'Resetting...' : 'Panic Reset Session'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
