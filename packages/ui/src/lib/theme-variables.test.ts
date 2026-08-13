import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
    createThemeVariables as createThemeVariablesRaw,
    createDarkModeToggle as createDarkModeToggleRaw,
    DEFAULT_THEME,
    DARK_THEME,
    PASTEL_THEME,
    MONO_THEME,
    WARM_THEME,
    DEFAULT_THEMES,
    themeVariablesToCssVars,
    type ThemeVariables,
} from './theme-variables'
import { VALID_THEMES } from './theme-names'
// 经子路径 import design-tokens：避免走 brutx-shared-vue 主入口拉入 registry.ts
// （registry.ts 依赖 node:crypto，ui 的 vue-tsc 类型检查无 node 类型会报错）
import { BASE_THEME, CSS_VARS, type ThemeTokens } from 'brutx-shared-vue/design-tokens'

// ============================================================================
// 与 shared 单一事实来源（packages/shared/src/design-tokens.ts）交叉校验的辅助函数。
// ui 运行时受 registry:lib 自包含约束不可 import shared，仅测试环境可——故以断言测试兜底：
// 改 shared 只重生成 styles.css，theme-variables 预设/--brutal-* 命名会静默陈旧，此测试应变红。
// ============================================================================

/** 与 shared BASE_THEME 语义令牌重叠的字段名（不含 status 系、black、yellow 等 ThemeVariables 无对应项） */
const OVERLAP_TOKEN_KEYS = [
    'borderWidth', 'borderColor', 'shadowOffsetX', 'shadowOffsetY', 'shadowColor',
    'radius', 'bg', 'fg', 'primary', 'primaryForeground', 'secondary',
    'secondaryForeground', 'accent', 'accentForeground', 'destructive',
    'destructiveForeground', 'success', 'successForeground', 'muted',
    'mutedForeground', 'ring', 'info', 'infoForeground', 'overlay', 'placeholder',
] as const

/** 将 ThemeVariables 的嵌套结构展平为与 shared 令牌同名的平铺子集（theme.colors 键名与令牌名一致） */
function flattenThemeToTokens(theme: ThemeVariables): Record<string, string> {
    const flat: Record<string, string> = {
        ...theme.colors,
        borderWidth: theme.border.width,
        borderColor: theme.border.color,
        radius: theme.border.radius,
        shadowOffsetX: theme.shadow.offsetX,
        shadowOffsetY: theme.shadow.offsetY,
        shadowColor: theme.shadow.color,
    }
    const result: Record<string, string> = {}
    for (const key of OVERLAP_TOKEN_KEYS) {
        result[key] = flat[key]
    }
    return result
}

/** 从 shared BASE_THEME 的令牌中挑选与 ThemeVariables 重叠的子集 */
function pickTokenSubset(tokens: ThemeTokens): Record<string, string> {
    const result: Record<string, string> = {}
    for (const key of OVERLAP_TOKEN_KEYS) {
        result[key] = tokens[key]
    }
    return result
}

/** CSS 颜色值大小写归一化：十六进制色值大小写不敏感（预设用大写、shared 用小写），比较时统一排除大小写差异 */
function normalizeCssValue(value: string): string {
    return value.toLowerCase()
}

function normalizeTokenSubset(subset: Record<string, string>): Record<string, string> {
    const result: Record<string, string> = {}
    for (const [key, value] of Object.entries(subset)) {
        result[key] = normalizeCssValue(value)
    }
    return result
}

/** camelCase 令牌名 → kebab-case CSS 变量后缀（如 primaryForeground → primary-foreground） */
function kebabCase(name: string): string {
    return name.replace(/([A-Z])/g, (ch) => `-${ch.toLowerCase()}`)
}

// Mock env module
vi.mock('./env', () => ({
    hasDocument: true,
    isClient: true,
    safeGetStorageItem: vi.fn((key: string) => {
        if (typeof window !== 'undefined') {
            return window.localStorage.getItem(key)
        }
        return null
    }),
    safeSetStorageItem: vi.fn((key: string, value: string) => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, value)
        }
    }),
    getDocument: () => document,
    getWindow: () => window,
}))

// 共享暗色 store 按 storageKey 引用计数：每个测试创建的实例须在 afterEach 统一 release，
// 保证引用归零、store 被真正释放，跨测试无状态泄漏（同一 key 的新实例从初始状态开始）
const createdInstances: Array<{ dispose: () => void }> = []

