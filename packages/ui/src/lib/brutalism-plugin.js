const plugin = require('tailwindcss/plugin');

const brutalismPlugin = plugin(
    function ({ addUtilities, addComponents, theme }) {
        const utilities = {
            '.nb-border': {
                borderWidth: '3px',
                borderStyle: 'solid',
                borderColor: '#000000',
            },
            '.nb-border-2': {
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: '#000000',
            },
            '.nb-border-4': {
                borderWidth: '4px',
                borderStyle: 'solid',
                borderColor: '#000000',
            },
            '.nb-shadow': {
                boxShadow: '4px 4px 0px 0px #000000',
            },
            '.nb-shadow-sm': {
                boxShadow: '2px 2px 0px 0px #000000',
            },
            '.nb-shadow-lg': {
                boxShadow: '6px 6px 0px 0px #000000',
            },
            '.nb-shadow-xl': {
                boxShadow: '8px 8px 0px 0px #000000',
            },
            '.nb-press': {
                transform: 'translateY(2px)',
                boxShadow: 'none',
            },
            '.nb-press-sm': {
                transform: 'translateY(1px)',
                boxShadow: 'none',
            },
            '.nb-press-lg': {
                transform: 'translateY(3px)',
                boxShadow: 'none',
            },
            '.nb-font': {
                fontWeight: '900',
                letterSpacing: '0.025em',
            },
            '.nb-font-bold': {
                fontWeight: '800',
                letterSpacing: '0.02em',
            },
            '.nb-font-medium': {
                fontWeight: '700',
                letterSpacing: '0.015em',
            },
            '.nb-no-radius': {
                borderRadius: '0px',
            },
            '.nb-transition': {
                transitionProperty: 'transform, box-shadow',
                transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                transitionDuration: '150ms',
            },
        };

        const interactiveUtilities = {
            '.nb-hover': {
                '&:hover': {
                    transform: 'translate(-2px, -2px)',
                    boxShadow: '6px 6px 0px 0px #000000',
                },
            },
            '.nb-active': {
                '&:active': {
                    transform: 'translateY(2px)',
                    boxShadow: 'none',
                },
            },
            '.nb-focus': {
                '&:focus': {
                    outline: '3px solid #000000',
                    outlineOffset: '2px',
                },
                '&:focus-visible': {
                    outline: '3px solid #000000',
                    outlineOffset: '2px',
                },
            },
            '.nb-disabled': {
                '&:disabled': {
                    opacity: '0.5',
                    cursor: 'not-allowed',
                    pointerEvents: 'none',
                },
            },
        };

        const components = {
            '.nb-btn': {
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: '3px',
                borderStyle: 'solid',
                borderColor: '#000000',
                backgroundColor: '#FFFFFF',
                boxShadow: '4px 4px 0px 0px #000000',
                fontWeight: '900',
                letterSpacing: '0.025em',
                borderRadius: '0px',
                transitionProperty: 'transform, box-shadow',
                transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                transitionDuration: '150ms',
                cursor: 'pointer',
                '&:hover': {
                    transform: 'translate(-2px, -2px)',
                    boxShadow: '6px 6px 0px 0px #000000',
                },
                '&:active': {
                    transform: 'translateY(2px)',
                    boxShadow: 'none',
                },
                '&:disabled': {
                    opacity: '0.5',
                    cursor: 'not-allowed',
                    pointerEvents: 'none',
                },
            },
            '.nb-card': {
                borderWidth: '3px',
                borderStyle: 'solid',
                borderColor: '#000000',
                backgroundColor: '#FFFFFF',
                boxShadow: '4px 4px 0px 0px #000000',
                borderRadius: '0px',
                padding: '1rem',
            },
            '.nb-input': {
                borderWidth: '3px',
                borderStyle: 'solid',
                borderColor: '#000000',
                backgroundColor: '#FFFFFF',
                borderRadius: '0px',
                fontWeight: '500',
                '&:focus': {
                    outline: 'none',
                    boxShadow: '4px 4px 0px 0px #000000',
                },
                '&::placeholder': {
                    color: '#6B7280',
                    fontWeight: '400',
                },
            },
        };

        addUtilities(utilities);
        addUtilities(interactiveUtilities);
        addComponents(components);
    },
    {
        theme: {
            extend: {
                colors: {
                    brutalism: {
                        bg: '#FFFFFF',
                        text: '#000000',
                        primary: '#FF6B6B',
                        secondary: '#4ECDC4',
                        accent: '#FFE66D',
                        success: '#7FB069',
                        warning: '#F9A825',
                        danger: '#EF476F',
                        info: '#4A90D9',
                        muted: '#9CA3AF',
                    },
                },
                boxShadow: {
                    brutal: '4px 4px 0px 0px #000000',
                    'brutal-sm': '2px 2px 0px 0px #000000',
                    'brutal-lg': '6px 6px 0px 0px #000000',
                    'brutal-xl': '8px 8px 0px 0px #000000',
                    'brutal-primary': '4px 4px 0px 0px #FF6B6B',
                    'brutal-secondary': '4px 4px 0px 0px #4ECDC4',
                },
                borderWidth: {
                    3: '3px',
                },
            },
        },
    }
);

module.exports = brutalismPlugin;
