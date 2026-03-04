import React from 'react';
import { View, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';

interface BottomSheetProps {
    visible: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                className="flex-1 bg-black/50 justify-end"
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableWithoutFeedback>
                    <View className="bg-DarkPurpleBlack rounded-t-3xl pt-2 pb-8 px-4 border-t border-white/10 shadow-2xl">
                        {/* Handle/Indicator */}
                        <View className="items-center mb-4">
                            <View className="w-12 h-1.5 bg-white/20 rounded-full" />
                        </View>

                        {/* Content Slot */}
                        {children}
                    </View>
                </TouchableWithoutFeedback>
            </TouchableOpacity>
        </Modal>
    );
}
