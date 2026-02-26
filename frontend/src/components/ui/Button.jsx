import React from 'react';

const Button = ({
    children,
    onClick,
    variant = 'primary', // primary (solid green), secondary (outline), ghost, danger
    size = 'md', // sm, md, lg, icon
    className = '',
    disabled = false,
    ...props
}) => {

    // Base: Square corners, mono font, no scaling, rigid click effect
    const baseStyles = "inline-flex items-center justify-center font-mono font-bold transition-none active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider";

    const variants = {
        primary: "bg-terminal-green text-black border border-terminal-green hover:bg-transparent hover:text-terminal-green",
        secondary: "bg-transparent text-terminal-green border border-terminal-green hover:bg-terminal-green hover:text-black",
        ghost: "bg-transparent text-terminal-dim hover:text-terminal-green hover:bg-white/5",
        danger: "bg-transparent text-terminal-alert border border-terminal-alert hover:bg-terminal-alert hover:text-black"
    };

    const sizes = {
        sm: "px-3 py-1 text-xs",
        md: "px-5 py-2 text-sm",
        lg: "px-8 py-4 text-base",
        icon: "p-2 aspect-square"
    };

    return (
        <button
            onClick={onClick}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled}
            {...props}
        >
            {/* Decoration for terminal feel */}
            <span className="mr-2 opacity-50">[</span>
            {children}
            <span className="ml-2 opacity-50">]</span>
        </button>
    );
};

export default Button;
