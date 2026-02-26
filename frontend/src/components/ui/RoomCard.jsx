import React from 'react';
import Button from './Button';

const RoomCard = ({ room, isMyRoom, onJoin, onCopyLink }) => {
    return (
        <div
            onClick={onJoin}
            className="group flex items-center justify-between py-2 px-4 border-b border-terminal-dim hover:bg-terminal-green hover:text-black cursor-pointer font-mono transition-none"
        >
            <div className="flex items-center gap-4 overflow-hidden">
                <span className="text-terminal-dim group-hover:text-black">[#]</span>

                <span className="font-bold truncate max-w-[200px] uppercase">
                    {room.name}
                </span>

                {isMyRoom && <span className="text-xs border border-terminal-green group-hover:border-black px-1">OWNER</span>}
                {room.requiresApproval && <span className="text-xs text-terminal-alert group-hover:text-black">[LOCKED]</span>}
            </div>

            <div className="flex items-center gap-6 text-sm">
                <div className="hidden md:block text-terminal-dim group-hover:text-black truncate max-w-[300px] text-xs lowercase">
                    {room.rules || "no_rules_defined"}
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-terminal-green group-hover:text-black">
                        {room.activeCount || 0} CONNS
                    </span>

                    {room.accessCode && (
                        <button
                            onClick={(e) => onCopyLink(e, room.accessCode)}
                            className="hidden md:inline-block hover:underline"
                            title="Copy Link"
                        >
                            [CPY]
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RoomCard;
