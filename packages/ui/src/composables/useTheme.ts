import {
    computed,
    getCurrentInstance,
    inject,
    onMounted,
    onUnmounted,
    provide,
    readonly,
    ref,
    type ComputedRef,
    type InjectionKey,
    type Ref,
} from 'vue'
import {
    hasDocument,
    isClient,
    safeGetStorageItem,
    safeSetStorageItem,
    getDocument,
    matchMedia,
} from '../lib/env'
import { createFallbackManager } from '../lib/fallback-manager'
import { VALID_THEMES, type ThemeName } from '../lib/theme-names'

export { VALID_THEMES } from '../lib/theme-names'
export type { ThemeName } from '../lib/theme-names'

export type ColorMode = 'light' | 'dark' | 'system'
export type ResolvedColorMode = 'light' | 'dark'

export interface ThemeSnapshot {
    theme: ThemeName
    colorMode: ColorMode
    resolvedColorMode: ResolvedColorMode
}

export interface ThemeOptions {
    initialState?: ThemeSnapshot
    initialization?: 'mounted' | 'manual'
    defaultTheme?: ThemeName
    defaultColorMode?: ColorMode
}

export interface UseThemeReturn {
    theme: Ref<ThemeName>
    colorMode: Ref<ColorMode>
    resolvedColorMode: ComputedRef<ResolvedColorMode>
    isSystemDark: Readonly<Ref<boolean>>
    setTheme: (name: ThemeName) => void
    setCustomVariable: (name: `--${string}`, value: string) => void
    removeCustomVariable: (name: `--${string}`) => void
    toggleColorMode: () => void
    applyColorMode: (mode: ColorMode) => void
    initTheme: () => void
    getSnapshot: () => ThemeSnapshot
    destroy: () => void
}

export const THEME_KEY: InjectionKey<UseThemeReturn> = Symbol('brutx-theme')

const VALID_MODES: readonly ColorMode[] = ['light', 'dark', 'system'] as const

function isValidTheme(value: string | null): value is ThemeName {
    return value !== null && (VALID_THEMES as readonly string[]).includes(value)
}

function isValidColorMode(value: string | null): value is ColorMode {
    return value !== null && (VALID_MODES as readonly string[]).includes(value)
}

function getThemeClass(name: ThemeName): string {
    return `theme-${name}`
}

