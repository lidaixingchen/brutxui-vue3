/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: ['./src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                // shadcn/ui tokens
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
                // Brutx Design Tokens mapped to tailwind color utilities
                brutal: {
                    bg: 'var(--brutal-bg, #ffffff)',
                    fg: 'var(--brutal-fg, #000000)',
                    border: 'var(--brutal-border-color, #000000)',
                    shadow: 'var(--brutal-shadow-color, #000000)',
                    primary: 'var(--brutal-primary, #FF6B6B)',
                    secondary: 'var(--brutal-secondary, #4ECDC4)',
                    accent: 'var(--brutal-accent, #FFE66D)',
                    destructive: 'var(--brutal-destructive, #EF476F)',
                    success: 'var(--brutal-success, #7FB069)',
                    muted: 'var(--brutal-muted, #f3f4f6)',
                    ring: 'var(--brutal-ring, #000000)',
                },
                // brutalism palette stays for backward compatibility
                brutalism: {
                    bg: '#FFFFFF',
                    text: '#000000',
                    primary: '#FF6B6B',
                    secondary: '#4ECDC4',
                    accent: '#FFE66D',
                    success: '#7FB069',
                    warning: '#F9A825',
                    danger: '#EF476F',
                },
            },
            fontFamily: {
                brutal: ['Inter', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                brutal: 'var(--brutal-radius, 0px)',
            },
            boxShadow: {
                // shadcn-style subtle shadows
                xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                // brutalism shadows fully dynamic now
                brutal: 'var(--brutal-shadow-offset-x, 4px) var(--brutal-shadow-offset-y, 4px) 0px 0px var(--brutal-shadow-color, #000000)',
                'brutal-sm': 'calc(var(--brutal-shadow-offset-x, 4px) / 2) calc(var(--brutal-shadow-offset-y, 4px) / 2) 0px 0px var(--brutal-shadow-color, #000000)',
                'brutal-lg': 'calc(var(--brutal-shadow-offset-x, 4px) * 1.5) calc(var(--brutal-shadow-offset-y, 4px) * 1.5) 0px 0px var(--brutal-shadow-color, #000000)',
                'brutal-xl': 'calc(var(--brutal-shadow-offset-x, 4px) * 2) calc(var(--brutal-shadow-offset-y, 4px) * 2) 0px 0px var(--brutal-shadow-color, #000000)',
            },
            borderWidth: {
                3: '3px',
            },
        },
    },
    plugins: [require('./src/lib/brutalism-plugin')],
};
