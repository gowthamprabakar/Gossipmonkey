import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Card from './Card';

const Modal = ({ isOpen, onClose, title, children }) => {
    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return undefined;
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <Card className="relative w-full max-w-md animate-pop-in border-white/10 shadow-2xl bg-jungle-900/90">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white tracking-wide">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                    >
                        ✕
                    </button>
                </div>
                <div className="max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </Card>
        </div>,
        document.body
    );
};

export default Modal;
