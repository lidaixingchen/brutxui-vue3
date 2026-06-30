import { describe, it, expect } from 'vitest'
import {
    themes,
    defaultTheme,
    darkTheme,
    highContrastTheme,
    minimalTheme,
    getPresetThemeNames,
    getPresetTheme,
    createCustomTheme,
} from './index'
import type { PresetThemeName } from './index'

describe('preset themes', () => {
    describe('themes collection', () => {
        it('should contain all 4 preset themes', () => {
            expect(Object.keys(themes)).toEqual(['default', 'dark', 'high-contrast', 'minimal'])
        })

        it('should have consistent structure for all themes', () => {
            for (const [name, theme] of Object.entries(themes)) {
                expect(theme, `Theme "${name}" should be defined`).toBeDefined()
                expect(theme.colors, `Theme "${name}" should have colors`).toBeDefined()
                expect(theme.spacing, `Theme "${name}" should have spacing`).toBeDefined()
                expect(theme.border, `Theme "${name}" should have border`).toBeDefined()
                expect(theme.shadow, `Theme "${name}" should have shadow`).toBeDefined()
                expect(theme.typography, `Theme "${name}" should have typography`).toBeDefined()
            }
        })
    })

    describe('defaultTheme', () => {
        it('should match the classic Neo-Brutalism style', () => {
            expect(defaultTheme.colors.primary).toBe('#FF6B6B')
            expect(defaultTheme.colors.bg).toBe('#FFFFFF')
            expect(defaultTheme.colors.fg).toBe('#000000')
            expect(defaultTheme.border.width).toBe('3px')
            expect(defaultTheme.border.color).toBe('#000000')
            expect(defaultTheme.border.radius).toBe('0px')
        })

        it('should reference the same object as themes.default', () => {
            expect(defaultTheme).toBe(themes.default)
        })
    })

    describe('darkTheme', () => {
        it('should have dark background', () => {
            expect(darkTheme.colors.bg).toBe('#141414')
            expect(darkTheme.colors.fg).toBe('#FFFFFF')
        })

        it('should use white border and shadow for dark mode', () => {
            expect(darkTheme.border.color).toBe('#FFFFFF')
            expect(darkTheme.shadow.color).toBe('#FFFFFF')
        })

        it('should keep vibrant accent colors', () => {
            expect(darkTheme.colors.primary).toBe('#FF6B6B')
            expect(darkTheme.colors.secondary).toBe('#4ECDC4')
        })

        it('should reference the same object as themes.dark', () => {
            expect(darkTheme).toBe(themes.dark)
        })
    })

    describe('highContrastTheme', () => {
        it('should have high contrast colors', () => {
            expect(highContrastTheme.colors.primary).toBe('#0000CC')
            expect(highContrastTheme.colors.fg).toBe('#000000')
            expect(highContrastTheme.colors.bg).toBe('#FFFFFF')
        })

        it('should use thicker borders', () => {
            expect(highContrastTheme.border.width).toBe('4px')
        })

        it('should use larger shadow offsets', () => {
            expect(highContrastTheme.shadow.offsetX).toBe('6px')
            expect(highContrastTheme.shadow.offsetY).toBe('6px')
        })

        it('should have larger base font size for readability', () => {
            expect(highContrastTheme.typography.fontSize.base).toBe('1.125rem')
            expect(highContrastTheme.typography.fontSize.sm).toBe('1rem')
        })

        it('should reference the same object as themes["high-contrast"]', () => {
            expect(highContrastTheme).toBe(themes['high-contrast'])
        })
    })

    describe('minimalTheme', () => {
        it('should have subtle muted colors', () => {
            expect(minimalTheme.colors.primary).toBe('#333333')
            expect(minimalTheme.colors.bg).toBe('#FAFAFA')
        })

        it('should use thin borders', () => {
            expect(minimalTheme.border.width).toBe('1px')
            expect(minimalTheme.border.color).toBe('#CCCCCC')
        })

        it('should have small radius', () => {
            expect(minimalTheme.border.radius).toBe('4px')
        })

        it('should use system-ui font family', () => {
            expect(minimalTheme.typography.fontFamily).toContain('system-ui')
        })

        it('should use subtle shadow', () => {
            expect(minimalTheme.shadow.offsetX).toBe('2px')
            expect(minimalTheme.shadow.offsetY).toBe('2px')
            expect(minimalTheme.shadow.color).toBe('#CCCCCC')
        })

        it('should reference the same object as themes.minimal', () => {
            expect(minimalTheme).toBe(themes.minimal)
        })
    })
})

describe('getPresetThemeNames', () => {
    it('should return all preset theme names', () => {
        const names = getPresetThemeNames()
        expect(names).toContain('default')
        expect(names).toContain('dark')
        expect(names).toContain('high-contrast')
        expect(names).toContain('minimal')
        expect(names).toHaveLength(4)
    })

    it('should return PresetThemeName type', () => {
        const names = getPresetThemeNames()
        for (const name of names) {
            expect(typeof name).toBe('string')
            expect(themes[name as PresetThemeName]).toBeDefined()
        }
    })
})

