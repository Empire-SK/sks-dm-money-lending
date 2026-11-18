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
                    lime: '#A3E635',       // Vibrant lime green from reference Image 1
                    'lime-light': '#BEF264',
                    'lime-dark': '#65A30D',
                    forest: '#0D2A18',     // Deep forest contrast pill/text
                    'forest-light': '#1A4329',
                    canvas: '#F4F5F7',     // Crisp soft light canvas
                    surface: '#FFFFFF',    // Pure white bento cards
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
