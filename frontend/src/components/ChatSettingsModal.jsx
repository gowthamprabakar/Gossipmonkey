import React, { useState } from 'react';
import { emitSocket } from '../services/socketService';

// ── Toggle ─────────────────────────────────────────────────────────────────────
const Toggle = ({ label, checked, onChange, helpText }) => (
    <div className="flex items-start justify-between py-3 border-b border-terminal-green/20 last:border-0 hover:bg-white/5 px-2 -mx-2">
        <div>
            <div className="text-sm font-bold text-terminal-green uppercase">{label}</div>
            {helpText && <div className="text-xs text-terminal-dim mt-0.5">{helpText}</div>}
        </div>
        <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <div className="w-11 h-6 bg-terminal-dim/30 border border-terminal-dim peer-checked:bg-terminal-green/20 peer-checked:border-terminal-green
        after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-terminal-dim after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:bg-terminal-green">
            </div>
        </label>
    </div>
);

// ── Section Header ─────────────────────────────────────────────────────────────
const SectionHeader = ({ children }) => (
    <div className="text-xs text-terminal-dim uppercase tracking-widest mb-3 mt-1 border-b border-terminal-dim/40 pb-1">
        {children}
    </div>
);

// ── Personality Presets ────────────────────────────────────────────────────────
const PRESETS = [
    { id: 'sarcastic', label: '😏 Sarcastic', desc: 'Dry wit, backhanded compliments' },
    { id: 'hype', label: '🔥 Hype Beast', desc: 'CAPS LOCK energy, gets excited' },
    { id: 'wise', label: '🧘 Wise Sage', desc: 'Philosophical quotes & questions' },
    { id: 'mentor', label: '🎓 Mentor', desc: 'Encouraging, constructive advice' },
    { id: 'chaotic', label: '🌀 Chaotic', desc: 'Conspiracy tangents, unhinged' },
    { id: 'detective', label: '🕵️ Detective', desc: 'Noir monologue, everyone a suspect' },
    { id: 'silent', label: '🤫 Silent', desc: 'Almost never speaks, hits hard' },
    { id: 'custom', label: '✏️ Custom', desc: 'Write your own system prompt' },
];

// ── Hook Labels ────────────────────────────────────────────────────────────────
const HOOKS = [
    { key: 'user_joined', label: '👋 User Joined', desc: 'Monkey greets new users with an in-character welcome' },
    { key: 'user_left', label: '🚪 User Left', desc: 'Monkey comments when someone leaves' },
    { key: 'user_kicked', label: '👢 User Kicked', desc: 'Monkey comments after a kick' },
    { key: 'user_banned', label: '🔨 User Banned', desc: 'Monkey announces the ban' },
    { key: 'room_locked', label: '🔒 Lockdown On', desc: 'Monkey announces lockdown starts' },
    { key: 'room_unlocked', label: '🔓 Lockdown Off', desc: 'Monkey announces lockdown lifted' },
    { key: 'room_muted', label: '🔇 Mute On', desc: 'Monkey comments when room is muted' },
    { key: 'room_unmuted', label: '🔊 Mute Off', desc: 'Monkey comments when mute is lifted' },
    { key: 'paint_triggered', label: '🎨 /paint Used', desc: 'Monkey reacts when someone paints' },
    { key: 'image_shared', label: '📸 Image Shared', desc: 'Monkey reacts to image uploads' },
];

// ── Cron Schedule Presets ──────────────────────────────────────────────────────
const CRON_PRESETS = [
    { label: 'Every hour', value: '0 * * * *' },
    { label: 'Daily at midnight', value: '0 0 * * *' },
    { label: 'Daily at 9am', value: '0 9 * * *' },
    { label: 'Friday 5pm', value: '0 17 * * 5' },
    { label: 'Custom...', value: 'custom' },
];

