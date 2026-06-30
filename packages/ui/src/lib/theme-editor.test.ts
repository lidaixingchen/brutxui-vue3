import { createThemeEditor } from './theme-editor'
import { DEFAULT_THEMES, type ThemeVariables } from './theme-variables'

describe('createThemeEditor', () => {
    describe('initialization', () => {
        it('creates editor with default themes', () => {
            const editor = createThemeEditor()
            const themes = editor.getAllThemes()
            expect(Object.keys(themes)).toEqual(Object.keys(DEFAULT_THEMES))
        })

        it('creates editor with custom themes', () => {
            const custom: Record<string, ThemeVariables> = {
                myTheme: { ...DEFAULT_THEMES.default },
            }
            const editor = createThemeEditor({ themes: custom })
            const themes = editor.getAllThemes()
            expect(themes.myTheme).toBeDefined()
        })

        it('deep clones themes to prevent external mutation', () => {
            const editor = createThemeEditor()
            const themes = editor.getAllThemes()
            themes.default.colors.primary = '#000000'
            // Original should not be mutated
            expect(editor.getTheme('default')!.colors.primary).toBe('#FF6B6B')
        })
    })

    describe('getTheme', () => {
        it('returns existing theme', () => {
            const editor = createThemeEditor()
            const theme = editor.getTheme('default')
            expect(theme).toBeDefined()
            expect(theme!.colors.primary).toBe('#FF6B6B')
        })

        it('returns undefined for non-existent theme', () => {
            const editor = createThemeEditor()
            expect(editor.getTheme('nonexistent')).toBeUndefined()
        })
    })

    describe('updateTheme', () => {
        it('updates color variables', () => {
            const editor = createThemeEditor()
            const result = editor.updateTheme('default', {
                colors: { primary: '#FF0000' },
            })
            expect(result).toBe(true)
            expect(editor.getTheme('default')!.colors.primary).toBe('#FF0000')
            // Other colors should remain unchanged
            expect(editor.getTheme('default')!.colors.secondary).toBe('#4ECDC4')
        })

        it('updates border variables', () => {
            const editor = createThemeEditor()
            const result = editor.updateTheme('default', {
                border: { width: '5px' },
            })
            expect(result).toBe(true)
            expect(editor.getTheme('default')!.border.width).toBe('5px')
            expect(editor.getTheme('default')!.border.color).toBe('#000000')
        })

        it('updates shadow variables', () => {
            const editor = createThemeEditor()
            const result = editor.updateTheme('default', {
                shadow: { color: '#FF0000' },
            })
            expect(result).toBe(true)
            expect(editor.getTheme('default')!.shadow.color).toBe('#FF0000')
        })

        it('updates spacing variables', () => {
            const editor = createThemeEditor()
            const result = editor.updateTheme('default', {
                spacing: { md: '2rem' },
            })
            expect(result).toBe(true)
            expect(editor.getTheme('default')!.spacing.md).toBe('2rem')
        })

        it('returns false for non-existent theme', () => {
            const editor = createThemeEditor()
            const result = editor.updateTheme('nonexistent', {
                colors: { primary: '#FF0000' },
            })
            expect(result).toBe(false)
        })

        it('calls onThemeChange callback', () => {
            const onThemeChange = vi.fn()
            const editor = createThemeEditor({ onThemeChange })
            editor.updateTheme('default', { colors: { primary: '#FF0000' } })
            expect(onThemeChange).toHaveBeenCalledWith('default', expect.objectContaining({
                colors: expect.objectContaining({ primary: '#FF0000' }),
            }))
        })
    })

    describe('exportTheme / importTheme', () => {
        it('exports theme as JSON string', () => {
            const editor = createThemeEditor()
            const json = editor.exportTheme('default')
            expect(json).not.toBeNull()
            const parsed = JSON.parse(json!)
            expect(parsed.colors.primary).toBe('#FF6B6B')
        })

        it('returns null for non-existent theme', () => {
            const editor = createThemeEditor()
            expect(editor.exportTheme('nonexistent')).toBeNull()
        })

        it('imports theme from valid JSON', () => {
            const editor = createThemeEditor()
            const json = JSON.stringify(DEFAULT_THEMES.default)
            const result = editor.importTheme('imported', json)
            expect(result).toBe(true)
            expect(editor.getTheme('imported')).toBeDefined()
            expect(editor.getTheme('imported')!.colors.primary).toBe('#FF6B6B')
        })

        it('returns false for invalid JSON', () => {
            const editor = createThemeEditor()
            expect(editor.importTheme('bad', 'not json')).toBe(false)
        })

        it('returns false for invalid theme structure', () => {
            const editor = createThemeEditor()
            expect(editor.importTheme('bad', '{"foo": "bar"}')).toBe(false)
        })

        it('round-trips export -> import', () => {
            const editor = createThemeEditor()
            editor.updateTheme('default', { colors: { primary: '#ABCDEF' } })
            const json = editor.exportTheme('default')!
            const result = editor.importTheme('roundtrip', json)
            expect(result).toBe(true)
            expect(editor.getTheme('roundtrip')!.colors.primary).toBe('#ABCDEF')
        })
    })

    describe('exportAllThemes / importAllThemes', () => {
        it('exports all themes as JSON', () => {
            const editor = createThemeEditor()
            const json = editor.exportAllThemes()
            const parsed = JSON.parse(json)
            expect(Object.keys(parsed)).toEqual(Object.keys(DEFAULT_THEMES))
        })

        it('imports multiple themes', () => {
            const editor = createThemeEditor()
            const data = {
                theme1: DEFAULT_THEMES.default,
                theme2: DEFAULT_THEMES.dark,
            }
            const result = editor.importAllThemes(JSON.stringify(data))
            expect(result).toBe(true)
            expect(editor.getTheme('theme1')).toBeDefined()
            expect(editor.getTheme('theme2')).toBeDefined()
        })

        it('returns false for invalid JSON', () => {
            const editor = createThemeEditor()
            expect(editor.importAllThemes('not json')).toBe(false)
        })

        it('returns false for non-object JSON', () => {
            const editor = createThemeEditor()
            expect(editor.importAllThemes('"string"')).toBe(false)
            expect(editor.importAllThemes('[1,2,3]')).toBe(false)
        })

        it('returns false for invalid theme in entries', () => {
            const editor = createThemeEditor()
            expect(editor.importAllThemes('{"bad": {"foo": "bar"}}')).toBe(false)
        })
    })

    describe('generateCSS', () => {
        it('generates CSS variables with default selector', () => {
            const editor = createThemeEditor()
            const css = editor.generateCSS('default')
            expect(css).not.toBeNull()
            expect(css).toContain('[data-theme="default"]')
            expect(css).toContain('--brutal-primary: #FF6B6B')
            expect(css).toContain('--brutal-bg: #FFFFFF')
            expect(css).toContain('--brutal-border-width: 3px')
            expect(css).toContain('--brutal-shadow-color: #000000')
        })

        it('generates CSS with custom selector', () => {
            const editor = createThemeEditor()
            const css = editor.generateCSS('default', { selector: ':root' })
            expect(css).toContain(':root')
        })

        it('generates CSS with custom prefix', () => {
            const editor = createThemeEditor()
            const css = editor.generateCSS('default', { prefix: '--custom' })
            expect(css).toContain('--custom-primary:')
            expect(css).not.toContain('--brutal-')
        })

        it('generates CSS with spacing variables', () => {
            const editor = createThemeEditor()
            const css = editor.generateCSS('default')
            expect(css).toContain('--brutal-spacing-')
        })

        it('generates CSS with typography variables', () => {
            const editor = createThemeEditor()
            const css = editor.generateCSS('default')
            expect(css).toContain('--brutal-font-family:')
            expect(css).toContain('--brutal-font-size-')
        })

        it('returns null for non-existent theme', () => {
            const editor = createThemeEditor()
            expect(editor.generateCSS('nonexistent')).toBeNull()
        })

        it('generates minified CSS', () => {
            const editor = createThemeEditor()
            const css = editor.generateCSS('default', { minified: true })
            expect(css).not.toContain('\n  ')
        })
    })

    describe('cloneTheme', () => {
        it('clones existing theme', () => {
            const editor = createThemeEditor()
            const result = editor.cloneTheme('default', 'myClone')
            expect(result).toBe(true)
            expect(editor.getTheme('myClone')).toBeDefined()
            expect(editor.getTheme('myClone')!.colors.primary).toBe(
                editor.getTheme('default')!.colors.primary,
            )
        })

        it('cloned theme is independent', () => {
            const editor = createThemeEditor()
            editor.cloneTheme('default', 'myClone')
            editor.updateTheme('myClone', { colors: { primary: '#000000' } })
            expect(editor.getTheme('default')!.colors.primary).toBe('#FF6B6B')
            expect(editor.getTheme('myClone')!.colors.primary).toBe('#000000')
        })

        it('returns false for non-existent source', () => {
            const editor = createThemeEditor()
            expect(editor.cloneTheme('nonexistent', 'target')).toBe(false)
        })

        it('calls onThemeChange callback', () => {
            const onThemeChange = vi.fn()
            const editor = createThemeEditor({ onThemeChange })
            editor.cloneTheme('default', 'myClone')
            expect(onThemeChange).toHaveBeenCalledWith('myClone', expect.any(Object))
        })
    })

    describe('removeTheme', () => {
        it('removes custom theme', () => {
            const editor = createThemeEditor()
            editor.importTheme('custom', JSON.stringify(DEFAULT_THEMES.default))
            expect(editor.removeTheme('custom')).toBe(true)
            expect(editor.getTheme('custom')).toBeUndefined()
        })

        it('does not remove built-in themes', () => {
            const editor = createThemeEditor()
            expect(editor.removeTheme('default')).toBe(false)
            expect(editor.removeTheme('dark')).toBe(false)
            expect(editor.removeTheme('pastel')).toBe(false)
        })

        it('returns false for non-existent theme', () => {
            const editor = createThemeEditor()
            expect(editor.removeTheme('nonexistent')).toBe(false)
        })
    })

    describe('resetTheme', () => {
        it('resets modified theme to defaults', () => {
            const editor = createThemeEditor()
            editor.updateTheme('default', { colors: { primary: '#000000' } })
            expect(editor.getTheme('default')!.colors.primary).toBe('#000000')

            const result = editor.resetTheme('default')
            expect(result).toBe(true)
            expect(editor.getTheme('default')!.colors.primary).toBe('#FF6B6B')
        })

        it('returns false for non-existent default theme', () => {
            const editor = createThemeEditor()
            editor.importTheme('custom', JSON.stringify(DEFAULT_THEMES.default))
            // 'custom' is not in DEFAULT_THEMES, so reset should fail
            expect(editor.resetTheme('custom')).toBe(false)
        })
    })

    describe('validateTheme', () => {
        it('validates correct theme structure', () => {
            const editor = createThemeEditor()
            expect(editor.validateTheme(DEFAULT_THEMES.default)).toBe(true)
        })

        it('rejects null', () => {
            const editor = createThemeEditor()
            expect(editor.validateTheme(null)).toBe(false)
        })

        it('rejects non-object', () => {
            const editor = createThemeEditor()
            expect(editor.validateTheme('string')).toBe(false)
            expect(editor.validateTheme(42)).toBe(false)
        })

        it('rejects missing colors', () => {
            const editor = createThemeEditor()
            expect(editor.validateTheme({
                border: DEFAULT_THEMES.default.border,
                shadow: DEFAULT_THEMES.default.shadow,
                spacing: DEFAULT_THEMES.default.spacing,
                typography: DEFAULT_THEMES.default.typography,
            })).toBe(false)
        })

        it('rejects invalid color values', () => {
            const editor = createThemeEditor()
            expect(editor.validateTheme({
                ...DEFAULT_THEMES.default,
                colors: { ...DEFAULT_THEMES.default.colors, primary: 123 },
            })).toBe(false)
        })

        it('rejects missing border', () => {
            const editor = createThemeEditor()
            expect(editor.validateTheme({
                colors: DEFAULT_THEMES.default.colors,
                shadow: DEFAULT_THEMES.default.shadow,
                spacing: DEFAULT_THEMES.default.spacing,
                typography: DEFAULT_THEMES.default.typography,
            })).toBe(false)
        })
    })

    describe('autoApply', () => {
        it('does not apply to DOM by default', () => {
            const editor = createThemeEditor()
            // updateTheme should not throw
            editor.updateTheme('default', { colors: { primary: '#FF0000' } })
        })

        it('applies to DOM when autoApply is true', () => {
            const onThemeChange = vi.fn()
            const editor = createThemeEditor({ autoApply: true, onThemeChange })
            editor.updateTheme('default', { colors: { primary: '#FF0000' } })
            expect(onThemeChange).toHaveBeenCalled()
        })
    })

    describe('previewTheme / clearPreview', () => {
        it('previewTheme returns true for valid theme', () => {
            const editor = createThemeEditor()
            expect(editor.previewTheme('default')).toBe(true)
        })

        it('previewTheme returns false for invalid theme', () => {
            const editor = createThemeEditor()
            expect(editor.previewTheme('nonexistent')).toBe(false)
        })

        it('clearPreview does not throw', () => {
            const editor = createThemeEditor()
            expect(() => editor.clearPreview()).not.toThrow()
        })
    })

    describe('importThemeFromFile', () => {
        it('imports from valid file', async () => {
            const editor = createThemeEditor()
            const json = JSON.stringify(DEFAULT_THEMES.default)
            const file = new File([json], 'my-theme.json', { type: 'application/json' })

            const result = await editor.importThemeFromFile(file)
            expect(result).not.toBeNull()
            expect(result!.name).toBe('my-theme')
            expect(result!.variables.colors.primary).toBe('#FF6B6B')
        })

        it('returns null for invalid file content', async () => {
            const editor = createThemeEditor()
            const file = new File(['not json'], 'bad.json', { type: 'application/json' })

            const result = await editor.importThemeFromFile(file)
            expect(result).toBeNull()
        })

        it('returns null for file with invalid theme structure', async () => {
            const editor = createThemeEditor()
            const file = new File(['{"foo":"bar"}'], 'bad.json', { type: 'application/json' })

            const result = await editor.importThemeFromFile(file)
            expect(result).toBeNull()
        })
    })
})
