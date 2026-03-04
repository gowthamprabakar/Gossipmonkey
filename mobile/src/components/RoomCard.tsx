import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';

interface RoomCardProps {
    room: {
        id: string;
        name: string;
        description?: string;
        type: 'public' | 'private';
        participantsCount: number;
        monkeyConfig?: {
            name: string;
        };
    };
    onJoin: () => void;
}

export function RoomCard({ room, onJoin }: RoomCardProps) {

    // Helper to determine theme based on monkeyConfig name (fallback to purple)
    const getTheme = () => {
        const name = room.monkeyConfig?.name?.toLowerCase() || '';
        if (name.includes('chaos')) return { color: '#f59e0b', tag: 'CHAOS', bg: 'bg-[#f59e0b]', text: 'text-[#f59e0b]', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]', icon: 'celebration' };
        if (name.includes('helper') || name.includes('wise')) return { color: '#06b6d4', tag: 'WISE', bg: 'bg-[#06b6d4]', text: 'text-[#06b6d4]', glow: 'shadow-[0_0_20px_rgba(6,182,212,0.2)]', icon: 'psychology' };
        if (name.includes('scholar')) return { color: '#10b981', tag: 'SMART', bg: 'bg-[#10b981]', text: 'text-[#10b981]', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]', icon: 'menu-book' };
        // Default to roast / hype
        return { color: '#a855f7', tag: 'HYPE', bg: 'bg-[#a855f7]', text: 'text-[#a855f7]', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.2)]', icon: 'local-fire-department' };
    };

    const theme = getTheme();

    return (
        <Animated.View entering={FadeInDown.duration(400).springify()} className="mb-4">
            <View className={`bg-[#2a1d17] border border-white/5 rounded-[24px] p-5 w-full relative overflow-hidden`}>

                {/* Subtle Glow Overlay */}
                <View className={`absolute -top-10 -left-10 w-32 h-32 rounded-full opacity-10 blur-2xl ${theme.bg}`} />

                <View className="flex-row justify-between items-start mb-3 mt-1 relative z-10">
                    <View className="flex-row items-center flex-1 mr-2">
                        {/* Icon Container */}
                        <View className={`w-12 h-12 rounded-[16px] items-center justify-center mr-3 ${theme.bg}`}>
                            <MaterialIcons name={theme.icon as any} size={28} color="white" />
                        </View>

                        {/* Title & Stats */}
                        <View className="flex-1 justify-center max-w-[85%]">
                            <Text className="text-white font-poppins-bold text-lg leading-tight" numberOfLines={1}>
                                {room.name}
                            </Text>
                            <View className="flex-row items-center mt-1">
                                <View className="w-2 h-2 rounded-full bg-green-500 mr-1.5" />
                                <Text className="text-xs text-slate-300 font-poppins-medium">{room.participantsCount} chimps online</Text>
                            </View>
                        </View>
                    </View>

                    {/* Tag */}
                    <View className={`${theme.bg} bg-opacity-10 px-2 py-1 rounded-lg border border-white/10`} style={{ backgroundColor: `${theme.color}15` }}>
                        <Text className={`${theme.text} text-[10px] font-poppins-bold uppercase tracking-widest`}>
                            {theme.tag}
                        </Text>
                    </View>
                </View>

                {/* Description */}
                {room.description && (
                    <Text className="text-sm text-slate-400 mb-5 font-poppins-medium italic opacity-80 leading-relaxed" numberOfLines={2}>
                        "{room.description}"
                    </Text>
                )}

                {/* Action Button */}
                <TouchableOpacity
                    className={`w-full py-3.5 bg-white rounded-[16px] items-center justify-center active:scale-95 transition-all flex-row ${theme.glow}`}
                    onPress={onJoin}
                >
                    <Text className="text-background-dark font-poppins-bold text-base tracking-wide">Swing In</Text>
                </TouchableOpacity>

                {/* Private Lock Overlay Icon if needed */}
                {room.type === 'private' && (
                    <View className="absolute top-4 right-16 opacity-30">
                        <MaterialIcons name="lock" size={14} color="white" />
                    </View>
                )}
            </View>
        </Animated.View>
    );
}
