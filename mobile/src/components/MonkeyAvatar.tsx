import React from 'react';
import { View, Image, TouchableOpacity, Text } from 'react-native';

interface MonkeyAvatarProps {
    seed: string;
    active?: boolean;
    size?: number;
    onPress?: () => void;
    personalityMode?: 'hype' | 'wise' | 'chaos' | 'detective' | 'silent';
}

export function MonkeyAvatar({ seed, active = false, size = 48, onPress, personalityMode }: MonkeyAvatarProps) {
    const getBorderColor = () => {
        switch (personalityMode) {
            case 'hype': return 'border-MonkeyHype';
            case 'wise': return 'border-MonkeyWise';
            case 'chaos': return 'border-MonkeyChaos';
            case 'detective': return 'border-MonkeyDetective';
            case 'silent': return 'border-MonkeySilent';
            default: return 'border-ElectricPurple';
        }
    };

    const Component = onPress ? TouchableOpacity : View;

    return (
        <Component onPress={onPress} className="items-center justify-center relative">
            <View className={`rounded-full border-2 ${getBorderColor()} overflow-hidden bg-CardBackground`} style={{ width: size, height: size }}>
                <Image
                    source={{ uri: `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}` }}
                    className="w-full h-full"
                    resizeMode="cover"
                />
            </View>
            {active && (
                <View className="absolute bottom-0 right-0 w-3 h-3 bg-BrightGreen rounded-full border border-DeepSpaceBlack" />
            )}
        </Component>
    );
}