function makeThemeApi(options?: Parameters<typeof createThemeVariablesRaw>[0]): ReturnType<typeof createThemeVariablesRaw> {
    const api = createThemeVariablesRaw(options)
    // ThemeApi 的释放入口是 destroy，统一包装为 dispose 便于 afterEach 批量回收
    createdInstances.push({ dispose: () => api.destroy() })
    return api
}

function makeDarkToggle(storageKey?: string): ReturnType<typeof createDarkModeToggleRaw> {
    const toggle = createDarkModeToggleRaw(storageKey)
    createdInstances.push(toggle)
    return toggle
}

describe('theme-variables', () => {
    beforeEach(() => {
        createdInstances.length = 0
        // 清理 DOM
        document.documentElement.removeAttribute('style')
        document.documentElement.classList.remove('dark')
        localStorage.clear()
    })

    afterEach(() => {
        // 释放本测试创建的所有实例（含已在测试内 destroy 的，release 有防重复守卫）
        createdInstances.forEach((instance) => instance.dispose())
        vi.clearAllMocks()
    })

    describe('DEFAULT_THEMES', () => {
        it('should contain all default themes', () => {
            expect(DEFAULT_THEMES).toHaveProperty('classic')
            expect(DEFAULT_THEMES).toHaveProperty('dark')
            expect(DEFAULT_THEMES).toHaveProperty('pastel')
            expect(DEFAULT_THEMES).toHaveProperty('mono')
            expect(DEFAULT_THEMES).toHaveProperty('warm')
        })

        it('theme-class names (VALID_THEMES) stay a subset of DEFAULT_THEMES keys', () => {
            // 漂移守卫：#30 统一命名后，useTheme 的 theme-class 主题名必须都存在于 CSS 变量主题集合，
            // 防止两套主题命名再度漂移
            for (const name of VALID_THEMES) {
                expect(DEFAULT_THEMES, `theme-class "${name}" must exist in DEFAULT_THEMES`).toHaveProperty(name)
            }
        })

        it('should have valid ThemeVariables structure for each theme', () => {
            const requiredColorKeys = [
                'primary', 'primaryForeground', 'secondary', 'secondaryForeground',
                'accent', 'accentForeground', 'destructive', 'destructiveForeground',
                'success', 'successForeground', 'info', 'infoForeground',
                'bg', 'fg', 'muted', 'mutedForeground', 'ring', 'overlay', 'placeholder',
            ]

            const requiredSpacingKeys = ['xs', 'sm', 'md', 'lg', 'xl']
            const requiredBorderKeys = ['width', 'color', 'radius']
            const requiredShadowKeys = ['offsetX', 'offsetY', 'color']

            for (const [name, theme] of Object.entries(DEFAULT_THEMES)) {
                // Check colors
                for (const key of requiredColorKeys) {
                    expect(theme.colors, `Theme "${name}" missing colors.${key}`).toHaveProperty(key)
                }

                // Check spacing
                for (const key of requiredSpacingKeys) {
                    expect(theme.spacing, `Theme "${name}" missing spacing.${key}`).toHaveProperty(key)
                }

                // Check border
                for (const key of requiredBorderKeys) {
                    expect(theme.border, `Theme "${name}" missing border.${key}`).toHaveProperty(key)
                }

                // Check shadow
                for (const key of requiredShadowKeys) {
                    expect(theme.shadow, `Theme "${name}" missing shadow.${key}`).toHaveProperty(key)
                }

                // Check typography
                expect(theme.typography).toHaveProperty('fontFamily')
                expect(theme.typography).toHaveProperty('fontSize')
            }
        })

        it('should export individual themes', () => {
            expect(DEFAULT_THEME).toBe(DEFAULT_THEMES.classic)
            expect(DARK_THEME).toBe(DEFAULT_THEMES.dark)
            expect(PASTEL_THEME).toBe(DEFAULT_THEMES.pastel)
            expect(MONO_THEME).toBe(DEFAULT_THEMES.mono)
            expect(WARM_THEME).toBe(DEFAULT_THEMES.warm)
        })
    })

    describe('预设主题 ↔ shared BASE_THEME 交叉校验（§10.3 P1）', () => {
        // pastel/mono/warm 无 shared 对应令牌（BASE_THEME 仅 light/dark），交叉校验仅覆盖 classic/dark
        it('classic（DEFAULT_THEME）与 BASE_THEME.light 语义令牌一致', () => {
            expect(normalizeTokenSubset(flattenThemeToTokens(DEFAULT_THEME)))
                .toEqual(normalizeTokenSubset(pickTokenSubset(BASE_THEME.light)))
        })

        it('dark（DARK_THEME）与 BASE_THEME.dark 语义令牌一致', () => {
            expect(normalizeTokenSubset(flattenThemeToTokens(DARK_THEME)))
                .toEqual(normalizeTokenSubset(pickTokenSubset(BASE_THEME.dark)))
        })

        it('themeVariablesToCssVars 的 --brutal-* 命名与 shared CSS_VARS 对齐（light/dark）', () => {
            for (const [name, theme, sharedVars] of [
                ['classic', DEFAULT_THEME, CSS_VARS.light],
                ['dark', DARK_THEME, CSS_VARS.dark],
            ] as const) {
                const cssVars = themeVariablesToCssVars(theme)
                for (const key of OVERLAP_TOKEN_KEYS) {
                    const cssKey = `--brutal-${kebabCase(key)}`
                    const sharedCssKey = `brutal-${kebabCase(key)}`
                    expect(cssVars[cssKey], `主题 ${name} 应产出 CSS 变量 ${cssKey}`).toBeDefined()
                    expect(
                        normalizeCssValue(cssVars[cssKey]!),
                        `主题 ${name} 的 ${cssKey} 应与 shared ${sharedCssKey} 值一致`,
                    ).toBe(normalizeCssValue(sharedVars[sharedCssKey]))
                }
            }
        })
    })

    describe('createThemeVariables', () => {
        it('should create theme API with default options', () => {
            const api = makeThemeApi()

            expect(api.currentTheme.value).toBe('classic')
            expect(api.isDark.value).toBe(false)
            expect(api.themeVariables.value).toEqual(DEFAULT_THEME)
            expect(api.availableThemes.value).toContain('classic')
        })

        it('should create theme API with custom default theme', () => {
            const api = makeThemeApi({ defaultTheme: 'pastel' })

            expect(api.currentTheme.value).toBe('pastel')
            expect(api.themeVariables.value).toEqual(PASTEL_THEME)
        })

        it('should create theme API with custom themes', () => {
            const customTheme: ThemeVariables = {
                colors: {
                    ...DEFAULT_THEME.colors,
                    primary: '#FF0000',
                },
                spacing: DEFAULT_THEME.spacing,
                border: DEFAULT_THEME.border,
                shadow: DEFAULT_THEME.shadow,
                typography: DEFAULT_THEME.typography,
            }

            const api = makeThemeApi({
                themes: { custom: customTheme },
            })

            expect(api.availableThemes.value).toContain('custom')
            expect(api.getTheme('custom')).toEqual(customTheme)
        })

        it('should set theme correctly', () => {
            const api = makeThemeApi()

            api.setTheme('pastel')

            expect(api.currentTheme.value).toBe('pastel')
            expect(api.themeVariables.value).toEqual(PASTEL_THEME)
        })

        it('should not set invalid theme', () => {
            const api = makeThemeApi()
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

            api.setTheme('invalid-theme')

            expect(api.currentTheme.value).toBe('classic')
            expect(consoleSpy).toHaveBeenCalled()

            consoleSpy.mockRestore()
        })

        it('should toggle dark mode', () => {
            const api = makeThemeApi()

            expect(api.isDark.value).toBe(false)

            api.toggleDarkMode()
            expect(api.isDark.value).toBe(true)
            expect(document.documentElement.classList.contains('dark')).toBe(true)

            api.toggleDarkMode()
            expect(api.isDark.value).toBe(false)
            expect(document.documentElement.classList.contains('dark')).toBe(false)
        })

        it('should set dark mode explicitly', () => {
            const api = makeThemeApi()

            api.setDarkMode(true)
            expect(api.isDark.value).toBe(true)
            expect(document.documentElement.classList.contains('dark')).toBe(true)

            api.setDarkMode(false)
            expect(api.isDark.value).toBe(false)
            expect(document.documentElement.classList.contains('dark')).toBe(false)
        })

        it('should register new theme', () => {
            const api = makeThemeApi()
            const newTheme: ThemeVariables = {
                colors: DEFAULT_THEME.colors,
                spacing: DEFAULT_THEME.spacing,
                border: DEFAULT_THEME.border,
                shadow: DEFAULT_THEME.shadow,
                typography: DEFAULT_THEME.typography,
            }

            api.registerTheme('new-theme', newTheme)

            expect(api.availableThemes.value).toContain('new-theme')
            expect(api.getTheme('new-theme')).toEqual(newTheme)
        })

        it('should unregister theme', () => {
            const api = makeThemeApi()

            api.registerTheme('temp-theme', DEFAULT_THEME)
            expect(api.availableThemes.value).toContain('temp-theme')

            api.unregisterTheme('temp-theme')
            expect(api.availableThemes.value).not.toContain('temp-theme')
        })

        it('should not unregister default theme', () => {
            const api = makeThemeApi()
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

            api.unregisterTheme('classic')

            expect(api.availableThemes.value).toContain('classic')
            expect(consoleSpy).toHaveBeenCalled()

            consoleSpy.mockRestore()
        })

        it('should switch to default theme when current theme is unregistered', () => {
            const api = makeThemeApi()

            api.registerTheme('temp-theme', DEFAULT_THEME)
            api.setTheme('temp-theme')
            expect(api.currentTheme.value).toBe('temp-theme')

            api.unregisterTheme('temp-theme')
            expect(api.currentTheme.value).toBe('classic')
        })

        it('should apply theme variables to DOM', () => {
            const api = makeThemeApi({ autoInit: false })

            api.initTheme()

            const root = document.documentElement
            expect(root.style.getPropertyValue('--brutal-primary')).toBe(DEFAULT_THEME.colors.primary)
            expect(root.style.getPropertyValue('--brutal-bg')).toBe(DEFAULT_THEME.colors.bg)
            expect(root.style.getPropertyValue('--brutal-border-width')).toBe(DEFAULT_THEME.border.width)
        })

        it('should apply custom theme variables to DOM', () => {
            const api = makeThemeApi()

            api.setTheme('pastel')

            const root = document.documentElement
            expect(root.style.getPropertyValue('--brutal-primary')).toBe(PASTEL_THEME.colors.primary)
            expect(root.style.getPropertyValue('--brutal-bg')).toBe(PASTEL_THEME.colors.bg)
            expect(root.style.getPropertyValue('--brutal-radius')).toBe(PASTEL_THEME.border.radius)
        })

        it('should persist theme to localStorage', () => {
            const api = makeThemeApi()

            api.setTheme('pastel')

            expect(localStorage.getItem('brutx-theme-variables')).toBe('pastel')
        })

        it('should persist dark mode to localStorage', () => {
            const api = makeThemeApi()

            api.toggleDarkMode()

            expect(localStorage.getItem('brutx-theme-variables-dark')).toBe('true')
        })

        it('should restore theme from localStorage on init', () => {
            localStorage.setItem('brutx-theme-variables', 'pastel')

            const api = makeThemeApi()
            api.initTheme()

            expect(api.currentTheme.value).toBe('pastel')
        })

        it('should restore dark mode from localStorage on init', () => {
            localStorage.setItem('brutx-theme-variables-dark', 'true')

            const api = makeThemeApi()
            api.initTheme()

            expect(api.isDark.value).toBe(true)
            expect(document.documentElement.classList.contains('dark')).toBe(true)
        })

        it('should destroy and clean up DOM', () => {
            const api = makeThemeApi()
            api.initTheme()

            // Verify variables are applied
            const root = document.documentElement
            expect(root.style.getPropertyValue('--brutal-primary')).toBeTruthy()

            api.destroy()

            // Variables should be removed
            expect(root.style.getPropertyValue('--brutal-primary')).toBeFalsy()
        })

        it('should share dark mode state with createDarkModeToggle on the same storage key', () => {
            const sharedKey = 'shared-dark-key'
            const api = makeThemeApi({ storageKey: sharedKey })
            const toggle = makeDarkToggle(sharedKey)

            // 任一工厂切换，另一工厂的 ref 与 DOM class 同步跟随
            api.toggleDarkMode()
            expect(toggle.isDark.value).toBe(true)
            expect(document.documentElement.classList.contains('dark')).toBe(true)

            toggle.toggle()
            expect(api.isDark.value).toBe(false)
            expect(document.documentElement.classList.contains('dark')).toBe(false)

            // 后 init 的一方读到当前值后不产生状态覆盖/回跳
            toggle.init()
            expect(api.isDark.value).toBe(false)
            expect(toggle.isDark.value).toBe(false)
            expect(document.documentElement.classList.contains('dark')).toBe(false)
        })

        it('should follow dark mode changes from storage events (cross-tab sync)', () => {
            const api = makeThemeApi({ storageKey: 'cross-tab-key' })

            expect(api.isDark.value).toBe(false)
            window.dispatchEvent(
                new StorageEvent('storage', { key: 'cross-tab-key-dark', newValue: 'true' })
            )
            expect(api.isDark.value).toBe(true)
            expect(document.documentElement.classList.contains('dark')).toBe(true)

            window.dispatchEvent(
                new StorageEvent('storage', { key: 'cross-tab-key-dark', newValue: 'false' })
            )
            expect(api.isDark.value).toBe(false)
            expect(document.documentElement.classList.contains('dark')).toBe(false)

            // 无关键不触发状态变化
            window.dispatchEvent(new StorageEvent('storage', { key: 'unrelated-key', newValue: 'true' }))
            expect(api.isDark.value).toBe(false)
        })

        it('should enable dark mode when switching to the dark theme', () => {
            const api = makeThemeApi({ storageKey: 'theme-link-key' })

            api.setTheme('dark')

            expect(api.isDark.value).toBe(true)
            expect(document.documentElement.classList.contains('dark')).toBe(true)
            expect(localStorage.getItem('theme-link-key-dark')).toBe('true')
            expect(api.currentTheme.value).toBe('dark')
        })

        it('should keep shared dark state alive when one factory is destroyed', () => {
            const sharedKey = 'refcount-shared-key'
            const api = makeThemeApi({ storageKey: sharedKey })
            const toggle = makeDarkToggle(sharedKey)

            toggle.toggle()
            expect(toggle.isDark.value).toBe(true)

            api.destroy()

            // 仍有同 key 消费者存活：ref 与 DOM class 不受影响
            expect(toggle.isDark.value).toBe(true)
            expect(document.documentElement.classList.contains('dark')).toBe(true)

            // 跨标签页 storage 监听仍有效
            window.dispatchEvent(
                new StorageEvent('storage', { key: `${sharedKey}-dark`, newValue: 'false' })
            )
            expect(toggle.isDark.value).toBe(false)
            expect(document.documentElement.classList.contains('dark')).toBe(false)
        })

        it('should reset dark class only when the last consumer is released', () => {
            const sharedKey = 'refcount-last-key'
            const api = makeThemeApi({ storageKey: sharedKey })
            const toggle = makeDarkToggle(sharedKey)

            toggle.toggle()
            api.destroy()

            // 仍有 toggle 存活：class 保留
            expect(document.documentElement.classList.contains('dark')).toBe(true)

            toggle.dispose()

            // 最后一位消费者释放：监听移除、class 复位、共享表项清理
            expect(document.documentElement.classList.contains('dark')).toBe(false)

            // 同一 key 的新实例从初始状态开始
            const fresh = makeDarkToggle(sharedKey)
            expect(fresh.isDark.value).toBe(false)
        })

        it('should remove dark class on destroy when no other consumer exists', () => {
            const api = makeThemeApi({ storageKey: 'refcount-solo-key' })

            api.toggleDarkMode()
            expect(document.documentElement.classList.contains('dark')).toBe(true)

            api.destroy()
            expect(document.documentElement.classList.contains('dark')).toBe(false)
        })
    })

    describe('createDarkModeToggle', () => {
        it('should create dark mode toggle', () => {
            const { isDark, toggle } = makeDarkToggle()

            expect(isDark.value).toBe(false)

            toggle()
            expect(isDark.value).toBe(true)
            expect(document.documentElement.classList.contains('dark')).toBe(true)

            toggle()
            expect(isDark.value).toBe(false)
            expect(document.documentElement.classList.contains('dark')).toBe(false)
        })

        it('should restore dark mode from localStorage on init', () => {
            localStorage.setItem('brutx-theme-variables-dark', 'true')

            const { isDark, init } = makeDarkToggle()
            init()

            expect(isDark.value).toBe(true)
            expect(document.documentElement.classList.contains('dark')).toBe(true)
        })

        it('should use custom storage key', () => {
            const customKey = 'custom-dark-key'
            const { toggle } = makeDarkToggle(customKey)

            toggle()

            expect(localStorage.getItem(customKey + '-dark')).toBe('true')
        })

        it('should expose dispose to release the shared store', () => {
            const sharedKey = 'toggle-dispose-key'
            const toggle = makeDarkToggle(sharedKey)

            toggle.toggle()
            expect(toggle.isDark.value).toBe(true)

            toggle.dispose()

            // 释放后同一 key 的新实例从初始状态开始
            const fresh = makeThemeApi({ storageKey: sharedKey })
            expect(fresh.isDark.value).toBe(false)
        })
    })
})
