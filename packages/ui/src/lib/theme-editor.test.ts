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
                myTheme: { ...DEFAULT_THEMES.classic },
            }
            const editor = createThemeEditor({ themes: custom })
            const themes = editor.getAllThemes()
            expect(themes.myTheme).toBeDefined()
        })

        it('deep clones themes to prevent external mutation', () => {
            const editor = createThemeEditor()
            const themes = editor.getAllThemes()
            themes.classic.colors.primary = '#000000'
            // Original should not be mutated
            expect(editor.getTheme('classic')!.colors.primary).toBe('#FF6B6B')
        })
    })

    describe('getTheme', () => {
        it('returns existing theme', () => {
            const editor = createThemeEditor()
            const theme = editor.getTheme('classic')
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
            const result = editor.updateTheme('classic', {
                colors: { primary: '#FF0000' },
            })
            expect(result).toBe(true)
            expect(editor.getTheme('classic')!.colors.primary).toBe('#FF0000')
            // Other colors should remain unchanged
            expect(editor.getTheme('classic')!.colors.secondary).toBe('#4ECDC4')
        })

        it('updates border variables', () => {
            const editor = createThemeEditor()
            const result = editor.updateTheme('classic', {
                border: { width: '5px' },
            })
            expect(result).toBe(true)
            expect(editor.getTheme('classic')!.border.width).toBe('5px')
            expect(editor.getTheme('classic')!.border.color).toBe('#000000')
        })

        it('updates shadow variables', () => {
            const editor = createThemeEditor()
            const result = editor.updateTheme('classic', {
                shadow: { color: '#FF0000' },
            })
            expect(result).toBe(true)
            expect(editor.getTheme('classic')!.shadow.color).toBe('#FF0000')
        })

        it('updates spacing variables', () => {
            const editor = createThemeEditor()
            const result = editor.updateTheme('classic', {
                spacing: { md: '2rem' },
            })
            expect(result).toBe(true)
            expect(editor.getTheme('classic')!.spacing.md).toBe('2rem')
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
            editor.updateTheme('classic', { colors: { primary: '#FF0000' } })
            expect(onThemeChange).toHaveBeenCalledWith('classic', expect.objectContaining({
                colors: expect.objectContaining({ primary: '#FF0000' }),
            }))
        })
    })

    describe('exportTheme / importTheme', () => {
        it('exports theme as JSON string', () => {
            const editor = createThemeEditor()
            const json = editor.exportTheme('classic')
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
            const json = JSON.stringify(DEFAULT_THEMES.classic)
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
            editor.updateTheme('classic', { colors: { primary: '#ABCDEF' } })
            const json = editor.exportTheme('classic')!
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
                theme1: DEFAULT_THEMES.classic,
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
            const css = editor.generateCSS('classic')
            expect(css).not.toBeNull()
            expect(css).toContain('[data-theme="classic"]')
            expect(css).toContain('--brutal-primary: #FF6B6B')
            expect(css).toContain('--brutal-bg: #FFFFFF')
            expect(css).toContain('--brutal-border-width: 3px')
            expect(css).toContain('--brutal-shadow-color: #000000')
        })

        it('generates CSS with custom selector', () => {
            const editor = createThemeEditor()
            const css = editor.generateCSS('classic', { selector: ':root' })
            expect(css).toContain(':root')
        })

        it('generates CSS with custom prefix', () => {
            const editor = createThemeEditor()
            const css = editor.generateCSS('classic', { prefix: '--custom' })
            expect(css).toContain('--custom-primary:')
            expect(css).not.toContain('--brutal-')
        })

        it('generates CSS with spacing variables', () => {
            const editor = createThemeEditor()
            const css = editor.generateCSS('classic')
            expect(css).toContain('--brutal-spacing-')
        })

        it('generates CSS with typography variables', () => {
            const editor = createThemeEditor()
            const css = editor.generateCSS('classic')
            expect(css).toContain('--brutal-font-family:')
            expect(css).toContain('--brutal-font-size-')
        })

        it('returns null for non-existent theme', () => {
            const editor = createThemeEditor()
            expect(editor.generateCSS('nonexistent')).toBeNull()
        })

        it('generates minified CSS', () => {
            const editor = createThemeEditor()
            const css = editor.generateCSS('classic', { minified: true })
            expect(css).not.toContain('\n  ')
        })
    })

    describe('cloneTheme', () => {
        it('clones existing theme', () => {
            const editor = createThemeEditor()
            const result = editor.cloneTheme('classic', 'myClone')
            expect(result).toBe(true)
            expect(editor.getTheme('myClone')).toBeDefined()
            expect(editor.getTheme('myClone')!.colors.primary).toBe(
                editor.getTheme('classic')!.colors.primary,
            )
        })

        it('cloned theme is independent', () => {
            const editor = createThemeEditor()
            editor.cloneTheme('classic', 'myClone')
            editor.updateTheme('myClone', { colors: { primary: '#000000' } })
            expect(editor.getTheme('classic')!.colors.primary).toBe('#FF6B6B')
            expect(editor.getTheme('myClone')!.colors.primary).toBe('#000000')
        })

        it('returns false for non-existent source', () => {
            const editor = createThemeEditor()
            expect(editor.cloneTheme('nonexistent', 'target')).toBe(false)
        })

        it('calls onThemeChange callback', () => {
            const onThemeChange = vi.fn()
            const editor = createThemeEditor({ onThemeChange })
            editor.cloneTheme('classic', 'myClone')
            expect(onThemeChange).toHaveBeenCalledWith('myClone', expect.any(Object))
        })
    })

    describe('removeTheme', () => {
        it('removes custom theme', () => {
            const editor = createThemeEditor()
            editor.importTheme('custom', JSON.stringify(DEFAULT_THEMES.classic))
            expect(editor.removeTheme('custom')).toBe(true)
            expect(editor.getTheme('custom')).toBeUndefined()
        })

        it('does not remove built-in themes', () => {
            const editor = createThemeEditor()
            expect(editor.removeTheme('classic')).toBe(false)
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
            editor.updateTheme('classic', { colors: { primary: '#000000' } })
            expect(editor.getTheme('classic')!.colors.primary).toBe('#000000')

            const result = editor.resetTheme('classic')
            expect(result).toBe(true)
            expect(editor.getTheme('classic')!.colors.primary).toBe('#FF6B6B')
        })

        it('returns false for non-existent default theme', () => {
            const editor = createThemeEditor()
            editor.importTheme('custom', JSON.stringify(DEFAULT_THEMES.classic))
            // 'custom' is not in DEFAULT_THEMES, so reset should fail
            expect(editor.resetTheme('custom')).toBe(false)
        })
    })

    describe('validateTheme', () => {
        it('validates correct theme structure', () => {
            const editor = createThemeEditor()
            expect(editor.validateTheme(DEFAULT_THEMES.classic)).toBe(true)
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
                border: DEFAULT_THEMES.classic.border,
                shadow: DEFAULT_THEMES.classic.shadow,
                spacing: DEFAULT_THEMES.classic.spacing,
                typography: DEFAULT_THEMES.classic.typography,
            })).toBe(false)
        })

        it('rejects invalid color values', () => {
            const editor = createThemeEditor()
            expect(editor.validateTheme({
                ...DEFAULT_THEMES.classic,
                colors: { ...DEFAULT_THEMES.classic.colors, primary: 123 },
            })).toBe(false)
        })

        it('rejects missing border', () => {
            const editor = createThemeEditor()
            expect(editor.validateTheme({
                colors: DEFAULT_THEMES.classic.colors,
                shadow: DEFAULT_THEMES.classic.shadow,
                spacing: DEFAULT_THEMES.classic.spacing,
                typography: DEFAULT_THEMES.classic.typography,
            })).toBe(false)
        })
    })

    describe('autoApply', () => {
        it('does not apply to DOM by default', () => {
            const editor = createThemeEditor()
            // updateTheme should not throw
            editor.updateTheme('classic', { colors: { primary: '#FF0000' } })
        })

        it('applies to DOM when autoApply is true', () => {
            const onThemeChange = vi.fn()
            const editor = createThemeEditor({ autoApply: true, onThemeChange })
            editor.updateTheme('classic', { colors: { primary: '#FF0000' } })
            expect(onThemeChange).toHaveBeenCalled()
        })
    })

    describe('previewTheme / clearPreview', () => {
        it('previewTheme returns true for valid theme', () => {
            const editor = createThemeEditor()
            expect(editor.previewTheme('classic')).toBe(true)
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
            const json = JSON.stringify(DEFAULT_THEMES.classic)
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