export function createTheme(options?: ThemeOptions): UseThemeReturn {
    const defaultTheme: ThemeName = options?.initialState?.theme ?? options?.defaultTheme ?? 'classic'
    const defaultColorMode: ColorMode = options?.initialState?.colorMode ?? options?.defaultColorMode ?? 'light'
    const defaultIsSystemDark = options?.initialState
        ? options.initialState.resolvedColorMode === 'dark'
        : false

    const theme = ref<ThemeName>(defaultTheme)
    const colorMode = ref<ColorMode>(defaultColorMode)
    const isSystemDark = ref<boolean>(defaultIsSystemDark)
    let mediaQuery: MediaQueryList | null = null
    let initialized = false

    let explicitThemeSet = false
    let explicitColorModeSet = false

    const resolvedColorMode = computed<ResolvedColorMode>(() => {
        if (colorMode.value === 'system') {
            return isSystemDark.value ? 'dark' : 'light'
        }
        return colorMode.value as ResolvedColorMode
    })

    function applyThemeToDom(name: ThemeName) {
        if (!hasDocument || !isClient) return
        const root = getDocument()?.documentElement
        if (!root) return
        for (const themeName of VALID_THEMES) {
            root.classList.remove(getThemeClass(themeName))
        }
        root.classList.add(getThemeClass(name))
    }

    function applyTheme(name: ThemeName) {
        theme.value = name
        explicitThemeSet = true
        if (hasDocument && isClient) {
            applyThemeToDom(name)
            safeSetStorageItem('brutx-theme', name)
        }
    }

    function applyResolvedMode(mode: ResolvedColorMode) {
        if (!hasDocument || !isClient) return
        const root = getDocument()?.documentElement
        if (!root) return
        if (mode === 'dark') {
            root.classList.add('dark')
        } else {
            root.classList.remove('dark')
        }
    }

    function applyColorMode(mode: ColorMode) {
        colorMode.value = mode
        explicitColorModeSet = true
        if (hasDocument && isClient) {
            safeSetStorageItem('brutx-color-mode', mode)
            if (mode === 'system') {
                applyResolvedMode(isSystemDark.value ? 'dark' : 'light')
            } else {
                applyResolvedMode(mode)
            }
        }
    }

    function toggleColorMode() {
        const newMode: ResolvedColorMode = resolvedColorMode.value === 'light' ? 'dark' : 'light'
        applyColorMode(newMode)
    }

    function setTheme(name: ThemeName) {
        applyTheme(name)
    }

    function setCustomVariable(name: `--${string}`, value: string) {
        if (!hasDocument || !isClient) return
        getDocument()?.documentElement.style.setProperty(name, value)
    }

    function removeCustomVariable(name: `--${string}`) {
        if (!hasDocument || !isClient) return
        getDocument()?.documentElement.style.removeProperty(name)
    }

    function onSystemDarkChange(e: MediaQueryListEvent) {
        isSystemDark.value = e.matches
        if (colorMode.value === 'system') {
            applyResolvedMode(e.matches ? 'dark' : 'light')
        }
    }

    function initTheme() {
        if (!isClient || initialized) return
        initialized = true

        if (isClient) {
            const mq = matchMedia('(prefers-color-scheme: dark)')
            if (mq) {
                mediaQuery = mq
                isSystemDark.value = mq.matches
                mq.addEventListener('change', onSystemDarkChange)
            }
        }

        if (!explicitThemeSet) {
            if (options?.initialState?.theme) {
                applyThemeToDom(theme.value)
            } else {
                const savedThemeRaw = safeGetStorageItem('brutx-theme')
                const savedTheme = isValidTheme(savedThemeRaw) ? savedThemeRaw : null
                if (savedTheme) {
                    theme.value = savedTheme
                    applyThemeToDom(savedTheme)
                } else {
                    applyThemeToDom(theme.value)
                }
            }
        } else {
            applyThemeToDom(theme.value)
        }

        if (!explicitColorModeSet) {
            if (options?.initialState?.colorMode) {
                if (colorMode.value === 'system') {
                    applyResolvedMode(isSystemDark.value ? 'dark' : 'light')
                } else {
                    applyResolvedMode(colorMode.value as ResolvedColorMode)
                }
            } else {
                const savedModeRaw = safeGetStorageItem('brutx-color-mode')
                const savedMode = isValidColorMode(savedModeRaw) ? savedModeRaw : null
                if (savedMode) {
                    colorMode.value = savedMode
                    if (savedMode === 'system') {
                        applyResolvedMode(isSystemDark.value ? 'dark' : 'light')
                    } else {
                        applyResolvedMode(savedMode)
                    }
                } else {
                    colorMode.value = 'system'
                    applyResolvedMode(isSystemDark.value ? 'dark' : 'light')
                }
            }
        } else {
            if (colorMode.value === 'system') {
                applyResolvedMode(isSystemDark.value ? 'dark' : 'light')
            } else {
                applyResolvedMode(colorMode.value as ResolvedColorMode)
            }
        }
    }

    function getSnapshot(): ThemeSnapshot {
        return {
            theme: theme.value,
            colorMode: colorMode.value,
            resolvedColorMode: resolvedColorMode.value,
        }
    }

    function destroy() {
        mediaQuery?.removeEventListener('change', onSystemDarkChange)
        mediaQuery = null
        initialized = false
    }

    const returnObj: UseThemeReturn = {
        theme,
        colorMode,
        resolvedColorMode,
        isSystemDark: readonly(isSystemDark),
        setTheme,
        setCustomVariable,
        removeCustomVariable,
        toggleColorMode,
        applyColorMode,
        initTheme,
        getSnapshot,
        destroy,
    }

    Object.defineProperty(returnObj, '__initialization', {
        value: options?.initialization ?? 'mounted',
        enumerable: false,
        writable: false,
    })

    return returnObj
}

const fallbackManager = createFallbackManager<UseThemeReturn>({
    name: 'useTheme',
    isClient,
    createInstance: () => createTheme(),
    destroyInstance: (instance) => instance.destroy(),
})

export function provideTheme(options?: ThemeOptions): UseThemeReturn {
    const theme = createTheme(options)
    provide(THEME_KEY, theme)

    if (isClient && getCurrentInstance() && options?.initialization !== 'manual') {
        onMounted(() => theme.initTheme())
        onUnmounted(() => theme.destroy())
    }

    return theme
}

export function useTheme(): UseThemeReturn {
    const theme = inject(THEME_KEY, null)
    const currentInstance = getCurrentInstance()

    if (!theme && isClient && typeof console !== 'undefined') {
        console.warn('[BrutxUI] useTheme() called without provideTheme(). Falling back to shared singleton. Call provideTheme() in your root component.')
    }

    const resolved = theme ?? fallbackManager.acquire()

    if (isClient && currentInstance && (resolved as unknown as { __initialization?: string }).__initialization !== 'manual') {
        onMounted(() => {
            resolved.initTheme()
        })
    }

    return resolved
}

export function destroyFallback() {
    fallbackManager.destroy()
}
