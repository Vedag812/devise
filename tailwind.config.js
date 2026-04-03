/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Flame Brand Colors
                flame: {
                    DEFAULT: '#FE7F2D',
                    dark: '#E56F24',
                },
                // Background System
                background: {
                    base: '#212223',
                    card: '#2A2B2C',
                    elevated: '#323334',
                },
                // Text System
                text: {
                    primary: '#FFFFFF',
                    secondary: '#A0A0A0',
                    muted: '#6B6B6B',
                    accent: '#FE7F2D',
                },
                // Status Colors (Backtesting + Validation)
                status: {
                    profit: '#10B981',
                    warning: '#F59E0B',
                    error: '#EF4444',
                    info: '#3B82F6',
                },
                // Legacy shadcn colors (for compatibility)
                border: "rgba(255, 255, 255, 0.08)",
                input: "rgba(255, 255, 255, 0.08)",
                ring: "#FE7F2D",
                foreground: "#FFFFFF",
                primary: {
                    DEFAULT: "#FE7F2D",
                    foreground: "#FFFFFF",
                },
                secondary: {
                    DEFAULT: "#2A2B2C",
                    foreground: "#FFFFFF",
                },
                destructive: {
                    DEFAULT: "#EF4444",
                    foreground: "#FFFFFF",
                },
                muted: {
                    DEFAULT: "#2A2B2C",
                    foreground: "#A0A0A0",
                },
                accent: {
                    DEFAULT: "#FE7F2D",
                    foreground: "#FFFFFF",
                },
                popover: {
                    DEFAULT: "#323334",
                    foreground: "#FFFFFF",
                },
                card: {
                    DEFAULT: "#2A2B2C",
                    foreground: "#FFFFFF",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            animation: {
                "fade-in": "fade-in 0.6s ease-out forwards",
                "fade-up": "fade-up 0.8s ease-out forwards",
            },
            boxShadow: {
                'card': '0 1px 3px rgba(0, 0, 0, 0.3)',
                'elevated': '0 4px 12px rgba(0, 0, 0, 0.4)',
                'floating': '0 8px 24px rgba(0, 0, 0, 0.5)',
            },
        },
    },
    plugins: [],
}
