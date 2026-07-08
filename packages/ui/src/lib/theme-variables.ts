/**
 * @module theme-variables
 * @description 主题变量系统 - 支持运行时动态切换主题
 *
 * 提供类型安全的主题变量定义、主题切换 API，支持 SSR 和自定义主题。
 * 与现有的 useTheme composable 配合使用，提供更细粒度的变量控制。
 */

import { ref, reactive, computed, type Ref, type ComputedRef } from 'vue'
import { hasDocument, isClient, safeGetStorageItem, safeSetStorageItem } from './env'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 颜色变量接口
 */
export interface ThemeColors {
    /** 主色调 */
    primary: string
    /** 主色调前景色 */
    primaryForeground: string
    /** 次要色 */
    secondary: string
    /** 次要色前景色 */
    secondaryForeground: string
    /** 强调色 */
    accent: string
    /** 强调色前景色 */
    accentForeground: string
    /** 破坏性操作色 */
    destructive: string
    /** 破坏性操作前景色 */
    destructiveForeground: string
    /** 成功色 */
    success: string
    /** 成功色前景色 */
    successForeground: string
    /** 信息色 */
    info: string
    /** 信息色前景色 */
    infoForeground: string
    /** 背景色 */
    bg: string
    /** 前景色 */
    fg: string
    /** 静音色 */
    muted: string
    /** 静音前景色 */
    mutedForeground: string
    /** 焦点环颜色 */
    ring: string
    /** 遮罩层颜色 */
    overlay: string
    /** 占位符颜色 */
    placeholder: string
}

/**
 * 间距变量接口
 */
export interface ThemeSpacing {
    /** 超小间距 */
    xs: string
    /** 小间距 */
    sm: string
    /** 中等间距 */
    md: string
    /** 大间距 */
    lg: string
    /** 超大间距 */
    xl: string
}

/**
 * 边框变量接口
 */
export interface ThemeBorder {
    /** 边框宽度 */
    width: string
    /** 边框颜色 */
    color: string
    /** 圆角半径 */
    radius: string
}

/**
 * 阴影变量接口
 */
export interface ThemeShadow {
    /** X 轴偏移 */
    offsetX: string
    /** Y 轴偏移 */
    offsetY: string
    /** 阴影颜色 */
    color: string
}

/**
 * 排版变量接口
 */
export interface ThemeTypography {
    /** 字体族 */
    fontFamily: string
    /** 字体大小映射 */
    fontSize: Record<string, string>
}

/**
 * 完整主题变量接口
 */
export interface ThemeVariables {
    /** 颜色变量 */
    colors: ThemeColors
    /** 间距变量 */
    spacing: ThemeSpacing
    /** 边框变量 */
    border: ThemeBorder
    /** 阴影变量 */
    shadow: ThemeShadow
    /** 排版变量 */
    typography: ThemeTypography
}

/**
 * 主题配置选项
 */
export interface ThemeOptions {
    /** 默认主题名称 */
    defaultTheme?: string
    /** 存储键名 */
    storageKey?: string
    /** 主题映射 */
    themes?: Record<string, ThemeVariables>
    /** 是否启用自动初始化 */
    autoInit?: boolean
}

/**
 * 主题切换 API 返回类型
 */
export interface ThemeApi {
    /** 当前主题名称 */
    currentTheme: Ref<string>
    /** 是否为暗色模式 */
    isDark: Ref<boolean>
    /** 当前主题变量（计算属性） */
    themeVariables: ComputedRef<ThemeVariables>
    /** 可用主题列表 */
    availableThemes: ComputedRef<string[]>
    /** 设置主题 */
    setTheme: (theme: string) => void
    /** 切换暗色模式 */
    toggleDarkMode: () => void
    /** 设置暗色模式 */
    setDarkMode: (dark: boolean) => void
    /** 注册新主题 */
    registerTheme: (name: string, variables: ThemeVariables) => void
    /** 注销主题 */
    unregisterTheme: (name: string) => void
    /** 获取主题变量 */
    getTheme: (name: string) => ThemeVariables | undefined
    /** 应用主题变量到 DOM */
    applyThemeVariables: (variables: ThemeVariables) => void
    /** 初始化主题 */
    initTheme: () => void
    /** 销毁主题系统 */
    destroy: () => void
}

