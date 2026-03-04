/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                primary: '#ec5b13',
                'background-light': '#f8f6f6',
                'background-dark': '#221610',
                'background-darker': '#1a0f0a',
                'accent-purple': '#a855f7',
                'accent-cyan': '#06b6d4',

                // Legacy colors
                DeepSpaceBlack: '#0A0A0F',
                DarkPurpleBlack: '#1A1A24',
                CardBackground: '#252530',
                ElectricPurple: '#7C3AED',
                Cyan: '#06B6D4',
                EmeraldGreen: '#10B981',
                BrightGreen: '#22C55E',
                Amber: '#F59E0B',
                BananaYellow: '#FBBF24',
                TextPrimary: '#FFFFFF',
                TextSecondary: '#B4B4B4',
                TextTertiary: '#6B6B6B',
                MonkeyHype: '#FF006E',
                MonkeyWise: '#7C3AED',
                MonkeyChaos: '#F59E0B',
                MonkeyDetective: '#06B6D4',
                MonkeySilent: '#64748B'
            },
            fontFamily: {
                poppins: ['Poppins-Regular', 'sans-serif'],
                'poppins-medium': ['Poppins-Medium', 'sans-serif'],
                'poppins-semibold': ['Poppins-SemiBold', 'sans-serif'],
                'poppins-bold': ['Poppins-Bold', 'sans-serif'],
                inter: ['Inter-Regular', 'sans-serif'],
                'inter-medium': ['Inter-Medium', 'sans-serif'],
                'inter-semibold': ['Inter-SemiBold', 'sans-serif'],
                quicksand: ['Quicksand-Medium', 'sans-serif'],
                'quicksand-semibold': ['Quicksand-SemiBold', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
