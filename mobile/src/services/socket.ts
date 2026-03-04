import { io, Socket } from 'socket.io-client';
import { useAppStore } from '../store/useAppStore';
import Constants from 'expo-constants';

const getBackendUrl = () => {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
        const ip = hostUri.split(':')[0];
        return `http://${ip}:3000`;
    }
    return 'http://10.0.2.2:3000';
};

export const SOCKET_URL = getBackendUrl();

class SocketManager {
    socket: Socket | null = null;

    connect() {
        if (this.socket?.connected) return;

        const token = useAppStore.getState().token;

        this.socket = io(SOCKET_URL, {
            auth: { token },
            autoConnect: true,
            transports: ['websocket'],
        });

        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket?.id);
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const socketManager = new SocketManager();
