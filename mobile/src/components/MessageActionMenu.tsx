import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { GlassCard } from './GlassCard';
import { MessageData } from '../store/useChatStore';

interface ActionMenuProps {
    visible: boolean;
    message: MessageData | null;
    onClose: () => void;
    onReact: (reaction: string) => void;
    onTip: (amount: number) => void;
}

export function MessageActionMenu({ visible, message, onClose, onReact, onTip }: ActionMenuProps) {
    if (!message) return null;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity
                className="flex-1 bg-black/60 justify-center items-center px-4"
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity activeOpacity={1}>
                    <GlassCard className="w-80 p-0">
                        {/* Reactions row */}
                        <View className="flex-row justify-around py-4 border-b border-white/10">
                            {['😂', '🔥', '💯', '🐒', '👀'].map(emoji => (
                                <TouchableOpacity key={emoji} onPress={() => { onReact(emoji); onClose(); }}>
                                    <Text className="text-2xl">{emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Actions list */}
                        <View className="py-2">
                            <TouchableOpacity
                                className="px-6 py-3 border-b border-white/5"
                                onPress={() => { onTip(5); onClose(); }}
                            >
                                <Text className="text-BananaYellow font-medium text-lg">Tip 5 🍌</Text>
                            </TouchableOpacity>
                            <TouchableOpacity className="px-6 py-3 border-b border-white/5" onPress={onClose}>
                                <Text className="text-TextPrimary font-medium text-lg">Copy Text</Text>
                            </TouchableOpacity>
                            <TouchableOpacity className="px-6 py-3" onPress={onClose}>
                                <Text className="text-red-400 font-medium text-lg">Flag Message</Text>
                            </TouchableOpacity>
                        </View>
                    </GlassCard>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}
