/**
 * @module theme-variables
 * @description 主题变量系统 - 支持运行时动态切换主题
 *
 * 提供类型安全的主题变量定义、主题切换 API，支持 SSR 和自定义主题。
 * 与现有的 useTheme composable 配合使用，提供更细粒度的变量控制。
 */

import { ref, reactive, computed, type Ref, type ComputedRef } from 'vue'
import { hasDocument, isClient, safeGetStorageItem, safeSetStorageItem, getDocument, getWindow } from './env'

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
 * 默认（classic）主题变量 - 基于 styles.css 中的 :root 变量。
 * DEFAULT_THEMES 中以 'classic' 为键，与 useTheme 的 VALID_THEMES 命名对齐。
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
        // 黑字对比度 6.28:1 满足 WCAG AA（4.5:1），与 themes/index.ts 预设保持一致
        infoForeground: '#000000',
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
        // 黑字对比度 5.71:1 满足 WCAG AA（4.5:1），与 themes/index.ts 预设保持一致
        infoForeground: '#000000',
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
 * 默认主题映射。
 * 注意：基础主题键为 'classic'（与 useTheme 的 VALID_THEMES 对齐，是唯一命名来源），
 * 暗色 'dark' 是完整深色配色（useTheme 中以 colorMode='dark' 实现，故不在 VALID_THEMES 中）。
 */
const DEFAULT_THEMES: Record<string, ThemeVariables> = {
    classic: DEFAULT_THEME,
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

        // 间距变量
        '--brutal-spacing-xs': variables.spacing.xs,
        '--brutal-spacing-sm': variables.spacing.sm,
        '--brutal-spacing-md': variables.spacing.md,
        '--brutal-spacing-lg': variables.spacing.lg,
        '--brutal-spacing-xl': variables.spacing.xl,

        // 排版变量
        '--brutal-font-family': variables.typography.fontFamily,
        ...Object.fromEntries(
            Object.entries(variables.typography.fontSize).map(
                ([size, value]) => [`--brutal-font-size-${size}`, value] as const,
            ),
        ),
    }
}

/**
 * 应用 CSS 变量到 DOM
 */
function applyCssVarsToDom(vars: Record<string, string>): void {
    if (!hasDocument) return

    const root = getDocument()!.documentElement
    for (const [key, value] of Object.entries(vars)) {
        root.style.setProperty(key, value)
    }
}

/**
 * 从 DOM 移除 CSS 变量
 */
function removeCssVarsFromDom(vars: Record<string, string>): void {
    if (!hasDocument) return

    const root = getDocument()!.documentElement
    for (const key of Object.keys(vars)) {
        root.style.removeProperty(key)
    }
}

/**
 * 判断是否为普通对象（用于递归深合并）。
 * 仅接受原型为 Object.prototype 或 null 的纯对象，排除 Date/Map/Set/RegExp、
 * class 实例以及 Vue 响应式代理/ref，避免被误判展开导致数据丢失或 structuredClone 抛错。
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (typeof value !== 'object' || value === null) return false
    const proto = Object.getPrototypeOf(value)
    return proto === Object.prototype || proto === null
}

/**
 * 将外部主题与基线主题深度合并，补全缺失字段。
 * 防止注册的主题缺字段时把 'undefined' 字符串写入 CSS 变量。
 * @param overrides - 外部传入的主题（可为部分字段）
 * @param base - 合并基线：覆盖已有主题时传该主题现有值，新增主题默认用 DEFAULT_THEME（classic）
 */
