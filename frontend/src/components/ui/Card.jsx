import React from 'react';

const Card = ({ children, className = '', hoverEffect = false, onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`
                bg-glass-white backdrop-blur-md border border-white/5 rounded-2xl p-4
                ${hoverEffect ? 'hover:bg-white/10 transition-colors cursor-pointer active:scale-[0.98]' : ''}
                ${className}
            `}
        >
            {children}
        </div>
    );
};

export default Card;
