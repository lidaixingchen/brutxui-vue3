import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
    createThemeVariables,
    createDarkModeToggle,
    DEFAULT_THEME,
    DARK_THEME,
    PASTEL_THEME,
    MONO_THEME,
    WARM_THEME,
    DEFAULT_THEMES,
    type ThemeVariables,
} from './theme-variables'

// Mock env module
vi.mock('./env', () => ({
    hasDocument: true,
    isClient: true,
    safeGetStorageItem: vi.fn((key: string) => {
        if (typeof window !== 'undefined') {
            return window.localStorage.getItem(key)
        }
        return null
    }),
    safeSetStorageItem: vi.fn((key: string, value: string) => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, value)
        }
    }),
    getDocument: () => document,
}))

describe('theme-variables', () => {
    beforeEach(() => {
        // 清理 DOM
        document.documentElement.removeAttribute('style')
        document.documentElement.classList.remove('dark')
        localStorage.clear()
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('DEFAULT_THEMES', () => {
        it('should contain all default themes', () => {
            expect(DEFAULT_THEMES).toHaveProperty('default')
            expect(DEFAULT_THEMES).toHaveProperty('dark')
            expect(DEFAULT_THEMES).toHaveProperty('pastel')
            expect(DEFAULT_THEMES).toHaveProperty('mono')
            expect(DEFAULT_THEMES).toHaveProperty('warm')
        })

        it('should have valid ThemeVariables structure for each theme', () => {
            const requiredColorKeys = [
                'primary', 'primaryForeground', 'secondary', 'secondaryForeground',
                'accent', 'accentForeground', 'destructive', 'destructiveForeground',
                'success', 'successForeground', 'info', 'infoForeground',
                'bg', 'fg', 'muted', 'mutedForeground', 'ring', 'overlay', 'placeholder',
            ]

            const requiredSpacingKeys = ['xs', 'sm', 'md', 'lg', 'xl']
            const requiredBorderKeys = ['width', 'color', 'radius']
            const requiredShadowKeys = ['offsetX', 'offsetY', 'color']

            for (const [name, theme] of Object.entries(DEFAULT_THEMES)) {
                // Check colors
                for (const key of requiredColorKeys) {
                    expect(theme.colors, `Theme "${name}" missing colors.${key}`).toHaveProperty(key)
                }

                // Check spacing
                for (const key of requiredSpacingKeys) {
                    expect(theme.spacing, `Theme "${name}" missing spacing.${key}`).toHaveProperty(key)
                }

                // Check border
                for (const key of requiredBorderKeys) {
                    expect(theme.border, `Theme "${name}" missing border.${key}`).toHaveProperty(key)
                }

                // Check shadow
                for (const key of requiredShadowKeys) {
                    expect(theme.shadow, `Theme "${name}" missing shadow.${key}`).toHaveProperty(key)
                }

                // Check typography
                expect(theme.typography).toHaveProperty('fontFamily')
                expect(theme.typography).toHaveProperty('fontSize')
            }
        })

        it('should export individual themes', () => {
            expect(DEFAULT_THEME).toBe(DEFAULT_THEMES.default)
            expect(DARK_THEME).toBe(DEFAULT_THEMES.dark)
            expect(PASTEL_THEME).toBe(DEFAULT_THEMES.pastel)
            expect(MONO_THEME).toBe(DEFAULT_THEMES.mono)
            expect(WARM_THEME).toBe(DEFAULT_THEMES.warm)
        })
    })

    describe('createThemeVariables', () => {
        it('should create theme API with default options', () => {
            const api = createThemeVariables()

            expect(api.currentTheme.value).toBe('default')
            expect(api.isDark.value).toBe(false)
            expect(api.themeVariables.value).toEqual(DEFAULT_THEME)
            expect(api.availableThemes.value).toContain('default')
        })

        it('should create theme API with custom default theme', () => {
            const api = createThemeVariables({ defaultTheme: 'pastel' })

            expect(api.currentTheme.value).toBe('pastel')
            expect(api.themeVariables.value).toEqual(PASTEL_THEME)
        })

        it('should create theme API with custom themes', () => {
            const customTheme: ThemeVariables = {
                colors: {
                    ...DEFAULT_THEME.colors,
                    primary: '#FF0000',
                },
                spacing: DEFAULT_THEME.spacing,
                border: DEFAULT_THEME.border,
                shadow: DEFAULT_THEME.shadow,
                typography: DEFAULT_THEME.typography,
            }

            const api = createThemeVariables({
                themes: { custom: customTheme },
            })

            expect(api.availableThemes.value).toContain('custom')
            expect(api.getTheme('custom')).toEqual(customTheme)
        })

        it('should set theme correctly', () => {
            const api = createThemeVariables()

            api.setTheme('pastel')

            expect(api.currentTheme.value).toBe('pastel')
            expect(api.themeVariables.value).toEqual(PASTEL_THEME)
        })

        it('should not set invalid theme', () => {
            const api = createThemeVariables()
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

            api.setTheme('invalid-theme')

            expect(api.currentTheme.value).toBe('default')
            expect(consoleSpy).toHaveBeenCalled()

            consoleSpy.mockRestore()
        })

        it('should toggle dark mode', () => {
            const api = createThemeVariables()

            expect(api.isDark.value).toBe(false)

            api.toggleDarkMode()
            expect(api.isDark.value).toBe(true)
            expect(document.documentElement.classList.contains('dark')).toBe(true)

            api.toggleDarkMode()
            expect(api.isDark.value).toBe(false)
            expect(document.documentElement.classList.contains('dark')).toBe(false)
        })

        it('should set dark mode explicitly', () => {
            const api = createThemeVariables()

            api.setDarkMode(true)
            expect(api.isDark.value).toBe(true)
            expect(document.documentElement.classList.contains('dark')).toBe(true)

            api.setDarkMode(false)
            expect(api.isDark.value).toBe(false)
            expect(document.documentElement.classList.contains('dark')).toBe(false)
        })

        it('should register new theme', () => {
            const api = createThemeVariables()
            const newTheme: ThemeVariables = {
                colors: DEFAULT_THEME.colors,
                spacing: DEFAULT_THEME.spacing,
                border: DEFAULT_THEME.border,
                shadow: DEFAULT_THEME.shadow,
                typography: DEFAULT_THEME.typography,
            }

            api.registerTheme('new-theme', newTheme)

            expect(api.availableThemes.value).toContain('new-theme')
            expect(api.getTheme('new-theme')).toEqual(newTheme)
        })

        it('should unregister theme', () => {
            const api = createThemeVariables()

            api.registerTheme('temp-theme', DEFAULT_THEME)
            expect(api.availableThemes.value).toContain('temp-theme')

            api.unregisterTheme('temp-theme')
            expect(api.availableThemes.value).not.toContain('temp-theme')
        })

        it('should not unregister default theme', () => {
            const api = createThemeVariables()
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

            api.unregisterTheme('default')

            expect(api.availableThemes.value).toContain('default')
            expect(consoleSpy).toHaveBeenCalled()

            consoleSpy.mockRestore()
        })

        it('should switch to default theme when current theme is unregistered', () => {
            const api = createThemeVariables()

            api.registerTheme('temp-theme', DEFAULT_THEME)
            api.setTheme('temp-theme')
            expect(api.currentTheme.value).toBe('temp-theme')

            api.unregisterTheme('temp-theme')
            expect(api.currentTheme.value).toBe('default')
        })

        it('should apply theme variables to DOM', () => {
            const api = createThemeVariables({ autoInit: false })

            api.initTheme()

            const root = document.documentElement
            expect(root.style.getPropertyValue('--brutal-primary')).toBe(DEFAULT_THEME.colors.primary)
            expect(root.style.getPropertyValue('--brutal-bg')).toBe(DEFAULT_THEME.colors.bg)
            expect(root.style.getPropertyValue('--brutal-border-width')).toBe(DEFAULT_THEME.border.width)
        })

        it('should apply custom theme variables to DOM', () => {
            const api = createThemeVariables()

            api.setTheme('pastel')

            const root = document.documentElement
            expect(root.style.getPropertyValue('--brutal-primary')).toBe(PASTEL_THEME.colors.primary)
            expect(root.style.getPropertyValue('--brutal-bg')).toBe(PASTEL_THEME.colors.bg)
            expect(root.style.getPropertyValue('--brutal-radius')).toBe(PASTEL_THEME.border.radius)
        })

        it('should persist theme to localStorage', () => {
            const api = createThemeVariables()

            api.setTheme('pastel')

            expect(localStorage.getItem('brutx-theme-variables')).toBe('pastel')
        })

        it('should persist dark mode to localStorage', () => {
            const api = createThemeVariables()

            api.toggleDarkMode()

            expect(localStorage.getItem('brutx-theme-variables-dark')).toBe('true')
        })

        it('should restore theme from localStorage on init', () => {
            localStorage.setItem('brutx-theme-variables', 'pastel')

            const api = createThemeVariables()
            api.initTheme()

            expect(api.currentTheme.value).toBe('pastel')
        })

        it('should restore dark mode from localStorage on init', () => {
            localStorage.setItem('brutx-theme-variables-dark', 'true')

            const api = createThemeVariables()
            api.initTheme()

            expect(api.isDark.value).toBe(true)
            expect(document.documentElement.classList.contains('dark')).toBe(true)
        })

        it('should destroy and clean up DOM', () => {
            const api = createThemeVariables()
            api.initTheme()

            // Verify variables are applied
            const root = document.documentElement
            expect(root.style.getPropertyValue('--brutal-primary')).toBeTruthy()

            api.destroy()

            // Variables should be removed
            expect(root.style.getPropertyValue('--brutal-primary')).toBeFalsy()
        })
    })

    describe('createDarkModeToggle', () => {
        it('should create dark mode toggle', () => {
            const { isDark, toggle } = createDarkModeToggle()

            expect(isDark.value).toBe(false)

            toggle()
            expect(isDark.value).toBe(true)
            expect(document.documentElement.classList.contains('dark')).toBe(true)

            toggle()
            expect(isDark.value).toBe(false)
            expect(document.documentElement.classList.contains('dark')).toBe(false)
        })

        it('should restore dark mode from localStorage on init', () => {
            localStorage.setItem('brutx-theme-variables-dark', 'true')

            const { isDark, init } = createDarkModeToggle()
            init()

            expect(isDark.value).toBe(true)
            expect(document.documentElement.classList.contains('dark')).toBe(true)
        })

        it('should use custom storage key', () => {
            const customKey = 'custom-dark-key'
            const { toggle } = createDarkModeToggle(customKey)

            toggle()

            expect(localStorage.getItem(customKey + '-dark')).toBe('true')
        })
    })
})
