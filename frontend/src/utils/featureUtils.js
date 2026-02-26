export const filterAndSortRooms = ({ rooms, activeTab, searchQuery }) => {
  let result = [...rooms];

  const query = String(searchQuery || '').trim().toLowerCase();
  if (query) {
    result = result.filter((room) => String(room.name || '').toLowerCase().includes(query));
  }

  if (activeTab === 'public') {
    result = result.filter((room) => !room.requiresApproval);
  }

  if (activeTab === 'private') {
    result = result.filter((room) => !!room.requiresApproval);
  }

  if (activeTab === 'hot') {
    result.sort((a, b) => (Number(b.activeCount || 0) - Number(a.activeCount || 0)));
  }

  return result;
};

export const computeProfileStats = ({ rooms, personaId }) => ({
  roomsCreated: rooms.filter((room) => room.creatorId === personaId).length,
  rewards: 0
});
