import { useTheme, createTheme } from './useTheme'

describe('useTheme', () => {
    beforeEach(() => {
        document.documentElement.className = ''
        localStorage.clear()
    })

    it('exports a composable function', () => {
        expect(typeof useTheme).toBe('function')
    })

    it('returns theme and colorMode refs', () => {
        const { theme, colorMode } = createTheme()
        expect(theme.value).toBeDefined()
        expect(colorMode.value).toBeDefined()
    })

    it('returns setTheme function', () => {
        const { setTheme } = createTheme()
        expect(typeof setTheme).toBe('function')
    })

    it('returns toggleColorMode function', () => {
        const { toggleColorMode } = createTheme()
        expect(typeof toggleColorMode).toBe('function')
    })

    it('returns applyColorMode function', () => {
        const { applyColorMode } = createTheme()
        expect(typeof applyColorMode).toBe('function')
    })

    it('returns initTheme function', () => {
        const { initTheme } = createTheme()
        expect(typeof initTheme).toBe('function')
    })

    it('default theme is classic', () => {
        const { theme } = createTheme()
        expect(theme.value).toBe('classic')
    })

    it('default color mode is light', () => {
        const { colorMode } = createTheme()
        expect(colorMode.value).toBe('light')
    })

    it('setTheme changes theme value', () => {
        const { theme, setTheme } = createTheme()
        setTheme('pastel')
        expect(theme.value).toBe('pastel')
        expect(document.documentElement.classList.contains('theme-pastel')).toBe(true)
    })

    it('toggleColorMode switches between light and dark', () => {
        const { colorMode, toggleColorMode } = createTheme()
        expect(colorMode.value).toBe('light')
        toggleColorMode()
        expect(colorMode.value).toBe('dark')
        expect(document.documentElement.classList.contains('dark')).toBe(true)
        toggleColorMode()
        expect(colorMode.value).toBe('light')
        expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('applyColorMode sets dark mode', () => {
        const { colorMode, applyColorMode } = createTheme()
        applyColorMode('dark')
        expect(colorMode.value).toBe('dark')
        expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('initTheme restores saved theme from localStorage', () => {
        localStorage.setItem('brutx-theme', 'mono')
        localStorage.setItem('brutx-color-mode', 'dark')
        const { theme, colorMode, initTheme } = createTheme()
        initTheme()
        expect(theme.value).toBe('mono')
        expect(colorMode.value).toBe('dark')
        expect(document.documentElement.classList.contains('theme-mono')).toBe(true)
        expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    describe('setCustomVariable', () => {
        it('returns setCustomVariable function', () => {
            const { setCustomVariable } = createTheme()
            expect(typeof setCustomVariable).toBe('function')
        })

        it('sets a CSS custom property on document root', () => {
            const { setCustomVariable } = createTheme()
            setCustomVariable('--brutal-primary', '#ff0000')
            expect(document.documentElement.style.getPropertyValue('--brutal-primary')).toBe('#ff0000')
        })

        it('overwrites existing custom property value', () => {
            const { setCustomVariable } = createTheme()
            setCustomVariable('--brutal-primary', '#ff0000')
            setCustomVariable('--brutal-primary', '#00ff00')
            expect(document.documentElement.style.getPropertyValue('--brutal-primary')).toBe('#00ff00')
        })

        it('accepts any value string', () => {
            const { setCustomVariable } = createTheme()
            setCustomVariable('--brutal-radius', '8px')
            expect(document.documentElement.style.getPropertyValue('--brutal-radius')).toBe('8px')
        })
    })

    describe('removeCustomVariable', () => {
        it('returns removeCustomVariable function', () => {
            const { removeCustomVariable } = createTheme()
            expect(typeof removeCustomVariable).toBe('function')
        })

        it('removes a CSS custom property from document root', () => {
            const { setCustomVariable, removeCustomVariable } = createTheme()
            setCustomVariable('--brutal-primary', '#ff0000')
            expect(document.documentElement.style.getPropertyValue('--brutal-primary')).toBe('#ff0000')
            removeCustomVariable('--brutal-primary')
            expect(document.documentElement.style.getPropertyValue('--brutal-primary')).toBe('')
        })

        it('does not throw when removing non-existent property', () => {
            const { removeCustomVariable } = createTheme()
            expect(() => removeCustomVariable('--nonexistent')).not.toThrow()
        })
    })
})
