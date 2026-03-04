import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientButtonProps extends TouchableOpacityProps {
    title: string;
    loading?: boolean;
}

export function GradientButton({ title, loading = false, className, ...props }: GradientButtonProps) {
    return (
        <TouchableOpacity activeOpacity={0.8} className={`rounded-xl overflow-hidden ${className || ''}`} {...props}>
            <LinearGradient
                colors={['#7C3AED', '#06B6D4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="py-3 px-6 items-center justify-center min-h-[50px]"
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text className="text-white font-bold text-lg">{title}</Text>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
}
