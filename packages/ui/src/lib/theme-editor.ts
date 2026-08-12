/**
 * @module theme-editor
 * @description 主题编辑器工具 - 支持可视化主题配置
 *
 * 提供主题编辑、导入/导出、CSS 变量生成和实时预览功能。
 * 与 theme-variables 模块配合使用，实现类型安全的主题配置管理。
 */

import { hasDocument, getDocument } from './env'
import {
    DEFAULT_THEMES,
    deepMergeRecords,
    themeVariablesToCssVars,
    type ThemeVariables,
    type ThemeColors,
    type ThemeBorder,
    type ThemeShadow,
    type ThemeSpacing,
    type ThemeTypography,
} from './theme-variables'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 部分主题变量（用于增量更新）
 */
export interface PartialThemeVariables {
    colors?: Partial<ThemeColors>
    border?: Partial<ThemeBorder>
    shadow?: Partial<ThemeShadow>
    spacing?: Partial<ThemeSpacing>
    typography?: Partial<ThemeTypography>
}

/**
 * 主题编辑器选项
 */
export interface ThemeEditorOptions {
    /** 主题映射表（支持外部传入初始主题集合） */
    themes?: Record<string, ThemeVariables>
    /** 主题变更回调（实时预览时触发） */
    onThemeChange?: (theme: string, variables: ThemeVariables) => void
    /** 是否在更新时自动应用到 DOM（实时预览） */
    autoApply?: boolean
}

/**
 * CSS 生成选项
 */
export interface CSSGenerateOptions {
    /** 选择器模板，默认为 `[data-theme="{name}"]` */
    selector?: string
    /** 变量前缀，默认为 `--brutal` */
    prefix?: string
    /** 是否压缩输出 */
    minified?: boolean
}

/**
 * 主题编辑器返回类型
 */
export interface ThemeEditorReturn {
    /** 更新主题变量（支持部分更新） */
    updateTheme: (name: string, variables: PartialThemeVariables) => boolean
    /** 导出主题为 JSON 字符串 */
    exportTheme: (name: string) => string | null
    /** 从 JSON 字符串导入主题 */
    importTheme: (name: string, json: string) => boolean
    /** 从文件导入主题 */
    importThemeFromFile: (file: File) => Promise<{ name: string; variables: ThemeVariables } | null>
    /** 生成主题的 CSS 变量代码 */
    generateCSS: (name: string, options?: CSSGenerateOptions) => string | null
    /** 获取所有主题 */
    getAllThemes: () => Record<string, ThemeVariables>
    /** 获取指定主题 */
    getTheme: (name: string) => ThemeVariables | undefined
    /** 复制主题 */
    cloneTheme: (source: string, target: string) => boolean
    /** 删除主题 */
    removeTheme: (name: string) => boolean
    /** 重置主题为默认值 */
    resetTheme: (name: string) => boolean
    /** 实时预览主题（应用到 DOM） */
    previewTheme: (name: string) => boolean
    /** 清除预览（移除 DOM 上的自定义变量） */
    clearPreview: () => void
    /** 导出所有主题为 JSON 字符串 */
    exportAllThemes: () => string
    /** 从 JSON 字符串导入多个主题 */
    importAllThemes: (json: string) => boolean
    /** 验证主题变量 */
    validateTheme: (variables: unknown) => variables is ThemeVariables
}

// ============================================================================
// 内部工具函数
// ============================================================================

/**
 * 深度合并对象（只合并存在的属性）。
 * 递归核心复用 theme-variables 的 deepMergeRecords（跨模块单一实现，含原型链危险键防护）。
 */
function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
    return deepMergeRecords(
        target as unknown as Record<string, unknown>,
        source as unknown as Record<string, unknown>,
    ) as T
}

/**
 * 无 CSS.escape 环境下对 CSS 双引号字符串字面量做保守转义，
 * 避免主题名（外部可控，如文件导入）拼入选择器时注入引号/反斜杠
 */
function escapeCssStringLiteral(value: string): string {
    return value.replace(/[\\"\n\r]/g, (ch) => {
        switch (ch) {
            case '\\': return '\\\\'
            case '"': return '\\"'
            case '\n': return '\\a '
            case '\r': return '\\d '
            default: return ch
        }
    })
}

