/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Core Terminal Colors
                'terminal-green': '#39FF14', // Neon Green
                'terminal-black': '#000000', // Pitch Black
                'terminal-dim': '#2A302A',   // Dimmed/Inactive
                'terminal-alert': '#FF3131', // Error/Alert
                'terminal-cyan': '#00FFFF',  // Secondary Accent
                
                // Mapping old tokens to new system to prevent immediate crashes,
                // but these should be phased out in component updates.
                primary: '#39FF14', 
                'background-light': '#000000',
                'background-dark': '#000000',
                'jungle-dark': '#0D0D0D',
                'jungle-card': '#000000',
                banana: {
                    100: '#2A302A',
                    500: '#39FF14',
                },
                jungle: {
                    800: '#000000',
                    900: '#000000',
                    950: '#000000',
                },
            },
            fontFamily: {
                mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'], // Primary
                sans: ['"JetBrains Mono"', '"Fira Code"', 'monospace'], // Override sans defaults
                display: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
            },
            borderRadius: {
                DEFAULT: '0px',
                'none': '0px',
                'sm': '0px',
                'md': '0px',
                'lg': '0px',
                'xl': '0px',
                '2xl': '0px',
                '3xl': '0px',
                'full': '0px', // Even circles become squares in strict mode
            },
            backgroundImage: {
                'scanlines': "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
            },
            keyframes: {
                flicker: {
                    '0%': { opacity: '0.97' },
                    '5%': { opacity: '0.99' },
                    '10%': { opacity: '0.97' },
                    '15%': { opacity: '1' },
                    '95%': { opacity: '1' },
                    '100%': { opacity: '0.98' },
                }
            },
            animation: {
                'crt-flicker': 'flicker 0.15s infinite',
            }
        },
    },
    plugins: [],
}
