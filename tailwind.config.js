/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./App.tsx",
        "./index.tsx",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./services/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
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