/**
 * 判断主题名是否为原型链危险键（__proto__/constructor/prototype）。
 * 主题名可来自外部输入（importTheme 任意 name、importThemeFromFile 文件名、importAllThemes JSON 键），
 * 直接写入 themes[name] 会触发原型 setter 造成原型链污染；
 * 与 theme-variables mergeThemeWithDefaults / themes createCustomTheme 的跳过逻辑保持一致。
 */
function isUnsafeThemeKey(name: string): boolean {
    return name === '__proto__' || name === 'constructor' || name === 'prototype'
}

/**
 * 深度验证主题颜色对象
 */
function isValidThemeColors(colors: unknown): colors is ThemeColors {
    if (typeof colors !== 'object' || colors === null) return false
    const c = colors as Record<string, unknown>
    const requiredKeys: Array<keyof ThemeColors> = [
        'primary', 'primaryForeground', 'secondary', 'secondaryForeground',
        'accent', 'accentForeground', 'destructive', 'destructiveForeground',
        'success', 'successForeground', 'info', 'infoForeground',
        'bg', 'fg', 'muted', 'mutedForeground', 'ring', 'overlay', 'placeholder',
    ]
    return requiredKeys.every((key) => typeof c[key] === 'string')
}

/**
 * 验证主题边框对象
 */
function isValidThemeBorder(border: unknown): border is ThemeBorder {
    if (typeof border !== 'object' || border === null) return false
    const b = border as Record<string, unknown>
    return typeof b.width === 'string' && typeof b.color === 'string' && typeof b.radius === 'string'
}

/**
 * 验证主题阴影对象
 */
function isValidThemeShadow(shadow: unknown): shadow is ThemeShadow {
    if (typeof shadow !== 'object' || shadow === null) return false
    const s = shadow as Record<string, unknown>
    return typeof s.offsetX === 'string' && typeof s.offsetY === 'string' && typeof s.color === 'string'
}

/**
 * 验证主题间距对象
 */
function isValidThemeSpacing(spacing: unknown): spacing is ThemeSpacing {
    if (typeof spacing !== 'object' || spacing === null) return false
    const s = spacing as Record<string, unknown>
    const requiredKeys: Array<keyof ThemeSpacing> = ['xs', 'sm', 'md', 'lg', 'xl']
    return requiredKeys.every((key) => typeof s[key] === 'string')
}

/**
 * 验证主题排版对象
 */
function isValidThemeTypography(typography: unknown): typography is ThemeTypography {
    if (typeof typography !== 'object' || typography === null) return false
    const t = typography as Record<string, unknown>
    if (typeof t.fontFamily !== 'string') return false
    if (typeof t.fontSize !== 'object' || t.fontSize === null) return false
    // fontSize 必须含全部必需尺寸档且值均为 string，避免 generateCSS 输出 `--brutal-font-size-*: undefined`
    const requiredSizeKeys = ['sm', 'base', 'lg', 'xl', '2xl'] as const
    const fontSize = t.fontSize as Record<string, unknown>
    return requiredSizeKeys.every((key) => typeof fontSize[key] === 'string')
}

// ============================================================================
// 主题编辑器实现
// ============================================================================

/**
 * 创建主题编辑器
 *
 * @param options - 主题编辑器配置选项
 * @returns 主题编辑器 API
 *
 * @example
 * ```ts
 * import { createThemeEditor } from '@brutx/ui'
 *
 * const editor = createThemeEditor({
 *   autoApply: true,
 *   onThemeChange: (name, vars) => console.log(`Theme "${name}" updated`, vars),
 * })
 *
 * // 更新主题
 * editor.updateTheme('classic', { colors: { primary: '#FF0000' } })
 *
 * // 导出主题
 * const json = editor.exportTheme('classic')
 *
 * // 导入主题
 * editor.importTheme('my-theme', json!)
 *
 * // 生成 CSS
 * const css = editor.generateCSS('my-theme')
 *
 * // 实时预览
 * editor.previewTheme('my-theme')
 * ```
 */
