const rooms = [
    {
        id: 'global',
        name: 'Global Jungle',
        type: 'public',
        rules: 'No screaming allowed.',
        creatorId: 'system',
        requiresApproval: false,
        activePersonas: [],
        pendingKnocks: [],
        bannedUserIds: []
    }
];

export const getRoomsData = () => rooms;

export const addRoom = (room) => {
    rooms.push(room);
};

export const findRoomById = (id) => {
    return rooms.find(r => r.id === id);
};

export const updateRoom = (id, updates) => {
    const room = findRoomById(id);
    if (room) {
        Object.assign(room, updates);
        return room;
    }
    return null;
};

export const deleteRoom = (id) => {
    const index = rooms.findIndex(r => r.id === id);
    if (index !== -1) {
        return rooms.splice(index, 1)[0];
    }
    return null;
};