// ============================================================================
// 默认主题定义
// ============================================================================

/**
 * 默认主题变量 - 基于 styles.css 中的 :root 变量
 */
const DEFAULT_THEME: ThemeVariables = {
    colors: {
        primary: '#FF6B6B',
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
    spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
    },
    border: {
        width: '3px',
        color: '#000000',
        radius: '0px',
    },
    shadow: {
        offsetX: '4px',
        offsetY: '4px',
        color: '#000000',
    },
    typography: {
        fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
        fontSize: {
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
        },
    },
}

/**
 * 暗色主题变量 - 基于 styles.css 中的 .dark 变量
 */
const DARK_THEME: ThemeVariables = {
    colors: {
        primary: '#FF6B6B',
        primaryForeground: '#000000',
        secondary: '#4ECDC4',
        secondaryForeground: '#000000',
        accent: '#FFE66D',
        accentForeground: '#000000',
        destructive: '#EF476F',
        destructiveForeground: '#FFFFFF',
        success: '#7FB069',
        successForeground: '#000000',
        info: '#3B82F6',
        infoForeground: '#FFFFFF',
        bg: '#141414',
        fg: '#FFFFFF',
        muted: '#1e1e1e',
        mutedForeground: '#9CA3AF',
        ring: '#FFFFFF',
        overlay: 'rgba(0, 0, 0, 0.7)',
        placeholder: '#6B7280',
    },
    spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
    },
    border: {
        width: '3px',
        color: '#FFFFFF',
        radius: '0px',
    },
    shadow: {
        offsetX: '4px',
        offsetY: '4px',
        color: '#FFFFFF',
    },
    typography: {
        fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
        fontSize: {
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
        },
    },
}

/**
 * 柔和主题变量 - 基于 styles.css 中的 .theme-pastel
 */
const PASTEL_THEME: ThemeVariables = {
    colors: {
        primary: '#d6c6e1',
        primaryForeground: '#1e1e24',
        secondary: '#c5ded9',
        secondaryForeground: '#1e1e24',
        accent: '#fbe3b5',
        accentForeground: '#1e1e24',
        destructive: '#f3b0b0',
        destructiveForeground: '#1e1e24',
        success: '#cce2cb',
        successForeground: '#1e1e24',
        info: '#a8c8e8',
        infoForeground: '#1e1e24',
        bg: '#faf9f6',
        fg: '#1e1e24',
        muted: '#eae8e1',
        mutedForeground: '#6b6b78',
        ring: '#1e1e24',
        overlay: 'rgba(0, 0, 0, 0.4)',
        placeholder: '#b0aeb5',
    },
    spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
    },
    border: {
        width: '2px',
        color: '#1e1e24',
        radius: '8px',
    },
    shadow: {
        offsetX: '3px',
        offsetY: '3px',
        color: '#1e1e24',
    },
    typography: {
        fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
        fontSize: {
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
        },
    },
}

/**
 * 单色主题变量 - 基于 styles.css 中的 .theme-mono
 */
const MONO_THEME: ThemeVariables = {
    colors: {
        primary: '#000000',
        primaryForeground: '#FFFFFF',
        secondary: '#FFFFFF',
        secondaryForeground: '#000000',
        accent: '#7a7a7a',
        accentForeground: '#FFFFFF',
        destructive: '#333333',
        destructiveForeground: '#FFFFFF',
        success: '#dddddd',
        successForeground: '#000000',
        info: '#666666',
        infoForeground: '#FFFFFF',
        bg: '#FFFFFF',
        fg: '#000000',
        muted: '#f0f0f0',
        mutedForeground: '#555555',
        ring: '#000000',
        overlay: 'rgba(0, 0, 0, 0.5)',
        placeholder: '#888888',
    },
    spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
    },
    border: {
        width: '4px',
        color: '#000000',
        radius: '0px',
    },
    shadow: {
        offsetX: '5px',
        offsetY: '5px',
        color: '#000000',
    },
    typography: {
        fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
        fontSize: {
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
        },
    },
}

/**
 * 温暖主题变量 - 基于 styles.css 中的 .theme-warm
 */
