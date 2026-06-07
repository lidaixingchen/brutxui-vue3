import { ref, inject, provide, type InjectionKey } from 'vue'

export type ThemeName = 'classic' | 'pastel' | 'mono'
export type ColorMode = 'light' | 'dark'

const THEME_KEY: InjectionKey<ReturnType<typeof createTheme>> = Symbol('brutx-theme')

function safeGetStorageItem(key: string): string | null {
    try {
        if (typeof localStorage === 'undefined') return null
        return localStorage.getItem(key)
    } catch {
        return null
    }
}

function safeSetStorageItem(key: string, value: string): void {
    try {
        if (typeof localStorage === 'undefined') return
        localStorage.setItem(key, value)
    } catch {
        // Storage full or blocked (e.g. Safari private mode)
    }
}

function getThemeClass(name: ThemeName): string {
    return `theme-${name}`
}

export function createTheme() {
    const theme = ref<ThemeName>('classic')
    const colorMode = ref<ColorMode>('light')

    function applyTheme(name: ThemeName) {
        if (typeof document === 'undefined') return
        if (name === theme.value) return
        const root = document.documentElement
        root.classList.remove(getThemeClass(theme.value))
        root.classList.add(getThemeClass(name))
        theme.value = name
        safeSetStorageItem('brutx-theme', name)
    }

    function applyColorMode(mode: ColorMode) {
        if (typeof document === 'undefined') return
        if (mode === colorMode.value) return
        const root = document.documentElement
        if (mode === 'dark') {
            root.classList.add('dark')
        } else {
            root.classList.remove('dark')
        }
        colorMode.value = mode
        safeSetStorageItem('brutx-color-mode', mode)
    }

    function toggleColorMode() {
        applyColorMode(colorMode.value === 'dark' ? 'light' : 'dark')
    }

    function setTheme(name: ThemeName) {
        applyTheme(name)
    }

    function initTheme() {
        const VALID_THEMES: ThemeName[] = ['classic', 'pastel', 'mono']
        const VALID_MODES: ColorMode[] = ['light', 'dark']
        const savedThemeRaw = safeGetStorageItem('brutx-theme')
        const savedTheme = (savedThemeRaw && VALID_THEMES.includes(savedThemeRaw as ThemeName)) ? savedThemeRaw as ThemeName : null
        const savedModeRaw = safeGetStorageItem('brutx-color-mode')
        const savedMode = (savedModeRaw && VALID_MODES.includes(savedModeRaw as ColorMode)) ? savedModeRaw as ColorMode : null

        if (savedTheme) {
            const root = document.documentElement
            if (savedTheme !== theme.value) {
                root.classList.remove(getThemeClass(theme.value))
            }
            root.classList.add(getThemeClass(savedTheme))
            theme.value = savedTheme
            safeSetStorageItem('brutx-theme', savedTheme)
        } else {
            if (typeof document !== 'undefined') {
                document.documentElement.classList.add(getThemeClass(theme.value))
            }
            safeSetStorageItem('brutx-theme', theme.value)
        }

        if (savedMode) {
            applyColorMode(savedMode)
        } else if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            applyColorMode('dark')
        }
    }

    return {
        theme,
        colorMode,
        setTheme,
        toggleColorMode,
        applyColorMode,
        initTheme,
    }
}

let fallbackInstance: ReturnType<typeof createTheme> | null = null

export function provideTheme() {
    const theme = createTheme()
    provide(THEME_KEY, theme)
    return theme
}

export function useTheme() {
    const theme = inject(THEME_KEY)
    if (theme) return theme
    if (typeof console !== 'undefined') {
        console.warn('[BrutxUI] useTheme() called without provideTheme(). Falling back to shared singleton. Call provideTheme() in your root component.')
    }
    if (!fallbackInstance) {
        fallbackInstance = createTheme()
    }
    return fallbackInstance
}
