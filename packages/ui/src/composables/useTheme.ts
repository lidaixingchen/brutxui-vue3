import { computed, getCurrentInstance, inject, onMounted, onUnmounted, provide, readonly, ref, type ComputedRef, type InjectionKey, type Ref } from 'vue'
import { hasDocument, isClient, safeGetStorageItem, safeSetStorageItem, getDocument, matchMedia, getWindow } from '../lib/env'
import { VALID_THEMES, type ThemeName } from '../lib/theme-names'

// 从 lib 层引入并转发，避免 lib 反向依赖 composables（ThemeName/VALID_THEMES 定义下沉到 lib/theme-names）
export { VALID_THEMES } from '../lib/theme-names'
export type { ThemeName } from '../lib/theme-names'

export type ColorMode = 'light' | 'dark' | 'system'
export type ResolvedColorMode = 'light' | 'dark'

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
    destroy: () => void
}

const THEME_KEY: InjectionKey<UseThemeReturn> = Symbol('brutx-theme')

// 常量定义（VALID_THEMES 从 lib/theme-names 引入并在文件顶部转发）
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

    // 仅应用主题类到 DOM（不持久化）：供 initTheme 在「无用户保存值」时使用，
    // 避免把从未主动选择的默认值写入 localStorage 被后续会话误认为用户偏好
    function applyThemeToDom(name: ThemeName) {
        if (!hasDocument) return
        const root = getDocument()!.documentElement
        // 移除所有旧主题类，避免切换时残留其他 theme-* 类
        for (const themeName of VALID_THEMES) {
            root.classList.remove(getThemeClass(themeName))
        }
        root.classList.add(getThemeClass(name))
    }

    function applyTheme(name: ThemeName) {
        if (!hasDocument) return
        applyThemeToDom(name)
        theme.value = name
        safeSetStorageItem('brutx-theme', name)
    }

    function applyResolvedMode(mode: ResolvedColorMode) {
        if (!hasDocument) return
        const root = getDocument()!.documentElement
        if (mode === 'dark') {
            root.classList.add('dark')
        } else {
            root.classList.remove('dark')
        }
    }

    function applyColorMode(mode: ColorMode) {
        // 始终同步 DOM，避免同值早退导致 dark 类残留
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
        getDocument()!.documentElement.style.setProperty(name, value)
    }

    function removeCustomVariable(name: `--${string}`) {
        if (!hasDocument) return
        getDocument()!.documentElement.style.removeProperty(name)
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
            const mq = matchMedia('(prefers-color-scheme: dark)')
            if (mq) {
                mediaQuery = mq
                isSystemDark.value = mq.matches
                mq.addEventListener('change', onSystemDarkChange)
            }
        }

        // 第二步：应用保存的主题；无保存值时仅应用默认主题的 DOM 效果，不写入 storage
        const savedThemeRaw = safeGetStorageItem('brutx-theme')
        const savedTheme = isValidTheme(savedThemeRaw) ? savedThemeRaw : null
        if (savedTheme) {
            applyTheme(savedTheme)
        } else {
            applyThemeToDom(theme.value)
        }

        // 第三步：应用保存的颜色模式；无保存值且系统为暗色时仅应用 system 模式的 DOM 效果，
        // 不持久化（用户并未主动选择，持久化会让后续会话误认为是用户偏好）
        const savedModeRaw = safeGetStorageItem('brutx-color-mode')
        const savedMode = isValidColorMode(savedModeRaw) ? savedModeRaw : null
        if (savedMode) {
            applyColorMode(savedMode)
        } else if (isSystemDark.value) {
            colorMode.value = 'system'
            applyResolvedMode('dark')
        }
    }

    // 清理监听器
    function destroy() {
        mediaQuery?.removeEventListener('change', onSystemDarkChange)
        mediaQuery = null
        // 重置初始化标志：销毁后再次 initTheme 需重新注册 mediaQuery 监听，
        // 否则系统暗色变化不再生效
        initialized = false
    }

    return {
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
        destroy,
    }
}

let fallbackInstance: UseThemeReturn | null = null
// 引用计数：多组件共享 fallback 单例时，仅在最后一个组件卸载时才销毁单例，
// 避免提前 destroy 导致其他仍使用单例的组件丢失 mediaQuery 监听器
let fallbackRefCount = 0

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
        // 注意与 provideTheme（延迟到 onMounted 再 init）的时序差异：fallback 在 setup 中
        // 立即 init，保证首个消费方在 setup 期间就能读到已初始化的主题状态
        fallbackInstance.initTheme()
    }
    // 组件级清理：引用计数归零时销毁单例，释放 mediaQuery 监听器。
    // 仅当在组件 setup 上下文中调用时才注册清理（与 provideTheme 行为一致）。
    if (getCurrentInstance()) {
        // 捕获本次 setup 使用的实例：若外部（beforeunload/显式调用）先 destroyFallback
        // 导致单例被重建，本组件卸载时不得误减新实例的引用计数或误销毁新单例
        const instance = fallbackInstance
        fallbackRefCount++
        onUnmounted(() => {
            if (fallbackInstance !== instance) return
            fallbackRefCount--
            if (fallbackRefCount <= 0) {
                destroyFallback()
            }
        })
    }
    return fallbackInstance
}

export function destroyFallback() {
    if (fallbackInstance) {
        fallbackInstance.destroy()
        fallbackInstance = null
        fallbackRefCount = 0
    }
}

if (isClient) {
    getWindow()?.addEventListener('beforeunload', destroyFallback)
}
