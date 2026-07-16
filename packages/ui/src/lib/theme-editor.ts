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
 * 深度合并对象（只合并存在的属性）
 */
function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
    const result = { ...target }
    for (const key of Object.keys(source) as Array<keyof T>) {
        const sourceVal = source[key]
        const targetVal = target[key]
        if (
            sourceVal !== undefined &&
            typeof sourceVal === 'object' &&
            sourceVal !== null &&
            !Array.isArray(sourceVal) &&
            typeof targetVal === 'object' &&
            targetVal !== null &&
            !Array.isArray(targetVal)
        ) {
            result[key] = deepMerge(
                targetVal as Record<string, unknown>,
                sourceVal as Record<string, unknown>,
            ) as T[keyof T]
        } else if (sourceVal !== undefined) {
            result[key] = sourceVal as T[keyof T]
        }
    }
    return result
}

/**
 * 将主题变量转换为 CSS 变量映射
 */
function themeVariablesToCssVars(
    variables: ThemeVariables,
    prefix: string,
): Record<string, string> {
    const p = prefix
    return {
        // 颜色变量
        [`${p}-primary`]: variables.colors.primary,
        [`${p}-primary-foreground`]: variables.colors.primaryForeground,
        [`${p}-secondary`]: variables.colors.secondary,
        [`${p}-secondary-foreground`]: variables.colors.secondaryForeground,
        [`${p}-accent`]: variables.colors.accent,
        [`${p}-accent-foreground`]: variables.colors.accentForeground,
        [`${p}-destructive`]: variables.colors.destructive,
        [`${p}-destructive-foreground`]: variables.colors.destructiveForeground,
        [`${p}-success`]: variables.colors.success,
        [`${p}-success-foreground`]: variables.colors.successForeground,
        [`${p}-info`]: variables.colors.info,
        [`${p}-info-foreground`]: variables.colors.infoForeground,
        [`${p}-bg`]: variables.colors.bg,
        [`${p}-fg`]: variables.colors.fg,
        [`${p}-muted`]: variables.colors.muted,
        [`${p}-muted-foreground`]: variables.colors.mutedForeground,
        [`${p}-ring`]: variables.colors.ring,
        [`${p}-overlay`]: variables.colors.overlay,
        [`${p}-placeholder`]: variables.colors.placeholder,

        // 边框变量
        [`${p}-border-width`]: variables.border.width,
        [`${p}-border-color`]: variables.border.color,
        [`${p}-radius`]: variables.border.radius,

        // 阴影变量
        [`${p}-shadow-offset-x`]: variables.shadow.offsetX,
        [`${p}-shadow-offset-y`]: variables.shadow.offsetY,
        [`${p}-shadow-color`]: variables.shadow.color,

        // 按压偏移
        [`${p}-pressed-offset`]: '2px',
    }
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
    return true
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
        themes[name] = structuredClone(vars)
    }

    // 存储当前预览时应用的变量名，用于清除
    let previewedVars: Record<string, string> | null = null

    /**
     * 应用主题变量到 DOM（实时预览）
     */
    function applyToDom(variables: ThemeVariables): void {
        if (!hasDocument) return
        const cssVars = themeVariablesToCssVars(variables, '--brutal')
        const root = getDocument()!.documentElement
        for (const [key, value] of Object.entries(cssVars)) {
            root.style.setProperty(key, value)
        }
        previewedVars = cssVars
    }

    /**
     * 从 DOM 移除预览变量
     */
    function removeFromDom(): void {
        if (!hasDocument || !previewedVars) return
        const root = getDocument()!.documentElement
        for (const key of Object.keys(previewedVars)) {
            root.style.removeProperty(key)
        }
        previewedVars = null
    }

    /**
     * 更新主题变量（支持部分更新）
     */
    function updateTheme(name: string, variables: PartialThemeVariables): boolean {
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
            applyToDom(existing)
        }

        onThemeChange?.(name, existing)
        return true
    }

    /**
     * 导出主题为 JSON 字符串
     */
    function exportTheme(name: string): string | null {
        const theme = themes[name]
        if (!theme) return null
        return JSON.stringify(theme, null, 2)
    }

    /**
     * 从 JSON 字符串导入主题
     */
    function importTheme(name: string, json: string): boolean {
        try {
            const parsed: unknown = JSON.parse(json)
            if (!validateTheme(parsed)) return false

            themes[name] = structuredClone(parsed)
            if (autoApply) {
                applyToDom(parsed)
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
            themes[name] = structuredClone(parsed)

            if (autoApply) {
                applyToDom(parsed)
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
        const theme = themes[name]
        if (!theme) return null

        const {
            selector = `[data-theme="${name}"]`,
            prefix = '--brutal',
            minified = false,
        } = cssOptions ?? {}

        const cssVars = themeVariablesToCssVars(theme, prefix)
        const indent = minified ? '' : '  '
        const newline = minified ? '' : '\n'
        const sep = minified ? ';' : ';'

        const lines: string[] = []
        lines.push(`${selector} {${newline}`)

        // 颜色变量
        const colorEntries = Object.entries(cssVars).filter(([k]) =>
            !k.includes('border') && !k.includes('shadow') && !k.includes('radius') && !k.includes('pressed'),
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
        return themes[name]
    }

    /**
     * 复制主题
     */
    function cloneTheme(source: string, target: string): boolean {
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
        // 不允许删除内置主题
        if (name in DEFAULT_THEMES) return false
        if (!themes[name]) return false

        delete themes[name]
        return true
    }

    /**
     * 重置主题为默认值
     */
    function resetTheme(name: string): boolean {
        const defaultTheme = DEFAULT_THEMES[name]
        if (!defaultTheme) return false

        themes[name] = structuredClone(defaultTheme)
        if (autoApply) {
            applyToDom(themes[name])
        }
        onThemeChange?.(name, themes[name])
        return true
    }

    /**
     * 实时预览主题（应用到 DOM）
     */
    function previewTheme(name: string): boolean {
        const theme = themes[name]
        if (!theme) return false

        applyToDom(theme)
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