export function createThemeEditor(options: ThemeEditorOptions = {}): ThemeEditorReturn {
    const {
        themes: initialThemes,
        onThemeChange,
        autoApply = false,
    } = options

    // 主题存储（深拷贝默认主题，避免外部修改影响）
    const themes: Record<string, ThemeVariables> = {}
    for (const [name, vars] of Object.entries(initialThemes ?? DEFAULT_THEMES)) {
        // 构造入口同样校验结构：缺 spacing/typography 等字段的主题会在 applyToDom/generateCSS 崩溃
        if (!validateTheme(vars)) {
            console.warn(`[BrutxUI] createThemeEditor: 主题 "${name}" 结构无效，已回退为默认主题`)
            themes[name] = structuredClone(DEFAULT_THEMES[name] ?? DEFAULT_THEMES.classic)
        } else {
            themes[name] = structuredClone(vars)
        }
    }

    // 记录 autoApply 等持久操作写入 DOM 的变量（clearPreview 不应清除）
    let appliedVars: Record<string, string> | null = null
    // 仅记录 previewTheme 写入的临时预览变量（clearPreview 清除并恢复持久变量）
    let previewedVars: Record<string, string> | null = null

    /**
     * 移除上一轮写入、但本轮新集合不再包含的键，避免主题键集变化时残留旧变量
     */
    function removeStaleKeys(previous: Record<string, string> | null, current: Record<string, string>): void {
        if (!previous || !hasDocument) return
        const root = getDocument()!.documentElement
        for (const key of Object.keys(previous)) {
            if (!(key in current)) {
                root.style.removeProperty(key)
            }
        }
    }

    /**
     * 应用主题变量到 DOM（实时预览）
     * @param isPreview - true 表示 previewTheme 的临时预览；false 表示 autoApply 的持久应用
     */
    function applyToDom(variables: ThemeVariables, isPreview: boolean): void {
        if (!hasDocument) return
        const cssVars = themeVariablesToCssVars(variables, '--brutal')
        // 写入前先清理上一轮集合中本集合不再包含的键
        if (isPreview) {
            removeStaleKeys(previewedVars, cssVars)
        } else {
            removeStaleKeys(previewedVars, cssVars)
            removeStaleKeys(appliedVars, cssVars)
        }
        const root = getDocument()!.documentElement
        for (const [key, value] of Object.entries(cssVars)) {
            root.style.setProperty(key, value)
        }
        if (isPreview) {
            previewedVars = cssVars
        } else {
            // 新的持久应用会覆盖并清空之前的临时预览
            appliedVars = cssVars
            previewedVars = null
        }
    }

    /**
     * 从 DOM 移除预览变量并恢复 autoApply 写入的持久变量
     */
    function removeFromDom(): void {
        if (!hasDocument || !previewedVars) return
        const root = getDocument()!.documentElement
        // 移除预览覆盖的变量
        for (const key of Object.keys(previewedVars)) {
            root.style.removeProperty(key)
        }
        previewedVars = null
        // 预览曾覆盖 autoApply 写入的持久变量，清除预览后需恢复
        if (appliedVars) {
            for (const [key, value] of Object.entries(appliedVars)) {
                root.style.setProperty(key, value)
            }
        }
    }

    /**
     * 更新主题变量（支持部分更新）
     */
    function updateTheme(name: string, variables: PartialThemeVariables): boolean {
        // name 外部可控，写入前拦截原型链危险键（themes['__proto__'] 取到 Object.prototype，对其写属性即污染原型）
        if (isUnsafeThemeKey(name)) return false
        const existing = themes[name]
        if (!existing) return false

        // 深度合并各部分
        if (variables.colors) {
            existing.colors = { ...existing.colors, ...variables.colors }
        }
        if (variables.border) {
            existing.border = { ...existing.border, ...variables.border }
        }
        if (variables.shadow) {
            existing.shadow = { ...existing.shadow, ...variables.shadow }
        }
        if (variables.spacing) {
            existing.spacing = { ...existing.spacing, ...variables.spacing }
        }
        if (variables.typography) {
            existing.typography = deepMerge(
                existing.typography as unknown as Record<string, unknown>,
                variables.typography as unknown as Record<string, unknown>,
            ) as unknown as ThemeTypography
        }

        // 自动应用（实时预览）
        if (autoApply) {
            applyToDom(existing, false)
        }

        onThemeChange?.(name, existing)
        return true
    }

    /**
     * 导出主题为 JSON 字符串
     */
    function exportTheme(name: string): string | null {
        if (isUnsafeThemeKey(name)) return null
        const theme = themes[name]
        if (!theme) return null
        return JSON.stringify(theme, null, 2)
    }

    /**
     * 从 JSON 字符串导入主题
     */
    function importTheme(name: string, json: string): boolean {
        // name 为外部可控参数，直接写入 themes[name] 前须拦截原型链危险键，防止原型链污染
        if (isUnsafeThemeKey(name)) return false
        try {
            const parsed: unknown = JSON.parse(json)
            if (!validateTheme(parsed)) return false

            themes[name] = structuredClone(parsed)
            if (autoApply) {
                applyToDom(parsed, false)
            }
            onThemeChange?.(name, parsed)
            return true
        } catch {
            return false
        }
    }

    /**
     * 从文件导入主题
     */
    async function importThemeFromFile(
        file: File,
    ): Promise<{ name: string; variables: ThemeVariables } | null> {
        try {
            const text = await file.text()
            const parsed: unknown = JSON.parse(text)

            if (!validateTheme(parsed)) return null

            // 使用文件名（去掉扩展名）作为主题名
            const name = file.name.replace(/\.json$/i, '')
            // 文件名同样外部可控，须拦截原型链危险键
            if (isUnsafeThemeKey(name)) return null
            themes[name] = structuredClone(parsed)

            if (autoApply) {
                applyToDom(parsed, false)
            }
            onThemeChange?.(name, parsed)

            return { name, variables: parsed }
        } catch {
            return null
        }
    }

    /**
     * 生成主题的 CSS 变量代码
     */
    function generateCSS(name: string, cssOptions?: CSSGenerateOptions): string | null {
        if (isUnsafeThemeKey(name)) return null
        const theme = themes[name]
        if (!theme) return null

        // 主题名可来自外部输入（如 importThemeFromFile 的文件名），用作选择器值前须转义，防止 CSS 选择器注入
        const safeName = typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
            ? CSS.escape(name)
            : escapeCssStringLiteral(name)
        const {
            selector = `[data-theme="${safeName}"]`,
            prefix = '--brutal',
            minified = false,
        } = cssOptions ?? {}

        const cssVars = themeVariablesToCssVars(theme, prefix)
        const indent = minified ? '' : '  '
        const newline = minified ? '' : '\n'
        const sep = ';'

        const lines: string[] = []
        lines.push(`${selector} {${newline}`)

        // 颜色变量（border/shadow/radius/spacing/font 在各自章节单独输出，避免重复）
        const colorEntries = Object.entries(cssVars).filter(([k]) =>
            !k.includes('border') && !k.includes('shadow') && !k.includes('radius')
            && !k.includes('spacing') && !k.includes('font'),
        )
        for (const [key, value] of colorEntries) {
            lines.push(`${indent}${key}: ${value}${sep}${newline}`)
        }

        // 间距变量
        lines.push(`${newline}${indent}/* Spacing */${newline}`)
        for (const [key, value] of Object.entries(theme.spacing)) {
            lines.push(`${indent}${prefix}-spacing-${key}: ${value}${sep}${newline}`)
        }

        // 边框变量
        lines.push(`${newline}${indent}/* Border */${newline}`)
        lines.push(`${indent}${prefix}-border-width: ${theme.border.width}${sep}${newline}`)
        lines.push(`${indent}${prefix}-border-color: ${theme.border.color}${sep}${newline}`)
        lines.push(`${indent}${prefix}-radius: ${theme.border.radius}${sep}${newline}`)

        // 阴影变量
        lines.push(`${newline}${indent}/* Shadow */${newline}`)
        lines.push(`${indent}${prefix}-shadow-offset-x: ${theme.shadow.offsetX}${sep}${newline}`)
        lines.push(`${indent}${prefix}-shadow-offset-y: ${theme.shadow.offsetY}${sep}${newline}`)
        lines.push(`${indent}${prefix}-shadow-color: ${theme.shadow.color}${sep}${newline}`)

        // 排版变量
        lines.push(`${newline}${indent}/* Typography */${newline}`)
        lines.push(`${indent}${prefix}-font-family: ${theme.typography.fontFamily}${sep}${newline}`)
        for (const [key, value] of Object.entries(theme.typography.fontSize)) {
            lines.push(`${indent}${prefix}-font-size-${key}: ${value}${sep}${newline}`)
        }

        lines.push('}')
        return lines.join('')
    }

    /**
     * 获取所有主题
     */
    function getAllThemes(): Record<string, ThemeVariables> {
        const result: Record<string, ThemeVariables> = {}
        for (const [name, vars] of Object.entries(themes)) {
            result[name] = structuredClone(vars)
        }
        return result
    }

    /**
     * 获取指定主题
     */
    function getTheme(name: string): ThemeVariables | undefined {
        // 返回深拷贝，避免调用方绕过 updateTheme / onThemeChange 直接修改内部状态（与 getAllThemes 一致）
        // 危险键直接返回 undefined：themes['__proto__'] 取到 Object.prototype，structuredClone 会抛 DataCloneError
        if (isUnsafeThemeKey(name)) return undefined
        const theme = themes[name]
        return theme ? structuredClone(theme) : undefined
    }

    /**
     * 复制主题
     */
    function cloneTheme(source: string, target: string): boolean {
        // target 可能来自外部输入，写入前须拦截原型链危险键
        if (isUnsafeThemeKey(target)) return false
        const sourceTheme = themes[source]
        if (!sourceTheme) return false

        themes[target] = structuredClone(sourceTheme)
        onThemeChange?.(target, themes[target])
        return true
    }

    /**
     * 删除主题
     */
    function removeTheme(name: string): boolean {
        // 不允许删除内置主题；危险键直接拒绝（__proto__ 恒在原型链上，in 守卫不足以拦截 delete 语义）
        if (isUnsafeThemeKey(name)) return false
        if (name in DEFAULT_THEMES) return false
        if (!themes[name]) return false

        delete themes[name]
        return true
    }

    /**
     * 重置主题为默认值
     */
    function resetTheme(name: string): boolean {
        // name 外部可控，写入前拦截原型链危险键（themes[name] 赋值 '__proto__' 会触发原型 setter 污染）
        if (isUnsafeThemeKey(name)) return false
        const defaultTheme = DEFAULT_THEMES[name]
        if (!defaultTheme) return false

        themes[name] = structuredClone(defaultTheme)
        if (autoApply) {
            applyToDom(themes[name], false)
        }
        onThemeChange?.(name, themes[name])
        return true
    }

    /**
     * 实时预览主题（应用到 DOM）
     */
    function previewTheme(name: string): boolean {
        // 危险键返回 false：themes['__proto__'] 取到 Object.prototype，非 ThemeVariables 结构，applyToDom 会出错
        if (isUnsafeThemeKey(name)) return false
        const theme = themes[name]
        if (!theme) return false

        applyToDom(theme, true)
        return true
    }

    /**
     * 清除预览（移除 DOM 上的自定义变量）
     */
    function clearPreview(): void {
        removeFromDom()
    }

    /**
     * 导出所有主题为 JSON 字符串
     */
    function exportAllThemes(): string {
        return JSON.stringify(themes, null, 2)
    }

    /**
     * 从 JSON 字符串导入多个主题
     */
    function importAllThemes(json: string): boolean {
        try {
            const parsed: unknown = JSON.parse(json)
            if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return false

            const entries = Object.entries(parsed as Record<string, unknown>)
            for (const [, value] of entries) {
                if (!validateTheme(value)) return false
            }

            for (const [name, value] of entries) {
                // JSON 键外部可控，跳过原型链危险键，防止 themes[name] 赋值污染原型链
                if (isUnsafeThemeKey(name)) continue
                themes[name] = structuredClone(value) as ThemeVariables
            }

            return true
        } catch {
            return false
        }
    }

    /**
     * 验证主题变量
     */
    function validateTheme(variables: unknown): variables is ThemeVariables {
        if (typeof variables !== 'object' || variables === null) return false
        const v = variables as Record<string, unknown>

        return (
            isValidThemeColors(v.colors) &&
            isValidThemeBorder(v.border) &&
            isValidThemeShadow(v.shadow) &&
            isValidThemeSpacing(v.spacing) &&
            isValidThemeTypography(v.typography)
        )
    }

    return {
        updateTheme,
        exportTheme,
        importTheme,
        importThemeFromFile,
        generateCSS,
        getAllThemes,
        getTheme,
        cloneTheme,
        removeTheme,
        resetTheme,
        previewTheme,
        clearPreview,
        exportAllThemes,
        importAllThemes,
        validateTheme,
    }
}

