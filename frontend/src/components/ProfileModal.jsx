import React from 'react';
import Modal from './ui/Modal';
import Avatar from './ui/Avatar';
import Button from './ui/Button';

const ProfileModal = ({ isOpen, onClose, persona, stats }) => {
  if (!persona) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Monkey Profile">
      <div className="flex flex-col items-center p-4">
        <div className="relative mb-6">
          <Avatar src={persona.avatar} alt={persona.alias} size="xl" className="w-32 h-32 text-4xl" />
          <div className="absolute bottom-0 right-0 bg-jungle-900 rounded-full p-1 border border-white/10">
            <div className="bg-green-500 w-4 h-4 rounded-full border-2 border-jungle-900"></div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-1">{persona.alias}</h2>
        <p className="text-gray-400 font-mono text-xs mb-6 bg-white/5 px-2 py-1 rounded">ID: {persona.id.slice(0, 8)}</p>

        <div className="grid grid-cols-2 gap-4 w-full mb-4">
          <div className="bg-gradient-to-br from-banana-500/20 to-banana-500/5 border border-banana-500/20 rounded-xl p-4 text-center">
            <span className="block text-3xl font-bold text-banana-500 mb-1">{persona.score || 100}</span>
            <span className="text-xs text-banana-200 uppercase tracking-widest font-bold">Bananas</span>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-center">
            <span className="block text-3xl font-bold text-white mb-1">{stats?.roomsCreated || 0}</span>
            <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">Rooms</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full mb-8">
          <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-center">
            <span className="block text-3xl font-bold text-white mb-1">{stats?.rewards || 0}</span>
            <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">Rewards</span>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-center">
            <span className="block text-3xl font-bold text-white mb-1">Active</span>
            <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">Status</span>
          </div>
        </div>

        <div className="w-full space-y-3">
          <div className="p-4 bg-jungle-950/50 rounded-xl border border-dashed border-white/10 text-center">
            <p className="text-gray-500 text-sm">Reward inventory arrives in next cycle.</p>
          </div>

          <Button variant="secondary" className="w-full" onClick={() => alert('Cash out is a placeholder in this release.')}>Cash Out</Button>
        </div>
      </div>
    </Modal>
  );
};

export default ProfileModal;
