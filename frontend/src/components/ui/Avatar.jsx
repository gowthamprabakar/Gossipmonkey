import React from 'react';

const Avatar = ({
    src,
    alt,
    size = 'md',
    isOnline = false,
    isAdmin = false,
    className = ''
}) => {
    // Terminal sizes
    const sizeClasses = {
        sm: "w-8 h-8",
        md: "w-12 h-12",
        lg: "w-16 h-16",
        xl: "w-24 h-24"
    };

    return (
        <div className={`relative inline-block ${className}`}>
            <div className={`${sizeClasses[size]} border border-terminal-green bg-black p-0.5`}>
                {src ? (
                    // Green filter for "hacker" look
                    <img
                        src={src}
                        alt={alt}
                        className="w-full h-full object-cover filter grayscale sepia brightness-90 hue-rotate-[80deg] contrast-125"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-terminal-dim text-terminal-green font-mono font-bold">
                        {alt?.charAt(0) || '?'}
                    </div>
                )}
            </div>

            {/* Online Status: Square block */}
            {isOnline && (
                <span className="absolute -bottom-1 -right-1 block w-3 h-3 bg-terminal-green border border-black" />
            )}

            {/* Admin Indicator: ASCII symbol */}
            {isAdmin && (
                <span className="absolute -top-2 -right-2 bg-black text-terminal-alert text-xs border border-terminal-alert px-1 font-mono">
                    ROOT
                </span>
            )}
        </div>
    );
};

export default Avatar;