describe('getPresetTheme', () => {
    it('should return theme for valid name', () => {
        expect(getPresetTheme('default')).toBe(defaultTheme)
        expect(getPresetTheme('dark')).toBe(darkTheme)
        expect(getPresetTheme('high-contrast')).toBe(highContrastTheme)
        expect(getPresetTheme('minimal')).toBe(minimalTheme)
    })

    it('should return undefined for unknown theme name', () => {
        expect(getPresetTheme('unknown')).toBeUndefined()
        expect(getPresetTheme('')).toBeUndefined()
    })
})

describe('createCustomTheme', () => {
    it('should create a theme based on a preset with overrides', () => {
        const custom = createCustomTheme('default', {
            colors: {
                primary: '#CUSTOM',
                primaryForeground: '#000000',
                secondary: '#4ECDC4',
                secondaryForeground: '#000000',
                accent: '#FFE66D',
                accentForeground: '#000000',
                destructive: '#EF476F',
                destructiveForeground: '#FFFFFF',
                success: '#7FB069',
                successForeground: '#000000',
                info: '#4A90D9',
                infoForeground: '#FFFFFF',
                bg: '#FFFFFF',
                fg: '#000000',
                muted: '#f3f4f6',
                mutedForeground: '#4B5563',
                ring: '#000000',
                overlay: 'rgba(0, 0, 0, 0.5)',
                placeholder: '#9CA3AF',
            },
        })

        expect(custom.colors.primary).toBe('#CUSTOM')
        // Other values should be inherited from default
        expect(custom.border.width).toBe(defaultTheme.border.width)
        expect(custom.shadow.color).toBe(defaultTheme.shadow.color)
    })

    it('should not mutate the base theme', () => {
        const originalPrimary = defaultTheme.colors.primary
        createCustomTheme('default', {
            colors: {
                ...defaultTheme.colors,
                primary: '#MUTATED',
            },
        })

        expect(defaultTheme.colors.primary).toBe(originalPrimary)
    })

    it('should deep merge nested objects', () => {
        const custom = createCustomTheme('minimal', {
            border: {
                width: '2px',
                color: '#000000',
                radius: '8px',
            },
        })

        // Border should be fully overridden
        expect(custom.border.width).toBe('2px')
        expect(custom.border.color).toBe('#000000')
        expect(custom.border.radius).toBe('8px')

        // Other properties should be from minimal
        expect(custom.colors.primary).toBe(minimalTheme.colors.primary)
        expect(custom.shadow.offsetX).toBe(minimalTheme.shadow.offsetX)
    })

    it('should work with all preset themes as base', () => {
        const presetNames: PresetThemeName[] = ['default', 'dark', 'high-contrast', 'minimal']

        for (const name of presetNames) {
            const custom = createCustomTheme(name, {
                spacing: {
                    xs: '0.5rem',
                    sm: '1rem',
                    md: '2rem',
                    lg: '3rem',
                    xl: '4rem',
                },
            })

            expect(custom.spacing.xs).toBe('0.5rem')
            expect(custom.colors).toEqual(themes[name].colors)
        }
    })
})

describe('type safety', () => {
    it('should have all required color properties', () => {
        const requiredColors = [
            'primary', 'primaryForeground',
            'secondary', 'secondaryForeground',
            'accent', 'accentForeground',
            'destructive', 'destructiveForeground',
            'success', 'successForeground',
            'info', 'infoForeground',
            'bg', 'fg',
            'muted', 'mutedForeground',
            'ring', 'overlay', 'placeholder',
        ]

        for (const [name, theme] of Object.entries(themes)) {
            for (const colorKey of requiredColors) {
                expect(
                    theme.colors,
                    `Theme "${name}" should have colors.${colorKey}`
                ).toHaveProperty(colorKey)
            }
        }
    })

    it('should have all required border properties', () => {
        const requiredBorder = ['width', 'color', 'radius']

        for (const [name, theme] of Object.entries(themes)) {
            for (const borderKey of requiredBorder) {
                expect(
                    theme.border,
                    `Theme "${name}" should have border.${borderKey}`
                ).toHaveProperty(borderKey)
            }
        }
    })

    it('should have all required shadow properties', () => {
        const requiredShadow = ['offsetX', 'offsetY', 'color']

        for (const [name, theme] of Object.entries(themes)) {
            for (const shadowKey of requiredShadow) {
                expect(
                    theme.shadow,
                    `Theme "${name}" should have shadow.${shadowKey}`
                ).toHaveProperty(shadowKey)
            }
        }
    })

    it('should have all required spacing properties', () => {
        const requiredSpacing = ['xs', 'sm', 'md', 'lg', 'xl']

        for (const [name, theme] of Object.entries(themes)) {
            for (const spacingKey of requiredSpacing) {
                expect(
                    theme.spacing,
                    `Theme "${name}" should have spacing.${spacingKey}`
                ).toHaveProperty(spacingKey)
            }
        }
    })

    it('should have typography with fontFamily and fontSize', () => {
        for (const [name, theme] of Object.entries(themes)) {
            expect(
                theme.typography.fontFamily,
                `Theme "${name}" should have fontFamily`
            ).toBeTruthy()
            expect(
                theme.typography.fontSize,
                `Theme "${name}" should have fontSize`
            ).toBeDefined()
            expect(
                theme.typography.fontSize.base,
                `Theme "${name}" should have fontSize.base`
            ).toBeTruthy()
        }
    })
})
