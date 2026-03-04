import { create } from 'zustand';
import { api } from '../services/api';

export interface Room {
    id: string;
    name: string;
    description?: string;
    type: 'public' | 'private';
    participantsCount: number;
    monkeyConfig?: {
        name: string;
        personality?: string;
    };
    settings?: {
        maxParticipants?: number;
        allowImages?: boolean;
        vibeMode?: string;
    };
    creatorId: string;
    rulesText?: string;
    createdAt?: string;
}

interface RoomState {
    rooms: Room[];
    loading: boolean;
    error: string | null;
    fetchRooms: () => Promise<void>;
    updateRoomParticipants: (roomId: string, participants: any[]) => void;
    reset: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
    rooms: [],
    loading: false,
    error: null,
    fetchRooms: async () => {
        set({ loading: true, error: null });
        try {
            const response = await api.get('/rooms');
            // Backend returns { success: true, data: [...rooms] }
            const rooms = response.data?.data ?? response.data ?? [];
            set({ rooms: Array.isArray(rooms) ? rooms : [], loading: false });
        } catch (err: any) {
            set({ error: err.message || 'Failed to fetch rooms', loading: false });
        }
    },
    updateRoomParticipants: (roomId, participants) => {
        set((state) => ({
            rooms: state.rooms.map((room) =>
                room.id === roomId
                    ? { ...room, participantsCount: participants.length }
                    : room
            ),
        }));
    },
    reset: () => set({ rooms: [], loading: false, error: null }),
}));
