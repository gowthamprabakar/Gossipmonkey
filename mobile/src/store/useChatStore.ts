import { create } from 'zustand';
import { socketManager } from '../services/socket';
import { MessageType } from '../components/MessageBubble';
import { useAppStore } from './useAppStore';

export interface MessageData {
    id: string;
    text: string;
    type: MessageType;
    imageUrl?: string | null;
    timestamp: string;
    sender: {
        id: string;
        name: string;
        avatar: string;
    };
    replyTo?: {
        id: string;
        text: string;
        senderName: string;
    };
    reactions?: Record<string, string>;
}

export interface Participant {
    id: string;
    name: string;
    avatar: string;
    score?: number;
}

export interface KnockRequest {
    socketId: string;
    persona: { id: string; name: string; avatar: string; score?: number };
    roomId: string;
}

interface ChatState {
    messages: MessageData[];
    participants: Participant[];
    participantsCount: number;
    aiAvailable: boolean;
    knockQueue: KnockRequest[];
    joinRoom: (roomId: string) => void;
    leaveRoom: (roomId: string) => void;
    sendMessage: (roomId: string, text?: string, imageUrl?: string) => void;
    addMessage: (msg: MessageData) => void;
    setHistory: (messages: MessageData[]) => void;
    updateMessage: (msg: Partial<MessageData> & { id: string }) => void;
    removeMessage: (messageId: string) => void;
    setParticipantsCount: (count: number) => void;
    setAiStatus: (status: boolean) => void;
    addKnock: (knock: KnockRequest) => void;
    removeKnock: (socketId: string) => void;
    approveKnock: (socketId: string, roomId: string, approved: boolean) => void;
    replyingTo: MessageData | null;
    setReplyingTo: (msg: MessageData | null) => void;
    clearReplyingTo: () => void;
    reset: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    messages: [],
    participants: [],
    participantsCount: 0,
    aiAvailable: true,
    knockQueue: [],
    replyingTo: null,

    setReplyingTo: (msg) => set({ replyingTo: msg }),
    clearReplyingTo: () => set({ replyingTo: null }),

    reset: () => set({
        messages: [],
        participants: [],
        participantsCount: 0,
        aiAvailable: true,
        knockQueue: [],
        replyingTo: null,
    }),

    joinRoom: (roomId) => {
        socketManager.connect();
        const socket = socketManager.socket;
        if (!socket) return;

        set({ messages: [], participants: [], participantsCount: 0, aiAvailable: true, knockQueue: [] });
        socket.emit('join_room', { roomId });

        socket.on('room_history', (data: { messages: MessageData[] }) => {
            set({ messages: data.messages.reverse() });
        });

        socket.on('receive_message', (msg: MessageData) => {
            get().addMessage(msg);
        });

        socket.on('system_message', (msg: any) => {
            const sysMsg: MessageData = {
                id: msg.id || `sys-${Date.now()}`,
                text: msg.text,
                type: 'system',
                timestamp: msg.timestamp || new Date().toISOString(),
                sender: { id: 'system', name: 'System', avatar: '' },
            };
            get().addMessage(sysMsg);
        });

        socket.on('participants_updated', (data: { participants: Participant[] }) => {
            set({
                participants: data.participants ?? [],
                participantsCount: data.participants?.length ?? 0,
            });
        });

        socket.on('system_status', (data: { aiAvailable: boolean }) => {
            set({ aiAvailable: data.aiAvailable });
        });

        socket.on('balance_update', (data: { userId: string; newScore: number }) => {
            const { persona, setPersona } = useAppStore.getState();
            if (persona && persona.id === data.userId) {
                setPersona({ ...persona, score: data.newScore });
            }
        });

        socket.on('message_updated', (updatedMsg: MessageData) => {
            get().updateMessage(updatedMsg);
        });

        socket.on('message_deleted', (data: { messageId: string }) => {
            get().removeMessage(data.messageId);
        });

        // Admin: incoming knock from a user wanting to join private room
        socket.on('knock_request', (data: { socketId: string; persona: any }) => {
            get().addKnock({ socketId: data.socketId, persona: data.persona, roomId });
        });
    },

    leaveRoom: (roomId) => {
        const socket = socketManager.socket;
        if (socket) {
            socket.emit('leave_room', { roomId });
            ['receive_message', 'room_history', 'system_message', 'participants_updated',
                'system_status', 'balance_update', 'message_updated', 'message_deleted',
                'knock_request', 'flags_updated', 'banned_users_updated'].forEach(e => socket.off(e));
        }
        set({ replyingTo: null });
    },

    sendMessage: (roomId, text, imageUrl) => {
        const socket = socketManager.socket;
        const state = get();
        const replyToId = state.replyingTo?.id;

        if (socket) {
            socket.emit('send_message', { roomId, text, imageUrl, replyToId });
        }
        state.clearReplyingTo();
    },

    addMessage: (msg) => {
        set((state) => {
            if (state.messages.find(m => m.id === msg.id)) return state;
            return { messages: [msg, ...state.messages] };
        });
    },

    setHistory: (messages) => set({ messages }),

    updateMessage: (updatedMsg) => {
        set((state) => ({
            messages: state.messages.map(m =>
                m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m
            ),
        }));
    },

    removeMessage: (messageId) => {
        set((state) => ({
            messages: state.messages.filter(m => m.id !== messageId),
        }));
    },

    setParticipantsCount: (count) => set({ participantsCount: count }),
    setAiStatus: (status) => set({ aiAvailable: status }),

    addKnock: (knock) => {
        set(state => ({
            knockQueue: [...state.knockQueue.filter(k => k.persona.id !== knock.persona.id), knock],
        }));
    },

    removeKnock: (socketId) => {
        set(state => ({ knockQueue: state.knockQueue.filter(k => k.socketId !== socketId) }));
    },

    approveKnock: (socketId, roomId, approved) => {
        const socket = socketManager.socket;
        if (socket) socket.emit('approve_entry', { socketId, roomId, approved });
        get().removeKnock(socketId);
    },
}));
