/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./App.tsx",
        "./index.tsx",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./services/**/*.{js,ts,jsx,tsx}",
        "./contexts/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    emerald: '#059669',     // Rich modern emerald green that matches white perfectly
                    'emerald-hover': '#047857',
                    'emerald-light': '#ECFDF5',
                    'emerald-dark': '#064E3B',
                    forest: '#064E3B',      // Deep sophisticated forest contrast
                    canvas: '#F8FAFC',      // Soft clean canvas
                    surface: '#FFFFFF',     // Crisp pure white cards
                }
            },
            borderRadius: {
                '2xl': '1rem',
                '3xl': '1.5rem',
                '4xl': '2rem',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(6px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                arrowHike: {
                    '0%': { opacity: '0', transform: 'translate(-8px, 8px) scale(0.9)' },
                    '50%': { opacity: '1', transform: 'translate(0, 0) scale(1.1)' },
                    '100%': { opacity: '0', transform: 'translate(8px, -8px) scale(0.9)' },
                }
            },
            animation: {
                fadeIn: 'fadeIn 0.3s ease both',
                arrowHike: 'arrowHike 1.5s infinite linear',
            },
        },
    },
    plugins: [],
}
