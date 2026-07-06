import { ref, inject, provide, computed, onMounted, onUnmounted, getCurrentInstance, type ComputedRef, type InjectionKey, type Ref } from 'vue'
import { hasDocument, isClient, safeGetStorageItem, safeSetStorageItem } from '../lib/env'

export type ThemeName = 'classic' | 'pastel' | 'mono' | 'warm'
export type ColorMode = 'light' | 'dark' | 'system'
export type ResolvedColorMode = 'light' | 'dark'

export interface UseThemeReturn {
    theme: Ref<ThemeName>
    colorMode: Ref<ColorMode>
    resolvedColorMode: ComputedRef<ResolvedColorMode>
    isSystemDark: Ref<boolean>
    setTheme: (name: ThemeName) => void
    setCustomVariable: (name: `--${string}`, value: string) => void
    removeCustomVariable: (name: `--${string}`) => void
    toggleColorMode: () => void
    applyColorMode: (mode: ColorMode) => void
    initTheme: () => void
    destroy: () => void
}

const THEME_KEY: InjectionKey<UseThemeReturn> = Symbol('brutx-theme')

// 常量定义
const VALID_THEMES: readonly ThemeName[] = ['classic', 'pastel', 'mono', 'warm'] as const
const VALID_MODES: readonly ColorMode[] = ['light', 'dark', 'system'] as const

// 类型守卫
function isValidTheme(value: string | null): value is ThemeName {
    return value !== null && (VALID_THEMES as readonly string[]).includes(value)
}

function isValidColorMode(value: string | null): value is ColorMode {
    return value !== null && (VALID_MODES as readonly string[]).includes(value)
}

function getThemeClass(name: ThemeName): string {
    return `theme-${name}`
}

export function createTheme(): UseThemeReturn {
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
        if (!hasDocument) return
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
        if (!hasDocument) return
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

    function setCustomVariable(name: `--${string}`, value: string) {
        if (!hasDocument) return
        document.documentElement.style.setProperty(name, value)
    }

    function removeCustomVariable(name: `--${string}`) {
        if (!hasDocument) return
        document.documentElement.style.removeProperty(name)
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

        // 第一步：初始化系统暗色模式检测（必须在应用颜色模式之前，isSystemDark 需先就绪）
        if (isClient) {
            mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
            isSystemDark.value = mediaQuery.matches
            mediaQuery.addEventListener('change', onSystemDarkChange)
        }

        // 第二步：应用保存的主题（复用 applyTheme，避免重复 DOM 操作与持久化逻辑）
        const savedThemeRaw = safeGetStorageItem('brutx-theme')
        const savedTheme = isValidTheme(savedThemeRaw) ? savedThemeRaw : null
        applyTheme(savedTheme ?? theme.value)

        // 第三步：应用保存的颜色模式（复用 applyColorMode，避免重复逻辑）
        const savedModeRaw = safeGetStorageItem('brutx-color-mode')
        const savedMode = isValidColorMode(savedModeRaw) ? savedModeRaw : null
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
        setCustomVariable,
        removeCustomVariable,
        toggleColorMode,
        applyColorMode,
        initTheme,
        destroy,
    }
}

let fallbackInstance: UseThemeReturn | null = null

export function provideTheme(): UseThemeReturn {
    const theme = createTheme()
    provide(THEME_KEY, theme)

    if (getCurrentInstance()) {
        // 在挂载后初始化主题（确保 DOM 可用），与 useTheme() fallback 行为一致
        onMounted(() => theme.initTheme())
        onUnmounted(() => theme.destroy())
    }

    return theme
}

export function useTheme(): UseThemeReturn {
    const theme = inject(THEME_KEY)
    if (theme) return theme
    if (typeof console !== 'undefined') {
        console.warn('[BrutxUI] useTheme() called without provideTheme(). Falling back to shared singleton. Call provideTheme() in your root component.')
    }
    if (!fallbackInstance) {
        fallbackInstance = createTheme()
        fallbackInstance.initTheme()
    }
    return fallbackInstance
}

export function destroyFallback() {
    if (fallbackInstance) {
        fallbackInstance.destroy()
        fallbackInstance = null
    }
}

if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', destroyFallback)
}
