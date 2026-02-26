import React from 'react';
import Avatar from './Avatar';
import Card from './Card';

const MessageBubble = ({
    message,
    isMe
}) => {
    const { text, image, sender, timestamp, reactions = {} } = message;

    // Reaction rendering logic
    const reactionCounts = Object.entries(reactions).reduce((acc, [, emoji]) => {
        acc[emoji] = (acc[emoji] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className={`flex gap-3 mb-4 group ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div className="flex-shrink-0 mt-1">
                <Avatar
                    src={sender.avatar}
                    alt={sender.name}
                    size="md"
                    isAdmin={sender.role === 'admin'}
                />
            </div>

            {/* Content Column */}
            <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                {/* Sender Name */}
                {!isMe && (
                    <span className="text-xs text-gray-400 mb-1 ml-1">{sender.name}</span>
                )}

                {/* Bubble */}
                <Card className={`
                    relative p-3 rounded-2xl border-0
                    ${isMe
                        ? 'bg-banana-500 text-jungle-950 rounded-tr-none'
                        : 'bg-glass-white text-white rounded-tl-none border-white/10'}
                `}>
                    {image && (
                        <img
                            src={image}
                            alt="Shared content"
                            className="rounded-lg mb-2 max-w-full border border-black/10"
                        />
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed">{text}</p>

                    {/* Timestamp */}
                    <span className={`text-[10px] opacity-60 block text-right mt-1 ${isMe ? 'text-jungle-900' : 'text-gray-300'}`}>
                        {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </Card>

                {/* Reactions Display */}
                {Object.keys(reactionCounts).length > 0 && (
                    <div className={`flex gap-1 mt-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                        {Object.entries(reactionCounts).map(([emoji, count]) => (
                            <span key={emoji} className="bg-jungle-800/80 backdrop-blur border border-white/10 rounded-full px-2 py-0.5 text-xs shadow-sm">
                                {emoji} {count > 1 && count}
                            </span>
                        ))}
                    </div>
                )}

                {/* hover actions could act as a separate component or integrated here */}
            </div>
        </div>
    );
};

export default MessageBubble;
