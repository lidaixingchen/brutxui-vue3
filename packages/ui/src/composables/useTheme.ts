import { ref, inject, provide, computed, onUnmounted, getCurrentInstance, type InjectionKey } from 'vue'

export type ThemeName = 'classic' | 'pastel' | 'mono' | 'warm'
export type ColorMode = 'light' | 'dark' | 'system'
export type ResolvedColorMode = 'light' | 'dark'

const THEME_KEY: InjectionKey<ReturnType<typeof createTheme>> = Symbol('brutx-theme')

// 常量定义
const VALID_THEMES: readonly ThemeName[] = ['classic', 'pastel', 'mono', 'warm'] as const
const VALID_MODES: readonly ColorMode[] = ['light', 'dark', 'system'] as const

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
    const isSystemDark = ref(false)
    let mediaQuery: MediaQueryList | null = null
    let initialized = false

    // 计算实际应用的颜色模式
    const resolvedColorMode = computed<ResolvedColorMode>(() => {
        if (colorMode.value === 'system') {
            return isSystemDark.value ? 'dark' : 'light'
        }
        return colorMode.value
    })

    function applyTheme(name: ThemeName) {
        if (typeof document === 'undefined') return
        const root = document.documentElement
        // 移除旧主题类名（如果存在）
        if (theme.value !== name) {
            root.classList.remove(getThemeClass(theme.value))
        }
        // 添加新主题类名（检查是否已存在）
        if (!root.classList.contains(getThemeClass(name))) {
            root.classList.add(getThemeClass(name))
        }
        theme.value = name
        safeSetStorageItem('brutx-theme', name)
    }

    function applyResolvedMode(mode: ResolvedColorMode) {
        if (typeof document === 'undefined') return
        const root = document.documentElement
        if (mode === 'dark') {
            root.classList.add('dark')
        } else {
            root.classList.remove('dark')
        }
    }

    function applyColorMode(mode: ColorMode) {
        if (mode === colorMode.value) return
        colorMode.value = mode
        safeSetStorageItem('brutx-color-mode', mode)

        if (mode === 'system') {
            applyResolvedMode(isSystemDark.value ? 'dark' : 'light')
        } else {
            applyResolvedMode(mode)
        }
    }

    function toggleColorMode() {
        // Toggle only between light and dark, skip system
        const newMode: ResolvedColorMode = resolvedColorMode.value === 'light' ? 'dark' : 'light'
        applyColorMode(newMode)
    }

    function setTheme(name: ThemeName) {
        applyTheme(name)
    }

    // 监听系统暗色模式变化
    function onSystemDarkChange(e: MediaQueryListEvent) {
        isSystemDark.value = e.matches
        if (colorMode.value === 'system') {
            applyResolvedMode(e.matches ? 'dark' : 'light')
        }
    }

    function initTheme() {
        // 防止重复初始化
        if (initialized) return
        initialized = true

        const savedThemeRaw = safeGetStorageItem('brutx-theme')
        const savedTheme = (savedThemeRaw && VALID_THEMES.includes(savedThemeRaw as ThemeName)) ? savedThemeRaw as ThemeName : null
        const savedModeRaw = safeGetStorageItem('brutx-color-mode')
        const savedMode = (savedModeRaw && VALID_MODES.includes(savedModeRaw as ColorMode)) ? savedModeRaw as ColorMode : null

        // 应用主题
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

        // 初始化系统暗色模式检测（必须在 applyColorMode 之前）
        if (typeof window !== 'undefined') {
            mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
            isSystemDark.value = mediaQuery.matches
            mediaQuery.addEventListener('change', onSystemDarkChange)
        }

        // 应用颜色模式
        if (savedMode) {
            applyColorMode(savedMode)
        } else if (isSystemDark.value) {
            applyColorMode('system')
        }
    }

    // 清理监听器
    function destroy() {
        mediaQuery?.removeEventListener('change', onSystemDarkChange)
        mediaQuery = null
    }

    return {
        theme,
        colorMode,
        resolvedColorMode,
        isSystemDark,
        setTheme,
        toggleColorMode,
        applyColorMode,
        initTheme,
        destroy,
    }
}

let fallbackInstance: ReturnType<typeof createTheme> | null = null

export function provideTheme() {
    const theme = createTheme()
    provide(THEME_KEY, theme)

    // 自动清理：当提供组件卸载时销毁监听器
    if (getCurrentInstance()) {
        onUnmounted(() => theme.destroy())
    }

    return theme
}

export function useTheme() {
    const theme = inject(THEME_KEY)
    if (theme) return theme
    if (typeof console !== 'undefined') {
        console.warn('[BrutxUI] useTheme() called without provideTheme(). Falling back to shared singleton.')
    }
    if (!fallbackInstance) {
        fallbackInstance = createTheme()
        fallbackInstance.initTheme()
    }
    return fallbackInstance
}
