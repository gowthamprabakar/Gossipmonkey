import React from 'react';
import { View, ViewProps } from 'react-native';

interface GlassCardProps extends ViewProps {
    children: React.ReactNode;
}

export function GlassCard({ children, className, ...props }: GlassCardProps) {
    // Using background color with opacity to simulate frosted glass
    return (
        <View
            className={`bg-CardBackground/80 border border-white/10 rounded-2xl p-4 shadow-lg ${className || ''}`}
            {...props}
        >
            {children}
        </View>
    );
}