const WARM_THEME: ThemeVariables = {
    colors: {
        primary: '#E8722A',
        primaryForeground: '#FFFFFF',
        secondary: '#8B6F47',
        secondaryForeground: '#FFFFFF',
        accent: '#F2C078',
        accentForeground: '#2D1810',
        destructive: '#C0392B',
        destructiveForeground: '#FFFFFF',
        success: '#7B8B3A',
        successForeground: '#FFFFFF',
        info: '#D4956A',
        infoForeground: '#FFFFFF',
        bg: '#FFF8F0',
        fg: '#2D1810',
        muted: '#F5EDE3',
        mutedForeground: '#6B5B4F',
        ring: '#E8722A',
        overlay: 'rgba(45, 24, 16, 0.5)',
        placeholder: '#B8A898',
    },
    spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
    },
    border: {
        width: '3px',
        color: '#5C3D2E',
        radius: '4px',
    },
    shadow: {
        offsetX: '4px',
        offsetY: '4px',
        color: '#5C3D2E',
    },
    typography: {
        fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
        fontSize: {
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
        },
    },
}

/**
 * 默认主题映射
 */
const DEFAULT_THEMES: Record<string, ThemeVariables> = {
    default: DEFAULT_THEME,
    dark: DARK_THEME,
    pastel: PASTEL_THEME,
    mono: MONO_THEME,
    warm: WARM_THEME,
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 将主题变量转换为 CSS 变量映射
 */
function themeVariablesToCssVars(variables: ThemeVariables): Record<string, string> {
    return {
        // 颜色变量
        '--brutal-primary': variables.colors.primary,
        '--brutal-primary-foreground': variables.colors.primaryForeground,
        '--brutal-secondary': variables.colors.secondary,
        '--brutal-secondary-foreground': variables.colors.secondaryForeground,
        '--brutal-accent': variables.colors.accent,
        '--brutal-accent-foreground': variables.colors.accentForeground,
        '--brutal-destructive': variables.colors.destructive,
        '--brutal-destructive-foreground': variables.colors.destructiveForeground,
        '--brutal-success': variables.colors.success,
        '--brutal-success-foreground': variables.colors.successForeground,
        '--brutal-info': variables.colors.info,
        '--brutal-info-foreground': variables.colors.infoForeground,
        '--brutal-bg': variables.colors.bg,
        '--brutal-fg': variables.colors.fg,
        '--brutal-muted': variables.colors.muted,
        '--brutal-muted-foreground': variables.colors.mutedForeground,
        '--brutal-ring': variables.colors.ring,
        '--brutal-overlay': variables.colors.overlay,
        '--brutal-placeholder': variables.colors.placeholder,

        // 边框变量
        '--brutal-border-width': variables.border.width,
        '--brutal-border-color': variables.border.color,
        '--brutal-radius': variables.border.radius,

        // 阴影变量
        '--brutal-shadow-offset-x': variables.shadow.offsetX,
        '--brutal-shadow-offset-y': variables.shadow.offsetY,
        '--brutal-shadow-color': variables.shadow.color,
    }
}

/**
 * 应用 CSS 变量到 DOM
 */
function applyCssVarsToDom(vars: Record<string, string>): void {
    if (!hasDocument) return

    const root = document.documentElement
    for (const [key, value] of Object.entries(vars)) {
        root.style.setProperty(key, value)
    }
}

/**
 * 从 DOM 移除 CSS 变量
 */
function removeCssVarsFromDom(vars: Record<string, string>): void {
    if (!hasDocument) return

    const root = document.documentElement
    for (const key of Object.keys(vars)) {
        root.style.removeProperty(key)
    }
}

// ============================================================================
// 主题创建函数
// ============================================================================

/**
 * 创建主题变量系统
 *
 * @param options - 主题配置选项
 * @returns 主题切换 API
 */
export function createThemeVariables(options: ThemeOptions = {}): ThemeApi {
    const {
        defaultTheme = 'default',
        storageKey = 'brutx-theme-variables',
        themes: customThemes = {},
        autoInit = false,
    } = options

    // 合并默认主题和自定义主题 - 使用 reactive 确保响应式更新
    // 深拷贝 DEFAULT_THEMES 防止通过 reactive 修改时污染模块级常量
    const themes = reactive<Record<string, ThemeVariables>>(
        structuredClone({ ...DEFAULT_THEMES, ...customThemes })
    )

    // 响应式状态
    const currentTheme = ref<string>(defaultTheme)
    const isDark = ref(false)
    let initialized = false

    // 计算属性
    const themeVariables = computed<ThemeVariables>(() => {
        const theme = themes[currentTheme.value]
        if (!theme) {
            console.warn(`[BrutxUI] Theme "${currentTheme.value}" not found, falling back to default`)
            return themes[defaultTheme] || DEFAULT_THEME
        }
        return theme
    })

    const availableThemes = computed<string[]>(() => Object.keys(themes))

    // 主题切换
    function setTheme(theme: string) {
        if (!themes[theme]) {
            console.warn(`[BrutxUI] Theme "${theme}" not found`)
            return
        }

        currentTheme.value = theme
        safeSetStorageItem(storageKey, theme)
        applyThemeVariables(themeVariables.value)
    }

    // 暗色模式切换
    function toggleDarkMode() {
        isDark.value = !isDark.value
        safeSetStorageItem(`${storageKey}-dark`, String(isDark.value))

        if (hasDocument) {
            document.documentElement.classList.toggle('dark', isDark.value)
        }
    }

    function setDarkMode(dark: boolean) {
        if (isDark.value === dark) return

        isDark.value = dark
        safeSetStorageItem(`${storageKey}-dark`, String(dark))

        if (hasDocument) {
            document.documentElement.classList.toggle('dark', dark)
        }
    }

    // 主题管理
    function registerTheme(name: string, variables: ThemeVariables) {
        themes[name] = variables
    }

    function unregisterTheme(name: string) {
        // 不允许删除默认主题
        if (name === 'default') {
            console.warn('[BrutxUI] Cannot unregister default theme')
            return
        }

        // 如果当前主题被删除，切换到默认主题
        if (currentTheme.value === name) {
            setTheme('default')
        }

        delete themes[name]
    }

    function getTheme(name: string): ThemeVariables | undefined {
        return themes[name]
    }

    // 应用主题变量
    function applyThemeVariables(variables: ThemeVariables) {
        const cssVars = themeVariablesToCssVars(variables)
        applyCssVarsToDom(cssVars)
    }

    // 初始化
    function initTheme() {
        if (initialized) return
        initialized = true

        // 恢复保存的主题
        const savedTheme = safeGetStorageItem(storageKey)
        if (savedTheme && themes[savedTheme]) {
            currentTheme.value = savedTheme
        }

        // 恢复暗色模式状态
        const savedDark = safeGetStorageItem(`${storageKey}-dark`)
        if (savedDark === 'true') {
            isDark.value = true
            if (hasDocument) {
                document.documentElement.classList.add('dark')
            }
        }

        // 应用主题变量
        applyThemeVariables(themeVariables.value)
    }

    // 销毁
    function destroy() {
        // 清理 DOM 上的自定义变量
        const cssVars = themeVariablesToCssVars(themeVariables.value)
        removeCssVarsFromDom(cssVars)

        // 移除 dark class
        if (hasDocument) {
            document.documentElement.classList.remove('dark')
        }

        initialized = false
    }

    // 自动初始化
    if (autoInit && isClient) {
        initTheme()
    }

    return {
        currentTheme,
        isDark,
        themeVariables,
        availableThemes,
        setTheme,
        toggleDarkMode,
        setDarkMode,
        registerTheme,
        unregisterTheme,
        getTheme,
        applyThemeVariables,
        initTheme,
        destroy,
    }
}

/**
 * 快速创建暗色模式切换器
 */
export function createDarkModeToggle(storageKey = 'brutx-theme-variables') {
    const isDark = ref(false)

    function toggle() {
        isDark.value = !isDark.value
        safeSetStorageItem(`${storageKey}-dark`, String(isDark.value))

        if (hasDocument) {
            document.documentElement.classList.toggle('dark', isDark.value)
        }
    }

    function init() {
        const savedDark = safeGetStorageItem(`${storageKey}-dark`)
        if (savedDark === 'true') {
            isDark.value = true
            if (hasDocument) {
                document.documentElement.classList.add('dark')
            }
        }
    }

    return { isDark, toggle, init }
}

// ============================================================================
// 导出
// ============================================================================

export type { ThemeApi as ThemeVariablesApi }
export { DEFAULT_THEME, DARK_THEME, PASTEL_THEME, MONO_THEME, WARM_THEME, DEFAULT_THEMES }
