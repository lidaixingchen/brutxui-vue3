import { ref } from 'vue'

export type ThemeName = 'classic' | 'pastel' | 'mono'
export type ColorMode = 'light' | 'dark'

const theme = ref<ThemeName>('classic')
const colorMode = ref<ColorMode>('light')

function getThemeClass(name: ThemeName): string {
    return `theme-${name}`
}

function applyTheme(name: ThemeName) {
    const root = document.documentElement
    root.classList.remove(getThemeClass(theme.value))
    root.classList.add(getThemeClass(name))
    theme.value = name
    localStorage.setItem('brutx-theme', name)
}

function applyColorMode(mode: ColorMode) {
    const root = document.documentElement
    if (mode === 'dark') {
        root.classList.add('dark')
    } else {
        root.classList.remove('dark')
    }
    colorMode.value = mode
    localStorage.setItem('brutx-color-mode', mode)
}

function toggleColorMode() {
    applyColorMode(colorMode.value === 'dark' ? 'light' : 'dark')
}

function setTheme(name: ThemeName) {
    applyTheme(name)
}

function initTheme() {
    const savedTheme = localStorage.getItem('brutx-theme') as ThemeName | null
    const savedMode = localStorage.getItem('brutx-color-mode') as ColorMode | null

    if (savedTheme && ['classic', 'pastel', 'mono'].includes(savedTheme)) {
        applyTheme(savedTheme)
    }

    if (savedMode && ['light', 'dark'].includes(savedMode)) {
        applyColorMode(savedMode)
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        applyColorMode('dark')
    }
}

export function useTheme() {
    return {
        theme,
        colorMode,
        setTheme,
        toggleColorMode,
        applyColorMode,
        initTheme,
    }
}
