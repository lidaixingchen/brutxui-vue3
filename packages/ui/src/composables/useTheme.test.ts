import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { effectScope, defineComponent, h } from 'vue'
import { createTheme, provideTheme, useTheme, destroyFallback } from './useTheme'
import type { ThemeName, ColorMode } from './useTheme'

// Mock env module
vi.mock('../lib/env', () => ({
    hasDocument: true,
    isClient: true,
    safeGetStorageItem: vi.fn(() => null),
    safeSetStorageItem: vi.fn(),
    getDocument: () => document,
    getWindow: () => window,
    matchMedia: (q: string) => window.matchMedia(q),
}))

const envModule = await import('../lib/env')
const mockSafeGetStorageItem = vi.mocked(envModule.safeGetStorageItem)
const mockSafeSetStorageItem = vi.mocked(envModule.safeSetStorageItem)

// Mock window.matchMedia
const mockAddEventListener = vi.fn()
const mockRemoveEventListener = vi.fn()
const mockMatchMedia = vi.fn()

function cleanDomClasses() {
    const root = document.documentElement
    // Remove all theme-* classes
    Array.from(root.classList).forEach((cls) => {
        if (cls.startsWith('theme-') || cls === 'dark') {
            root.classList.remove(cls)
        }
    })
}

describe('useTheme', () => {
    let scope: ReturnType<typeof effectScope>

    beforeEach(() => {
        scope = effectScope(true)
        vi.clearAllMocks()
        cleanDomClasses()

        // Reset matchMedia mock
        mockMatchMedia.mockReturnValue({
            matches: false,
            addEventListener: mockAddEventListener,
            removeEventListener: mockRemoveEventListener,
        })
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: mockMatchMedia,
        })
    })

    afterEach(() => {
        scope.stop()
        destroyFallback()
    })

    describe('createTheme', () => {
        it('should initialize with default values', () => {
            const theme = scope.run(() => createTheme())!
            expect(theme.theme.value).toBe('classic')
            expect(theme.colorMode.value).toBe('light')
            expect(theme.isSystemDark.value).toBe(false)
        })

        it('should set theme and update DOM class', () => {
            const theme = scope.run(() => createTheme())!
            theme.setTheme('mono')
            expect(theme.theme.value).toBe('mono')
            expect(document.documentElement.classList.contains('theme-mono')).toBe(true)
        })

        it('should remove old theme class when changing theme', () => {
            const theme = scope.run(() => createTheme())!
            const removeSpy = vi.spyOn(document.documentElement.classList, 'remove')

            theme.setTheme('pastel')
            theme.setTheme('mono')

            expect(removeSpy).toHaveBeenCalledWith('theme-pastel')
            expect(theme.theme.value).toBe('mono')
            expect(document.documentElement.classList.contains('theme-mono')).toBe(true)
            expect(document.documentElement.classList.contains('theme-pastel')).toBe(false)
        })

        it('should not add class if already exists', () => {
            // Pre-add the class
            document.documentElement.classList.add('theme-classic')
            const theme = scope.run(() => createTheme())!
            const addSpy = vi.spyOn(document.documentElement.classList, 'add')

            theme.setTheme('classic')
            expect(addSpy).not.toHaveBeenCalled()
        })

        it('should save theme to localStorage', () => {
            const theme = scope.run(() => createTheme())!
            theme.setTheme('pastel')
            expect(mockSafeSetStorageItem).toHaveBeenCalledWith('brutx-theme', 'pastel')
        })

        describe('colorMode', () => {
            it('should set color mode and save to storage', () => {
                const theme = scope.run(() => createTheme())!
                theme.applyColorMode('dark')
                expect(theme.colorMode.value).toBe('dark')
                expect(mockSafeSetStorageItem).toHaveBeenCalledWith('brutx-color-mode', 'dark')
            })

            it('should not update if same mode', () => {
                const theme = scope.run(() => createTheme())!
                mockSafeSetStorageItem.mockClear()

                theme.applyColorMode('light')
                expect(mockSafeSetStorageItem).not.toHaveBeenCalled()
            })

            it('should apply system mode based on isSystemDark', () => {
                const theme = scope.run(() => createTheme())!
                theme.isSystemDark.value = true
                theme.applyColorMode('system')
                expect(document.documentElement.classList.contains('dark')).toBe(true)
            })

            it('should apply light mode (remove dark class)', () => {
                // Pre-add dark class to simulate being in dark mode
                document.documentElement.classList.add('dark')
                const theme = scope.run(() => createTheme())!
                // First switch to dark so that applyColorMode('light') actually executes
                theme.applyColorMode('dark')
                expect(document.documentElement.classList.contains('dark')).toBe(true)
                theme.applyColorMode('light')
                expect(document.documentElement.classList.contains('dark')).toBe(false)
            })
        })

        describe('toggleColorMode', () => {
            it('should toggle from light to dark', () => {
                const theme = scope.run(() => createTheme())!
                theme.toggleColorMode()
                expect(theme.colorMode.value).toBe('dark')
            })

            it('should toggle from dark to light', () => {
                const theme = scope.run(() => createTheme())!
                theme.applyColorMode('dark')
                theme.toggleColorMode()
                expect(theme.colorMode.value).toBe('light')
            })
        })

        describe('resolvedColorMode', () => {
            it('should return light when colorMode is light', () => {
                const theme = scope.run(() => createTheme())!
                expect(theme.resolvedColorMode.value).toBe('light')
            })

            it('should return dark when colorMode is dark', () => {
                const theme = scope.run(() => createTheme())!
                theme.applyColorMode('dark')
                expect(theme.resolvedColorMode.value).toBe('dark')
            })

            it('should return dark when system + isSystemDark', () => {
                const theme = scope.run(() => createTheme())!
                theme.isSystemDark.value = true
                theme.applyColorMode('system')
                expect(theme.resolvedColorMode.value).toBe('dark')
            })

            it('should return light when system + not isSystemDark', () => {
                const theme = scope.run(() => createTheme())!
                theme.isSystemDark.value = false
                theme.applyColorMode('system')
                expect(theme.resolvedColorMode.value).toBe('light')
            })
        })

        describe('setCustomVariable', () => {
            it('should set CSS custom property', () => {
                const theme = scope.run(() => createTheme())!
                const setPropertySpy = vi.spyOn(
                    document.documentElement.style,
                    'setProperty',
                )
                theme.setCustomVariable('--primary-color', '#ff0000')
                expect(setPropertySpy).toHaveBeenCalledWith('--primary-color', '#ff0000')
            })
        })

        describe('removeCustomVariable', () => {
            it('should remove CSS custom property', () => {
                const theme = scope.run(() => createTheme())!
                const removePropertySpy = vi.spyOn(
                    document.documentElement.style,
                    'removeProperty',
                )
                theme.removeCustomVariable('--primary-color')
                expect(removePropertySpy).toHaveBeenCalledWith('--primary-color')
            })
        })

        describe('initTheme', () => {
            it('should load saved theme from localStorage', () => {
                mockSafeGetStorageItem.mockImplementation((key: string) => {
                    if (key === 'brutx-theme') return 'warm'
                    return null
                })

                const theme = scope.run(() => createTheme())!
                theme.initTheme()
                expect(theme.theme.value).toBe('warm')
            })

            it('should use default theme if saved theme is invalid', () => {
                mockSafeGetStorageItem.mockImplementation((key: string) => {
                    if (key === 'brutx-theme') return 'invalid-theme'
                    return null
                })

                const theme = scope.run(() => createTheme())!
                theme.initTheme()
                expect(theme.theme.value).toBe('classic')
            })

            it('should load saved color mode from localStorage', () => {
                mockSafeGetStorageItem.mockImplementation((key: string) => {
                    if (key === 'brutx-color-mode') return 'dark'
                    return null
                })

                const theme = scope.run(() => createTheme())!
                theme.initTheme()
                expect(theme.colorMode.value).toBe('dark')
            })

            it('should ignore invalid saved color mode', () => {
                mockSafeGetStorageItem.mockImplementation((key: string) => {
                    if (key === 'brutx-color-mode') return 'invalid-mode'
                    return null
                })

                const theme = scope.run(() => createTheme())!
                theme.initTheme()
                expect(theme.colorMode.value).toBe('light')
            })

            it('should apply system mode if system is dark and no saved mode', () => {
                mockMatchMedia.mockReturnValue({
                    matches: true,
                    addEventListener: mockAddEventListener,
                    removeEventListener: mockRemoveEventListener,
                })

                const theme = scope.run(() => createTheme())!
                theme.initTheme()
                expect(theme.colorMode.value).toBe('system')
            })

            it('should not apply system mode if system is not dark', () => {
                mockMatchMedia.mockReturnValue({
                    matches: false,
                    addEventListener: mockAddEventListener,
                    removeEventListener: mockRemoveEventListener,
                })

                const theme = scope.run(() => createTheme())!
                theme.initTheme()
                // No saved mode, system is not dark -> colorMode stays 'light'
                expect(theme.colorMode.value).toBe('light')
            })

            it('should register system dark mode listener', () => {
                const theme = scope.run(() => createTheme())!
                theme.initTheme()
                expect(mockAddEventListener).toHaveBeenCalledWith(
                    'change',
                    expect.any(Function),
                )
            })

            it('should not initialize twice', () => {
                const theme = scope.run(() => createTheme())!
                theme.initTheme()
                theme.initTheme()
                // matchMedia should only be called once
                expect(mockMatchMedia).toHaveBeenCalledTimes(1)
            })

            it('should handle null saved values (no localStorage data)', () => {
                mockSafeGetStorageItem.mockReturnValue(null)

                const theme = scope.run(() => createTheme())!
                theme.initTheme()
                expect(theme.theme.value).toBe('classic')
                expect(theme.colorMode.value).toBe('light')
            })

            it('should handle empty string saved values as invalid', () => {
                mockSafeGetStorageItem.mockReturnValue('')

                const theme = scope.run(() => createTheme())!
                theme.initTheme()
                // '' is not a valid theme or color mode, so defaults are used
                expect(theme.theme.value).toBe('classic')
                expect(theme.colorMode.value).toBe('light')
            })
        })

        describe('onSystemDarkChange', () => {
            it('should update isSystemDark on media query change', () => {
                const theme = scope.run(() => createTheme())!
                theme.initTheme()

                const callback = mockAddEventListener.mock.calls[0]?.[1] as (e: MediaQueryListEvent) => void

                callback({ matches: true } as MediaQueryListEvent)
                expect(theme.isSystemDark.value).toBe(true)

                callback({ matches: false } as MediaQueryListEvent)
                expect(theme.isSystemDark.value).toBe(false)
            })

            it('should apply resolved mode when colorMode is system', () => {
                const theme = scope.run(() => createTheme())!
                theme.initTheme()
                theme.applyColorMode('system')

                const callback = mockAddEventListener.mock.calls[0]?.[1] as (e: MediaQueryListEvent) => void

                callback({ matches: true } as MediaQueryListEvent)
                expect(document.documentElement.classList.contains('dark')).toBe(true)

                callback({ matches: false } as MediaQueryListEvent)
                expect(document.documentElement.classList.contains('dark')).toBe(false)
            })

            it('should not apply resolved mode when colorMode is not system', () => {
                const theme = scope.run(() => createTheme())!
                theme.initTheme()

                const callback = mockAddEventListener.mock.calls[0]?.[1] as (e: MediaQueryListEvent) => void

                // colorMode is 'light' by default, not 'system'
                callback({ matches: true } as MediaQueryListEvent)
                // isSystemDark should still update
                expect(theme.isSystemDark.value).toBe(true)
                // But dark class should NOT be applied since mode is not 'system'
                expect(document.documentElement.classList.contains('dark')).toBe(false)
            })
        })

        describe('destroy', () => {
            it('should remove event listener', () => {
                const theme = scope.run(() => createTheme())!
                theme.initTheme()
                theme.destroy()
                expect(mockRemoveEventListener).toHaveBeenCalledWith(
                    'change',
                    expect.any(Function),
                )
            })

            it('should handle destroy without init (no mediaQuery)', () => {
                const theme = scope.run(() => createTheme())!
                // Should not throw - mediaQuery is null
                expect(() => theme.destroy()).not.toThrow()
            })
        })
    })

    describe('provideTheme and useTheme', () => {
        it('should provide theme via provideTheme()', () => {
            const provided = scope.run(() => provideTheme())!
            expect(provided).toBeDefined()
            expect(provided.theme.value).toBe('classic')
            expect(provided.colorMode.value).toBe('light')
        })

        it('should inject theme when provider exists', () => {
            scope.run(() => {
                provideTheme()
                const theme = useTheme()
                expect(theme).toBeDefined()
                expect(theme.theme.value).toBe('classic')
            })
        })

        it('should use fallback singleton when no provider', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

            const theme = scope.run(() => useTheme())!
            expect(theme).toBeDefined()
            expect(theme.theme.value).toBe('classic')
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Call provideTheme() in your root component.'),
            )

            consoleSpy.mockRestore()
        })

        it('should reuse fallback instance on subsequent calls', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

            const theme1 = scope.run(() => useTheme())!
            const theme2 = scope.run(() => useTheme())!
            expect(theme1).toBe(theme2)

            consoleSpy.mockRestore()
        })

        it('should destroy fallback instance via destroyFallback()', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

            const theme = scope.run(() => useTheme())!
            const destroySpy = vi.spyOn(theme, 'destroy')

            destroyFallback()
            expect(destroySpy).toHaveBeenCalled()

            consoleSpy.mockRestore()
        })

        it('should handle destroyFallback when no fallback exists', () => {
            expect(() => destroyFallback()).not.toThrow()
        })

        it('should create new fallback after destroyFallback is called', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

            const theme1 = scope.run(() => useTheme())!
            destroyFallback()
            const theme2 = scope.run(() => useTheme())!
            expect(theme1).not.toBe(theme2)

            consoleSpy.mockRestore()
        })

        it('ref-counts component-level cleanup: destroy only when last component unmounts', async () => {
            // 多组件共享 fallback 单例时，仅最后一个组件卸载才销毁单例，
            // 避免提前 destroy 导致其他仍使用单例的组件丢失 mediaQuery 监听器
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

            const Consumer = defineComponent({
                setup() {
                    const theme = useTheme()
                    return () => h('div', theme.theme.value)
                },
            })

            // 挂载两个消费组件
            const w1 = mount(Consumer)
            const w2 = mount(Consumer)
            const fallbackTheme = useTheme() // 取同一个单例
            const destroySpy = vi.spyOn(fallbackTheme, 'destroy')

            // 卸载第一个：不应触发 destroy（仍有第二个组件在用）
            w1.unmount()
            expect(destroySpy).not.toHaveBeenCalled()

            // 卸载第二个：引用计数归零，应触发 destroy
            w2.unmount()
            expect(destroySpy).toHaveBeenCalled()

            consoleSpy.mockRestore()
        })

        it('ref-counts cleanup: destroying first component does not break second component', async () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

            const Consumer = defineComponent({
                setup() {
                    const theme = useTheme()
                    return () => h('div', theme.theme.value)
                },
            })

            const w1 = mount(Consumer)
            const w2 = mount(Consumer)

            // 卸载第一个：单例仍存活，第二个组件应仍可访问
            w1.unmount()
            const fallbackTheme = useTheme()
            expect(fallbackTheme).toBeDefined()
            expect(fallbackTheme.theme.value).toBe('classic')

            // 第二个组件仍可正常工作
            fallbackTheme.setTheme('mono')
            expect(fallbackTheme.theme.value).toBe('mono')

            w2.unmount()
            consoleSpy.mockRestore()
        })
    })

    describe('SSR compatibility (hasDocument: false, isClient: false)', () => {
        it('should skip DOM operations and not throw', async () => {
            vi.resetModules()
            vi.doMock('../lib/env', () => ({
                hasDocument: false,
                isClient: false,
                safeGetStorageItem: vi.fn(() => null),
                safeSetStorageItem: vi.fn(),
            }))

            const { createTheme: createThemeSSR } = await import('./useTheme')
            const theme = scope.run(() => createThemeSSR())!

            // Should not throw even without document
            expect(() => {
                theme.setTheme('mono')
                theme.applyColorMode('dark')
                theme.setCustomVariable('--test', 'value')
                theme.removeCustomVariable('--test')
                theme.initTheme()
                theme.destroy()
            }).not.toThrow()

            // colorMode.value IS updated (set before DOM ops in applyColorMode)
            expect(theme.colorMode.value).toBe('dark')
            // theme.value is NOT updated because applyTheme returns early before setting it
            expect(theme.theme.value).toBe('classic')
        })
    })

    describe('edge cases', () => {
        it('should handle all valid theme names', () => {
            const theme = scope.run(() => createTheme())!
            const validThemes: ThemeName[] = ['classic', 'pastel', 'mono', 'warm']

            validThemes.forEach((name) => {
                theme.setTheme(name)
                expect(theme.theme.value).toBe(name)
            })
        })

        it('should handle all valid color modes', () => {
            const theme = scope.run(() => createTheme())!
            const validModes: ColorMode[] = ['light', 'dark', 'system']

            validModes.forEach((mode) => {
                theme.applyColorMode(mode)
                expect(theme.colorMode.value).toBe(mode)
            })
        })

        it('should toggle through multiple cycles', () => {
            const theme = scope.run(() => createTheme())!

            theme.toggleColorMode()
            expect(theme.colorMode.value).toBe('dark')

            theme.toggleColorMode()
            expect(theme.colorMode.value).toBe('light')

            theme.toggleColorMode()
            expect(theme.colorMode.value).toBe('dark')
        })

        it('should handle setTheme to same value (no-op remove)', () => {
            const theme = scope.run(() => createTheme())!
            const removeSpy = vi.spyOn(document.documentElement.classList, 'remove')

            // Default is 'classic', set to same
            theme.setTheme('classic')
            // remove should NOT be called since theme.value === name
            expect(removeSpy).not.toHaveBeenCalled()
            expect(theme.theme.value).toBe('classic')
        })

        it('should set theme class on init with saved theme', () => {
            mockSafeGetStorageItem.mockImplementation((key: string) => {
                if (key === 'brutx-theme') return 'warm'
                return null
            })

            const theme = scope.run(() => createTheme())!
            theme.initTheme()
            expect(theme.theme.value).toBe('warm')
            expect(document.documentElement.classList.contains('theme-warm')).toBe(true)
        })

        it('should apply system dark mode on init when isSystemDark and no saved mode', () => {
            mockMatchMedia.mockReturnValue({
                matches: true,
                addEventListener: mockAddEventListener,
                removeEventListener: mockRemoveEventListener,
            })

            const theme = scope.run(() => createTheme())!
            theme.initTheme()
            expect(theme.colorMode.value).toBe('system')
            expect(document.documentElement.classList.contains('dark')).toBe(true)
        })

        it('should prefer saved mode over system detection', () => {
            mockMatchMedia.mockReturnValue({
                matches: true,
                addEventListener: mockAddEventListener,
                removeEventListener: mockRemoveEventListener,
            })
            mockSafeGetStorageItem.mockImplementation((key: string) => {
                if (key === 'brutx-color-mode') return 'light'
                return null
            })

            const theme = scope.run(() => createTheme())!
            theme.initTheme()
            // Saved mode 'light' takes priority over system dark
            expect(theme.colorMode.value).toBe('light')
            expect(document.documentElement.classList.contains('dark')).toBe(false)
        })
    })
})