// ── CronBuilder ────────────────────────────────────────────────────────────────
const CronBuilder = ({ crons = [], onChange }) => {
    const [customSchedules, setCustomSchedules] = useState({});

    const addCron = () => {
        if (crons.length >= 5) return;
        onChange([...crons, {
            id: `cron-${Date.now()}`,
            name: 'New Task',
            schedule: '0 0 * * *',
            instruction: '',
            enabled: true
        }]);
    };

    const removeCron = (id) => onChange(crons.filter(c => c.id !== id));

    const updateCron = (id, patch) => onChange(crons.map(c => c.id === id ? { ...c, ...patch } : c));

    return (
        <div className="space-y-3">
            {crons.map((cron, i) => (
                <div key={cron.id} className="border border-terminal-green/30 p-3 space-y-2 hover:border-terminal-green/50 transition-colors">
                    <div className="flex gap-2 items-center">
                        <input
                            type="text"
                            value={cron.name}
                            maxLength={32}
                            onChange={(e) => updateCron(cron.id, { name: e.target.value })}
                            placeholder={`Task ${i + 1}`}
                            className="flex-1 bg-black border border-terminal-green/50 text-terminal-green text-xs p-1.5 outline-none font-mono"
                        />
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input type="checkbox" className="sr-only peer" checked={cron.enabled} onChange={(e) => updateCron(cron.id, { enabled: e.target.checked })} />
                            <div className="w-8 h-4 bg-terminal-dim/30 border border-terminal-dim peer-checked:bg-terminal-green/20 peer-checked:border-terminal-green after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-terminal-dim after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:bg-terminal-green"></div>
                        </label>
                        <button onClick={() => removeCron(cron.id)} className="text-[10px] text-terminal-dim hover:text-red-400 font-mono border border-terminal-dim/30 hover:border-red-400 px-1.5 py-0.5">✕</button>
                    </div>
                    <div>
                        <label className="text-[10px] text-terminal-dim uppercase block mb-1">Schedule</label>
                        <select
                            value={CRON_PRESETS.find(p => p.value === cron.schedule) ? cron.schedule : 'custom'}
                            onChange={(e) => {
                                if (e.target.value !== 'custom') updateCron(cron.id, { schedule: e.target.value });
                                else setCustomSchedules(cs => ({ ...cs, [cron.id]: true }));
                            }}
                            className="w-full bg-black border border-terminal-green/50 text-terminal-green text-xs p-1 outline-none font-mono"
                        >
                            {CRON_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                        {(customSchedules[cron.id] || !CRON_PRESETS.find(p => p.value === cron.schedule)) && (
                            <input
                                type="text"
                                value={cron.schedule}
                                onChange={(e) => updateCron(cron.id, { schedule: e.target.value })}
                                placeholder="0 9 * * 1-5"
                                className="w-full mt-1 bg-black border border-terminal-green/50 text-terminal-green text-xs p-1 outline-none font-mono"
                            />
                        )}
                    </div>
                    <div>
                        <label className="text-[10px] text-terminal-dim uppercase block mb-1">Instruction</label>
                        <textarea
                            value={cron.instruction}
                            onChange={(e) => updateCron(cron.id, { instruction: e.target.value })}
                            placeholder="Announce today's top banana earner with a short roast..."
                            rows={2}
                            className="w-full bg-black border border-terminal-green/50 text-terminal-green text-xs p-1.5 outline-none font-mono resize-none"
                        />
                    </div>
                </div>
            ))}
            {crons.length < 5 && (
                <button
                    onClick={addCron}
                    className="w-full border border-dashed border-terminal-green/40 text-terminal-dim hover:text-terminal-green hover:border-terminal-green text-xs font-mono py-2 transition-colors"
                >
                    + ADD CRON ({crons.length}/5)
                </button>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN MODAL
// ═══════════════════════════════════════════════════════════════════════════════
const MAIN_TABS = [
    { id: 'system', label: '⚙ SYSTEM' },
    { id: 'monkey', label: '🐒 MONKEY_BRAIN' },
];

const MONKEY_SUBTABS = [
    { id: 'identity', label: 'IDENTITY' },
    { id: 'heartbeat', label: '💓 HEARTBEAT' },
    { id: 'hooks', label: '🪝 HOOKS' },
    { id: 'crons', label: '⏰ CRONS' },
    { id: 'webhooks', label: '🔗 WEBHOOKS' },
    { id: 'bank', label: '🍌 BANK' },
];

const ChatSettingsModal = ({ settings, monkeyConfig = {}, onUpdate, onUpdateMonkey, onClose, roomId, personaId }) => {
    const [tab, setTab] = useState('system');
    const [monkeySubtab, setMonkeySubtab] = useState('identity');
    const [secretVisible, setSecretVisible] = useState(false);
    const [copied, setCopied] = useState(false);
    const [rotateLoading, setRotateLoading] = useState(false);
    const [pingStatus, setPingStatus] = useState(null); // null | 'ok' | 'fail'
    const [liveBalance, setLiveBalance] = useState(null); // null = use mc.monkeyBankBalance

    const mc = {
        name: 'Gossip Monkey', avatarSeed: 'Gossip', personality: 'sarcastic',
        customPrompt: '', triggerWords: ['monkey'], replyFrequency: 0.2,
        aiRewardAmount: 2, maxDailyRewardPerUser: 20, maxReplyLength: 280,
        welcomeMessage: '', heartbeatEnabled: false, heartbeatIntervalMinutes: 10,
        hooksEnabled: {}, crons: [], webhookSecret: '',
        monkeyBankBalance: 50, monkeyBankDailyReset: 50,
        ...monkeyConfig
    };

    const hooksEnabled = { ...mc.hooksEnabled };
    const triggerWordsStr = Array.isArray(mc.triggerWords) ? mc.triggerWords.join(', ') : 'monkey';
    const webhookUrl = roomId
        ? `${window.location.protocol}//${window.location.hostname}:3000/api/rooms/${roomId}/webhook`
        : '';

    const copyWebhookUrl = () => {
        navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    /** POST /api/rooms/:roomId/webhook/rotate — generates a new secret */
    const rotateSecret = async () => {
        if (!roomId || !personaId || rotateLoading) return;
        setRotateLoading(true);
        try {
            const res = await fetch(
                `${window.location.protocol}//${window.location.hostname}:3000/api/rooms/${roomId}/webhook/rotate`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ personaId })
                }
            );
            const json = await res.json();
            if (json.ok && json.webhookSecret) {
                onUpdateMonkey({ webhookSecret: json.webhookSecret });
                setSecretVisible(true); // auto-reveal so admin sees new secret
            }
        } catch (e) {
            console.error('[Webhook] rotate error:', e);
        } finally {
            setRotateLoading(false);
        }
    };

    /** GET /api/rooms/:roomId/webhook — verify secret is valid (connectivity test) */
    const pingTestWebhook = async () => {
        if (!roomId || !mc.webhookSecret) return;
        setPingStatus(null);
        try {
            const res = await fetch(webhookUrl, {
                headers: { Authorization: `Bearer ${mc.webhookSecret}` }
            });
            const json = await res.json();
            setPingStatus(json.ok ? 'ok' : 'fail');
        } catch {
            setPingStatus('fail');
        }
        setTimeout(() => setPingStatus(null), 4000);
    };

    /** BANK: real socket top-up */
    const topUpBank = (amount) => {
        if (!roomId) return;
        emitSocket('top_up_monkey_bank', { roomId, amount });
    };

    /** Listen for real-time bank balance updates bridged via window event from Chat.jsx */
    React.useEffect(() => {
        // FIX: store handler reference so removeEventListener uses the SAME function object
        const windowHandler = (e) => {
            if (e.detail?.roomId === roomId) setLiveBalance(e.detail.monkeyBankBalance);
        };
        window.addEventListener('monkey_bank_update', windowHandler);
        return () => window.removeEventListener('monkey_bank_update', windowHandler);
    }, [roomId]);

    const displayBalance = liveBalance !== null ? liveBalance : mc.monkeyBankBalance;

    return (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-black border-2 border-terminal-green w-full max-w-2xl shadow-[0_0_60px_rgba(57,255,20,0.15)] flex flex-col max-h-[92vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-terminal-green text-black p-2 font-bold flex justify-between uppercase text-sm select-none shrink-0">
                    <span>[ ROOT_ACCESS ] Configuration Terminal</span>
                    <button onClick={onClose} className="hover:bg-black hover:text-terminal-green px-1">[X]</button>
                </div>

                {/* Main Tabs */}
                <div className="flex border-b border-terminal-green shrink-0">
                    {MAIN_TABS.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${tab === t.id
                                ? 'bg-terminal-green/20 text-terminal-green border-b-2 border-terminal-green'
                                : 'text-terminal-dim hover:text-terminal-green'}`}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Monkey Sub-tabs */}
                {tab === 'monkey' && (
                    <div className="flex border-b border-terminal-green/30 shrink-0 overflow-x-auto">
                        {MONKEY_SUBTABS.map(t => (
                            <button key={t.id} onClick={() => setMonkeySubtab(t.id)}
                                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${monkeySubtab === t.id
                                    ? 'bg-terminal-green/10 text-terminal-green border-b border-terminal-green'
                                    : 'text-terminal-dim hover:text-terminal-green'}`}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Content */}
                <div className="p-5 overflow-y-auto flex-1">

                    {/* ── SYSTEM TAB ───────────────────────────────────────────────── */}
                    {tab === 'system' && (
                        <div className="space-y-1">
                            <SectionHeader>Security Protocols</SectionHeader>
                            <Toggle label="LOCKDOWN MODE" helpText="Prevent new connections. No one can join."
                                checked={!!settings.lockRoom} onChange={(val) => onUpdate({ lockRoom: val })} />
                            <Toggle label="APPROVAL GATE" helpText="New users must be approved by admin."
                                checked={!!settings.approvalRequired} onChange={(val) => onUpdate({ approvalRequired: val })} />
                            <SectionHeader>Communication Protocols</SectionHeader>
                            <Toggle label="MUTE ALL NODES" helpText="Only admin can broadcast messages."
                                checked={!!settings.muteAll} onChange={(val) => onUpdate({ muteAll: val })} />
                            <Toggle label="VISUALS ONLY" helpText="Text disabled. Images & /paint only."
                                checked={!!settings.imageOnly} onChange={(val) => onUpdate({ imageOnly: val })} />
                            <div className="flex items-center justify-between py-3 hover:bg-white/5 px-2 -mx-2">
                                <div>
                                    <div className="text-sm font-bold text-terminal-green uppercase">SLOW MODE</div>
                                    <div className="text-xs text-terminal-dim mt-0.5">Delay between messages</div>
                                </div>
                                <select value={settings.slowModeSeconds}
                                    onChange={(e) => onUpdate({ slowModeSeconds: Number(e.target.value) })}
                                    className="bg-black border border-terminal-green text-terminal-green text-sm p-1 outline-none font-mono">
                                    <option value={0}>OFF</option>
                                    <option value={5}>5s</option>
                                    <option value={10}>10s</option>
                                    <option value={30}>30s</option>
                                    <option value={60}>60s</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* ── MONKEY BRAIN: IDENTITY ──────────────────────────────────── */}
                    {tab === 'monkey' && monkeySubtab === 'identity' && (
                        <div className="space-y-5">
                            <div>
                                <SectionHeader>Identity Matrix</SectionHeader>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-terminal-dim uppercase block mb-1">Monkey Name</label>
                                        <input type="text" value={mc.name} maxLength={32}
                                            onChange={(e) => onUpdateMonkey({ name: e.target.value })}
                                            placeholder="Gossip Monkey"
                                            className="w-full bg-black border border-terminal-green/50 focus:border-terminal-green text-terminal-green text-sm p-2 outline-none font-mono" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-terminal-dim uppercase block mb-1">Avatar Seed</label>
                                        <div className="flex gap-2 items-center">
                                            <input type="text" value={mc.avatarSeed} maxLength={32}
                                                onChange={(e) => onUpdateMonkey({ avatarSeed: e.target.value })}
                                                className="flex-1 bg-black border border-terminal-green/50 focus:border-terminal-green text-terminal-green text-sm p-2 outline-none font-mono" />
                                            <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(mc.avatarSeed || 'Gossip')}`}
                                                alt="avatar" className="w-10 h-10 border border-terminal-green bg-black p-0.5" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <SectionHeader>Personality Preset</SectionHeader>
                                <div className="grid grid-cols-2 gap-2">
                                    {PRESETS.map(p => (
                                        <button key={p.id} onClick={() => onUpdateMonkey({ personality: p.id })}
                                            className={`p-2 text-left border text-xs font-mono transition-all ${mc.personality === p.id
                                                ? 'border-terminal-green bg-terminal-green/15 text-terminal-green'
                                                : 'border-terminal-dim/30 text-terminal-dim hover:border-terminal-green hover:text-terminal-green'}`}>
                                            <div className="font-bold">{p.label}</div>
                                            <div className="opacity-60 text-[10px] mt-0.5">{p.desc}</div>
                                        </button>
                                    ))}
                                </div>
                                {mc.personality === 'custom' && (
                                    <div className="mt-3">
                                        <label className="text-xs text-terminal-dim uppercase block mb-1">Custom System Prompt</label>
                                        <textarea value={mc.customPrompt}
                                            onChange={(e) => onUpdateMonkey({ customPrompt: e.target.value })}
                                            placeholder="You are X, a quirky AI in this chat..."
                                            rows={5} className="w-full bg-black border border-terminal-green/50 focus:border-terminal-green text-terminal-green text-sm p-2 outline-none font-mono resize-y" />
                                    </div>
                                )}
                            </div>

                            <div>
                                <SectionHeader>Trigger Configuration</SectionHeader>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-terminal-dim uppercase block mb-1">Trigger Words <span className="normal-case">(comma-separated)</span></label>
                                        <input type="text" defaultValue={triggerWordsStr}
                                            onBlur={(e) => {
                                                const words = e.target.value.split(',').map(w => w.trim()).filter(Boolean);
                                                onUpdateMonkey({ triggerWords: words.length ? words : ['monkey'] });
                                            }}
                                            className="w-full bg-black border border-terminal-green/50 focus:border-terminal-green text-terminal-green text-sm p-2 outline-none font-mono" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-terminal-dim uppercase block mb-2">
                                            Reply Frequency: <span className="text-terminal-green">{Math.round(mc.replyFrequency * 100)}%</span>
                                        </label>
                                        <input type="range" min={0} max={1} step={0.05} value={mc.replyFrequency}
                                            onChange={(e) => onUpdateMonkey({ replyFrequency: parseFloat(e.target.value) })}
                                            className="w-full accent-terminal-green" />
                                        <div className="flex justify-between text-[10px] text-terminal-dim mt-1">
                                            <span>SILENT</span><span>RARE</span><span>ACTIVE</span><span>ALWAYS</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <SectionHeader>Reward Economy</SectionHeader>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-terminal-dim uppercase block mb-1">
                                            Bananas Per AI Reply: <span className="text-terminal-green">🍌 {mc.aiRewardAmount}</span>
                                        </label>
                                        <input type="range" min={0} max={10} step={1} value={mc.aiRewardAmount}
                                            onChange={(e) => onUpdateMonkey({ aiRewardAmount: parseInt(e.target.value) })}
                                            className="w-full accent-terminal-green" />
                                        <div className="flex justify-between text-[10px] text-terminal-dim mt-1">
                                            <span>0 (off)</span><span>5</span><span>10</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-terminal-dim uppercase block mb-1">
                                            Daily Cap Per User: <span className="text-terminal-green">🍌 {mc.maxDailyRewardPerUser}</span>
                                        </label>
                                        <input type="range" min={5} max={100} step={5} value={mc.maxDailyRewardPerUser}
                                            onChange={(e) => onUpdateMonkey({ maxDailyRewardPerUser: parseInt(e.target.value) })}
                                            className="w-full accent-terminal-green" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <SectionHeader>Welcome Protocol</SectionHeader>
                                <textarea value={mc.welcomeMessage}
                                    onChange={(e) => onUpdateMonkey({ welcomeMessage: e.target.value })}
                                    placeholder={`Welcome to the jungle, {name}.`}
                                    rows={2} className="w-full bg-black border border-terminal-green/50 focus:border-terminal-green text-terminal-green text-sm p-2 outline-none font-mono resize-none" />
                                <div className="text-[10px] text-terminal-dim mt-1">Use {'{name}'} for user's name. Leave empty to disable.</div>
                            </div>
                        </div>
                    )}

                    {/* ── MONKEY BRAIN: HEARTBEAT ─────────────────────────────────── */}
                    {tab === 'monkey' && monkeySubtab === 'heartbeat' && (
                        <div className="space-y-5">
                            <SectionHeader>Heartbeat System</SectionHeader>
                            <div className="text-xs text-terminal-dim mb-4 leading-relaxed">
                                The Monkey wakes up periodically to check on the room. If the room is silent, it starts a conversation.
                                If the room is active, it stays quiet. Memory is consolidated every 3 heartbeats.
                            </div>
                            <Toggle label="ENABLE HEARTBEAT" helpText="Monkey wakes on a timer to check room vitals"
                                checked={!!mc.heartbeatEnabled} onChange={(val) => onUpdateMonkey({ heartbeatEnabled: val })} />
                            <div>
                                <label className="text-xs text-terminal-dim uppercase block mb-2">
                                    Interval: <span className="text-terminal-green">{mc.heartbeatIntervalMinutes} min</span>
                                </label>
                                <input type="range" min={1} max={60} step={1}
                                    value={mc.heartbeatIntervalMinutes}
                                    onChange={(e) => onUpdateMonkey({ heartbeatIntervalMinutes: parseInt(e.target.value) })}
                                    className="w-full accent-terminal-green"
                                    disabled={!mc.heartbeatEnabled} />
                                <div className="flex justify-between text-[10px] text-terminal-dim mt-1">
                                    <span>1min (fast)</span><span>10min</span><span>30min</span><span>60min (slow)</span>
                                </div>
                            </div>
                            <div className="border border-terminal-green/20 p-3 text-xs text-terminal-dim space-y-1">
                                <div className="text-terminal-green font-bold text-[10px] uppercase mb-2">Heartbeat Logic</div>
                                <div>• &lt;3 min since last msg → stays silent</div>
                                <div>• 3-15 min → posts a short observation</div>
                                <div>• 15+ min → starts a new conversation</div>
                                <div>• Every 3rd heartbeat → consolidates room memory</div>
                            </div>
                        </div>
                    )}

                    {/* ── MONKEY BRAIN: HOOKS ─────────────────────────────────────── */}
                    {tab === 'monkey' && monkeySubtab === 'hooks' && (
                        <div className="space-y-2">
                            <SectionHeader>Event Hooks</SectionHeader>
                            <div className="text-xs text-terminal-dim mb-3 leading-relaxed">
                                Hooks make the Monkey react to things that happen in the room — not just messages.
                                Enable the events you want the Monkey to comment on.
                            </div>
                            {HOOKS.map(hook => (
                                <Toggle key={hook.key} label={hook.label} helpText={hook.desc}
                                    checked={!!hooksEnabled[hook.key]}
                                    onChange={(val) => onUpdateMonkey({
                                        hooksEnabled: { ...mc.hooksEnabled, [hook.key]: val }
                                    })} />
                            ))}
                        </div>
                    )}

                    {/* ── MONKEY BRAIN: CRONS ─────────────────────────────────────── */}
                    {tab === 'monkey' && monkeySubtab === 'crons' && (
                        <div className="space-y-4">
                            <SectionHeader>Scheduled Tasks</SectionHeader>
                            <div className="text-xs text-terminal-dim mb-3 leading-relaxed">
                                Schedule recurring tasks the Monkey executes automatically. Each task runs on a cron schedule
                                and executes the plain-English instruction you provide. Max 5 crons per room.
                            </div>
                            <div className="border border-terminal-green/20 p-3 text-xs text-terminal-dim space-y-1 mb-3">
                                <div className="text-terminal-green font-bold text-[10px] uppercase mb-2">Example Instructions</div>
                                <div>• "Announce today's top banana earner with a playful roast"</div>
                                <div>• "Post a thought-provoking question for the room"</div>
                                <div>• "Give a weekly summary of the most interesting conversations"</div>
                            </div>
                            <CronBuilder
                                crons={Array.isArray(mc.crons) ? mc.crons : []}
                                onChange={(newCrons) => onUpdateMonkey({ crons: newCrons })}
                            />
                        </div>
                    )}

                    {/* ── MONKEY BRAIN: WEBHOOKS ──────────────────────────────────── */}
                    {tab === 'monkey' && monkeySubtab === 'webhooks' && (
                        <div className="space-y-5">
                            <SectionHeader>Webhook Integration</SectionHeader>
                            <div className="text-xs text-terminal-dim leading-relaxed">
                                Connect external systems (news feeds, sports APIs, GitHub, etc.) to inject alerts into
                                this room. The Monkey summarises incoming webhook payloads and delivers them to chat.
                            </div>

                            <div>
                                <label className="text-xs text-terminal-dim uppercase block mb-1">Webhook URL</label>
                                <div className="flex gap-2">
                                    <input readOnly value={webhookUrl}
                                        className="flex-1 bg-black border border-terminal-green/30 text-terminal-dim text-xs p-2 outline-none font-mono truncate" />
                                    <button onClick={copyWebhookUrl}
                                        className="text-xs font-mono border border-terminal-green text-terminal-green px-3 py-1 hover:bg-terminal-green/20 transition-colors shrink-0">
                                        {copied ? '✓ COPIED' : 'COPY'}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-terminal-dim uppercase block mb-1">Secret Key</label>
                                <div className="flex gap-2">
                                    <input readOnly
                                        value={secretVisible ? (mc.webhookSecret || 'No secret generated') : '•'.repeat(32)}
                                        className="flex-1 bg-black border border-terminal-green/30 text-terminal-dim text-xs p-2 outline-none font-mono" />
                                    <button onClick={() => setSecretVisible(v => !v)}
                                        className="text-xs font-mono border border-terminal-dim text-terminal-dim px-3 py-1 hover:border-terminal-green hover:text-terminal-green transition-colors shrink-0">
                                        {secretVisible ? 'HIDE' : 'SHOW'}
                                    </button>
                                </div>
                                <div className="text-[10px] text-terminal-dim mt-1">Use as: <span className="text-terminal-green font-mono">Authorization: Bearer {'{secret}'}</span></div>
                            </div>

                            {/* Regenerate + Ping buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={rotateSecret}
                                    disabled={rotateLoading}
                                    className="flex-1 text-xs font-mono border border-yellow-500/60 text-yellow-400 py-2 hover:bg-yellow-500/10 transition-colors disabled:opacity-50">
                                    {rotateLoading ? '⟳ ROTATING...' : '🔄 REGENERATE SECRET'}
                                </button>
                                <button
                                    onClick={pingTestWebhook}
                                    className={`flex-1 text-xs font-mono border py-2 transition-colors ${pingStatus === 'ok' ? 'border-terminal-green text-terminal-green bg-terminal-green/10' :
                                        pingStatus === 'fail' ? 'border-red-500 text-red-400 bg-red-500/10' :
                                            'border-terminal-dim/40 text-terminal-dim hover:border-terminal-green hover:text-terminal-green'
                                        }`}>
                                    {pingStatus === 'ok' ? '✓ CONNECTION OK' : pingStatus === 'fail' ? '✗ PING FAILED' : '📡 TEST CONNECTION'}
                                </button>
                            </div>
                            <div className="text-[10px] text-terminal-dim">⚠ Regenerating the secret will invalidate all existing integrations — update them immediately.</div>

                            <div>
                                <label className="text-xs text-terminal-dim uppercase block mb-1">
                                    Rate Limit: <span className="text-terminal-green">{mc.webhookRateLimitPerMinute}/min</span>
                                </label>
                                <input type="range" min={1} max={30} step={1}
                                    value={mc.webhookRateLimitPerMinute || 10}
                                    onChange={(e) => onUpdateMonkey({ webhookRateLimitPerMinute: parseInt(e.target.value) })}
                                    className="w-full accent-terminal-green" />
                            </div>

                            <div className="border border-terminal-green/20 p-3 text-xs text-terminal-dim space-y-1">
                                <div className="text-terminal-green font-bold text-[10px] uppercase mb-2">Example Payload</div>
                                <pre className="text-[10px] font-mono text-terminal-dim/70 overflow-x-auto">{JSON.stringify({
                                    type: "news",
                                    title: "AI beats chess world champion",
                                    payload: { source: "Reuters", url: "https://..." }
                                }, null, 2)}</pre>
                            </div>
                        </div>
                    )}

                    {/* ── MONKEY BRAIN: BANK ────────────────────────────────────── */}
                    {tab === 'monkey' && monkeySubtab === 'bank' && (
                        <div className="space-y-5">
                            <SectionHeader>Monkey Bank 🍌</SectionHeader>
                            <div className="text-xs text-terminal-dim leading-relaxed">
                                The Monkey Bank funds autonomous image generation. When the Monkey decides to paint an image
                                on its own, it spends 10 bananas from this pool. The bank auto-resets daily at midnight.
                            </div>

                            <div className="border border-terminal-green p-4 text-center">
                                <div className="text-3xl font-bold text-terminal-green font-mono">🍌 {displayBalance}</div>
                                <div className="text-xs text-terminal-dim mt-1 uppercase">Current Balance</div>
                                <div className="text-[10px] text-terminal-dim/60 mt-0.5">Resets daily to {mc.monkeyBankDailyReset} • live update</div>
                            </div>

                            <div>
                                <label className="text-xs text-terminal-dim uppercase block mb-1">
                                    Daily Reset Amount: <span className="text-terminal-green">🍌 {mc.monkeyBankDailyReset}</span>
                                </label>
                                <input type="range" min={0} max={200} step={10}
                                    value={mc.monkeyBankDailyReset}
                                    onChange={(e) => onUpdateMonkey({ monkeyBankDailyReset: parseInt(e.target.value) })}
                                    className="w-full accent-terminal-green" />
                                <div className="flex justify-between text-[10px] text-terminal-dim mt-1">
                                    <span>0 (off)</span><span>50</span><span>100</span><span>200</span>
                                </div>
                            </div>

                            {/* Real socket-connected top-up buttons */}
                            <div className="grid grid-cols-3 gap-2">
                                {[25, 50, 100].map(amt => (
                                    <button key={amt} onClick={() => topUpBank(amt)}
                                        className="text-xs font-mono border border-terminal-green/60 text-terminal-green py-2 hover:bg-terminal-green/20 transition-colors">
                                        +{amt} 🍌
                                    </button>
                                ))}
                            </div>
                            <div className="text-[10px] text-terminal-dim">Top-up is instant — balance updates live for all room members.</div>

                            <div className="border border-terminal-green/20 p-3 text-xs text-terminal-dim space-y-1">
                                <div className="text-terminal-green font-bold text-[10px] uppercase mb-2">How Autonomous Paint Works</div>
                                <div>• Monkey detects visual moments in conversation</div>
                                <div>• Formulates an image prompt internally</div>
                                <div>• Image generated FIRST — bank deducted only on success</div>
                                <div>• Costs 10 🍌 per autonomous paint</div>
                                <div>• 5 minute cooldown between autonomous paints</div>
                                <div>• Set Daily Reset to 0 to disable autonomous painting</div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-3 border-t border-terminal-green/30 flex justify-end shrink-0">
                    <button onClick={onClose} className="text-xs text-terminal-dim hover:text-terminal-green uppercase font-mono border border-terminal-dim hover:border-terminal-green px-4 py-1.5 transition-colors">
                        CLOSE_TERMINAL
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatSettingsModal;