function mergeThemeWithDefaults(overrides: ThemeVariables, base: ThemeVariables = DEFAULT_THEME): ThemeVariables {
    const merge = (target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> => {
        const result: Record<string, unknown> = { ...target }
        for (const key of Object.keys(source)) {
            // 跳过原型链危险键（外部主题可能来自 JSON.parse）
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue
            const sourceVal = source[key]
            const targetVal = result[key]
            if (isPlainObject(sourceVal) && isPlainObject(targetVal)) {
                result[key] = merge(targetVal, sourceVal)
            } else if (sourceVal !== undefined) {
                result[key] = sourceVal
            }
        }
        return result
    }
    return merge(
        base as unknown as Record<string, unknown>,
        overrides as unknown as Record<string, unknown>,
    ) as unknown as ThemeVariables
}

/**
 * 校验外部主题变量是否为有效对象（registerTheme 入参保护）。
 */
function isValidThemeObject(value: unknown): value is ThemeVariables {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// ============================================================================
// 暗色模式共享状态
// ============================================================================

/** 暗色模式存储键后缀（与既有 `${storageKey}-dark` 键格式保持一致） */
const DARK_MODE_STORAGE_SUFFIX = '-dark'

/**
 * 按 storageKey 共享的暗色模式 store。
 * createThemeVariables 与 createDarkModeToggle 通过同一 storageKey 共享同一份 isDark 状态，
 * 避免两套工厂各自维护 ref 导致的状态不同步（一边 toggle 后 class/storage 与另一边 ref 脱节）；
 * 同时监听 storage 事件，跨标签页写入同一键时跟随切换。
 */
interface DarkModeStore {
    /** 共享的暗色模式响应式状态 */
    isDark: Ref<boolean>
    /** 设置暗色状态：更新 ref、持久化到 storage、同步 DOM class */
    setDark: (dark: boolean) => void
    /** 释放 storage 监听并从共享表中移除（destroy 时调用） */
    dispose: () => void
}

/** 模块级共享表：同一 storageKey 只维护一份暗色状态 */
const darkModeStores = new Map<string, DarkModeStore>()

function createDarkModeStore(storageKey: string): DarkModeStore {
    const isDark = ref(false)
    const darkStorageKey = `${storageKey}${DARK_MODE_STORAGE_SUFFIX}`

    function applyToDom(dark: boolean): void {
        if (hasDocument) {
            getDocument()!.documentElement.classList.toggle('dark', dark)
        }
    }

    function setDark(dark: boolean): void {
        isDark.value = dark
        safeSetStorageItem(darkStorageKey, String(dark))
        applyToDom(dark)
    }

    // 跨标签页同步：其他标签页写入同一 storage 键时，跟随其状态切换 class 与 ref
    function onStorage(event: StorageEvent): void {
        if (event.key !== darkStorageKey) return
        const dark = event.newValue === 'true'
        isDark.value = dark
        applyToDom(dark)
    }

    const win = getWindow()
    if (win) {
        win.addEventListener('storage', onStorage)
    }

    return {
        isDark,
        setDark,
        dispose: () => {
            const win = getWindow()
            if (win) {
                win.removeEventListener('storage', onStorage)
            }
            darkModeStores.delete(storageKey)
        },
    }
}

/** 获取（必要时创建）指定 storageKey 的共享暗色模式 store */
function getDarkModeStore(storageKey: string): DarkModeStore {
    let store = darkModeStores.get(storageKey)
    if (!store) {
        store = createDarkModeStore(storageKey)
        darkModeStores.set(storageKey, store)
    }
    return store
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
        defaultTheme = 'classic',
        storageKey = 'brutx-theme-variables',
        themes: customThemes = {},
        autoInit = false,
    } = options

    // 合并默认主题和自定义主题 - 使用 reactive 确保响应式更新
    // 深拷贝 DEFAULT_THEMES 防止通过 reactive 修改时污染模块级常量；
    // 自定义主题统一经 mergeThemeWithDefaults 补全缺失字段，避免 'undefined' 写入 CSS 变量
    const mergedCustomThemes: Record<string, ThemeVariables> = {}
    for (const [name, vars] of Object.entries(customThemes)) {
        if (!isValidThemeObject(vars)) {
            console.warn(`[BrutxUI] createThemeVariables: 自定义主题 "${name}" 无效，已跳过`)
            continue
        }
        mergedCustomThemes[name] = mergeThemeWithDefaults(vars, DEFAULT_THEMES[name] ?? DEFAULT_THEME)
    }
    const themes = reactive<Record<string, ThemeVariables>>(
        structuredClone({ ...DEFAULT_THEMES, ...mergedCustomThemes })
    )

    // 响应式状态
    const currentTheme = ref<string>(defaultTheme)
    // 暗色模式状态与 createDarkModeToggle 同 key 共享，统一 ref/storage/class 三方同步
    const { isDark, setDark, dispose: disposeDarkMode } = getDarkModeStore(storageKey)
    let initialized = false
    // 记录上一次应用的主题变量键集，切换主题时先移除旧键，避免残留上一主题写入的变量
    let appliedCssVars: Record<string, string> | null = null

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
        // 内置 dark 主题与暗色模式联动：切到 dark 主题即置 isDark 并加 dark class，
        // 保证内联应用 DARK_THEME 变量的同时 .dark 类下的 CSS 变量也生效
        if (theme === 'dark') {
            setDark(true)
        }
        applyThemeVariables(themeVariables.value)
    }

    // 暗色模式切换（状态/持久化/class 统一走共享 store）
    function toggleDarkMode() {
        setDark(!isDark.value)
    }

    function setDarkMode(dark: boolean) {
        if (isDark.value === dark) return

        setDark(dark)
    }

    // 主题管理
    function registerTheme(name: string, variables: ThemeVariables) {
        // 入参保护：非法/缺失 variables 直接告警返回，避免 mergeThemeWithDefaults 抛 TypeError
        if (!isValidThemeObject(variables)) {
            console.warn(`[BrutxUI] registerTheme("${name}") 需要有效的主题变量对象`)
            return
        }
        // 覆盖已有主题时以其现有值为基线，避免部分字段被 classic 默认值静默替换
        const base = themes[name] ?? DEFAULT_THEME
        try {
            // 深拷贝并合并：避免外部对象后续修改无法被响应式跟踪，同时补全缺失字段
            themes[name] = structuredClone(mergeThemeWithDefaults(variables, base))
        } catch {
            // structuredClone 对函数/Symbol/DOM 节点等不可克隆值抛 DataCloneError，降级为合并后直接赋值
            console.warn(`[BrutxUI] registerTheme("${name}") 主题包含不可克隆值，已降级处理`)
            themes[name] = mergeThemeWithDefaults(variables, base)
        }
    }

    function unregisterTheme(name: string) {
        // 不允许删除默认主题
        if (name === 'classic') {
            console.warn('[BrutxUI] Cannot unregister default theme')
            return
        }

        // 如果当前主题被删除，切换到默认主题
        if (currentTheme.value === name) {
            setTheme('classic')
        }

        delete themes[name]
    }

    function getTheme(name: string): ThemeVariables | undefined {
        return themes[name]
    }

    // 应用主题变量
    function applyThemeVariables(variables: ThemeVariables) {
        const cssVars = themeVariablesToCssVars(variables)
        if (appliedCssVars) {
            removeCssVarsFromDom(appliedCssVars)
        }
        applyCssVarsToDom(cssVars)
        appliedCssVars = cssVars
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

        // 恢复暗色模式状态（经共享 store 同步 ref/storage/class；未保存时保持现状，不覆盖其他实例的切换）
        const savedDark = safeGetStorageItem(`${storageKey}${DARK_MODE_STORAGE_SUFFIX}`)
        if (savedDark === 'true') {
            setDark(true)
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
            getDocument()!.documentElement.classList.remove('dark')
        }

        // 释放共享暗色模式 store（storage 监听 + 共享表条目），同一 storageKey 的下一个实例从初始状态开始
        disposeDarkMode()

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
 * 快速创建暗色模式切换器。
 *
 * 与 createThemeVariables 共享同一 storageKey 下的暗色状态（ref/storage/DOM class 三方同步，
 * 并跟随跨标签页 storage 事件），两者可安全混用；storageKey 不同则状态相互独立。
 */
export function createDarkModeToggle(storageKey = 'brutx-theme-variables') {
    const { isDark, setDark } = getDarkModeStore(storageKey)

    function toggle() {
        setDark(!isDark.value)
    }

    function init() {
        const savedDark = safeGetStorageItem(`${storageKey}${DARK_MODE_STORAGE_SUFFIX}`)
        if (savedDark === 'true') {
            setDark(true)
        }
    }

    return { isDark, toggle, init }
}

// ============================================================================
// 导出
// ============================================================================

export type { ThemeApi as ThemeVariablesApi }
export { DEFAULT_THEME, DARK_THEME, PASTEL_THEME, MONO_THEME, WARM_THEME, DEFAULT_THEMES }
