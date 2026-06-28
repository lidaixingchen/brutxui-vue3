import { mount } from '@vue/test-utils'
import { vi } from 'vitest'
import CodeBlock from './CodeBlock.vue'
import { loadLanguage } from './prism-languages'

describe('CodeBlock', () => {
    it('renders code content', () => {
        const wrapper = mount(CodeBlock, {
            props: { code: 'console.log("hello")' },
        })
        expect(wrapper.find('pre').exists()).toBe(true)
        expect(wrapper.find('code').exists()).toBe(true)
        expect(wrapper.find('code').text()).toBe('console.log("hello")')
    })

    it('renders multiline code content', () => {
        const code = 'line1\nline2\nline3'
        const wrapper = mount(CodeBlock, {
            props: { code },
        })
        expect(wrapper.find('code').text()).toBe(code)
    })

    it('applies default root classes', () => {
        const wrapper = mount(CodeBlock, {
            props: { code: 'test' },
        })
        const classes = wrapper.classes()
        expect(classes).toContain('border-3')
        expect(classes).toContain('border-brutal')
        expect(classes).toContain('shadow-brutal')
        expect(classes).toContain('rounded-brutal')
    })

    it('shows language badge with default plaintext', () => {
        const wrapper = mount(CodeBlock, {
            props: { code: 'test' },
        })
        const badge = wrapper.find('[class*="bg-brutal-accent"]')
        expect(badge.exists()).toBe(true)
        expect(badge.text()).toBe('plaintext')
    })

    it('shows language badge with custom language', () => {
        const wrapper = mount(CodeBlock, {
            props: { code: 'test', language: 'typescript' },
        })
        const badge = wrapper.find('[class*="bg-brutal-accent"]')
        expect(badge.text()).toBe('typescript')
    })

    it('does not show filename by default', () => {
        const wrapper = mount(CodeBlock, {
            props: { code: 'test' },
        })
        expect(wrapper.text()).not.toContain('index.ts')
    })

    it('shows filename when provided', () => {
        const wrapper = mount(CodeBlock, {
            props: { code: 'test', filename: 'index.ts' },
        })
        expect(wrapper.text()).toContain('index.ts')
    })

    it('does not show line numbers by default', () => {
        const wrapper = mount(CodeBlock, {
            props: { code: 'line1\nline2\nline3' },
        })
        const lineNumbersCol = wrapper.find('[class*="border-r-3"]')
        expect(lineNumbersCol.exists()).toBe(false)
    })

    it('shows line numbers when enabled', () => {
        const wrapper = mount(CodeBlock, {
            props: { code: 'line1\nline2\nline3', showLineNumbers: true },
        })
        const lineNumbersCol = wrapper.find('[class*="border-r-3"]')
        expect(lineNumbersCol.exists()).toBe(true)
        const lineSpans = lineNumbersCol.findAll('span')
        expect(lineSpans).toHaveLength(3)
        expect(lineSpans[0].text()).toBe('1')
        expect(lineSpans[1].text()).toBe('2')
        expect(lineSpans[2].text()).toBe('3')
    })

    it('renders copy button', () => {
        const wrapper = mount(CodeBlock, {
            props: { code: 'test' },
        })
        const button = wrapper.find('button')
        expect(button.exists()).toBe(true)
    })

    it('renders slot content when provided', () => {
        const wrapper = mount(CodeBlock, {
            props: { code: 'fallback' },
            slots: { default: '<span class="slot-content">Custom Code</span>' },
        })
        expect(wrapper.find('.slot-content').exists()).toBe(true)
        expect(wrapper.find('.slot-content').text()).toBe('Custom Code')
    })

    it('merges custom class prop', () => {
        const wrapper = mount(CodeBlock, {
            props: { code: 'test', class: 'custom-class' },
        })
        expect(wrapper.classes()).toContain('custom-class')
    })

    it('escapes HTML entities in plaintext mode', () => {
        const wrapper = mount(CodeBlock, {
            props: { code: '<script>alert("xss")</script>' },
        })
        const codeEl = wrapper.find('code')
        expect(codeEl.text()).toContain('<script>')
        expect(wrapper.find('script').exists()).toBe(false)
    })

    it('applies syntax highlighting for known language', async () => {
        const wrapper = mount(CodeBlock, {
            props: { code: 'const x = 1', language: 'javascript' },
        })
        await vi.waitFor(() => {
            expect(wrapper.find('.token').exists()).toBe(true)
        })
        expect(wrapper.find('.token.keyword').exists()).toBe(true)
    })

    it('falls back to plaintext for unknown language', async () => {
        const wrapper = mount(CodeBlock, {
            props: { code: '+++---', language: 'brainfuck' },
        })
        await vi.waitFor(() => {
            expect(wrapper.find('code').text()).toBe('+++---')
        })
        expect(wrapper.find('.token').exists()).toBe(false)
    })

    it('loads shell-session when the canonical shell language is requested directly', async () => {
        await expect(loadLanguage('shell-session')).resolves.toBe('shell-session')
    })

    it('re-highlights when code prop changes', async () => {
        const wrapper = mount(CodeBlock, {
            props: { code: 'const x = 1', language: 'javascript' },
        })
        await vi.waitFor(() => {
            expect(wrapper.find('.token').exists()).toBe(true)
        })
        await wrapper.setProps({ code: 'let y = 2' })
        await vi.waitFor(() => {
            expect(wrapper.find('code').text()).toContain('let y = 2')
        })
    })

    it('re-highlights when language prop changes', async () => {
        const wrapper = mount(CodeBlock, {
            props: { code: 'const x = 1', language: 'javascript' },
        })
        await vi.waitFor(() => {
            expect(wrapper.find('.token').exists()).toBe(true)
        })
        await wrapper.setProps({ language: 'typescript' })
        await vi.waitFor(() => {
            expect(wrapper.find('code').classes()).toContain('language-typescript')
        })
    })
})

describe('CodeBlock maxLines', () => {
    const multilineCode = 'line1\nline2\nline3\nline4\nline5'

    it('does not show toggle button when maxLines is not set', () => {
        const wrapper = mount(CodeBlock, {
            props: { code: multilineCode },
        })
        const toggleContainer = wrapper.find('.border-t-3.bg-brutal-muted')
        expect(toggleContainer.exists()).toBe(false)
    })

    it('does not show toggle button when lines <= maxLines', () => {
        const wrapper = mount(CodeBlock, {
            props: { code: 'line1\nline2\nline3', maxLines: 5 },
        })
        const toggleContainer = wrapper.find('.border-t-3.bg-brutal-muted')
        expect(toggleContainer.exists()).toBe(false)
    })

    it('shows expand button when lines > maxLines', () => {
        const wrapper = mount(CodeBlock, {
            props: { code: multilineCode, maxLines: 3 },
        })
        const toggleContainer = wrapper.find('.border-t-3.bg-brutal-muted')
        expect(toggleContainer.exists()).toBe(true)
        expect(toggleContainer.text()).toContain('展开')
    })

    it('clips code area with maxHeight when collapsed', () => {
        const wrapper = mount(CodeBlock, {
            props: { code: multilineCode, maxLines: 3 },
        })
        const pre = wrapper.find('pre')
        const style = pre.attributes('style') || ''
        expect(style).toContain('max-height')
        expect(style).toContain('overflow: hidden')
    })

    it('removes clip style when expanded', async () => {
        const wrapper = mount(CodeBlock, {
            props: { code: multilineCode, maxLines: 3 },
        })
        const toggleButton = wrapper.find('.border-t-3.bg-brutal-muted button')
        await toggleButton.trigger('click')

        const pre = wrapper.find('pre')
        const style = pre.attributes('style') || ''
        expect(style).not.toContain('max-height')
    })

    it('changes button text to collapse when expanded', async () => {
        const wrapper = mount(CodeBlock, {
            props: { code: multilineCode, maxLines: 3 },
        })
        const toggleButton = wrapper.find('.border-t-3.bg-brutal-muted button')
        expect(toggleButton.text()).toContain('展开')
        await toggleButton.trigger('click')
        expect(toggleButton.text()).toContain('收起')
    })

    it('sets aria-expanded false when collapsed', () => {
        const wrapper = mount(CodeBlock, {
            props: { code: multilineCode, maxLines: 3 },
        })
        const toggleButton = wrapper.find('.border-t-3.bg-brutal-muted button')
        expect(toggleButton.attributes('aria-expanded')).toBe('false')
    })

    it('sets aria-expanded true when expanded', async () => {
        const wrapper = mount(CodeBlock, {
            props: { code: multilineCode, maxLines: 3 },
        })
        const toggleButton = wrapper.find('.border-t-3.bg-brutal-muted button')
        await toggleButton.trigger('click')
        expect(toggleButton.attributes('aria-expanded')).toBe('true')
    })

    it('clips line numbers column when collapsed', () => {
        const wrapper = mount(CodeBlock, {
            props: { code: multilineCode, maxLines: 3, showLineNumbers: true },
        })
        const lineNumbersCol = wrapper.find('[class*="border-r-3"]')
        const style = lineNumbersCol.attributes('style') || ''
        expect(style).toContain('max-height')
    })

    it('collapses again when toggle clicked twice', async () => {
        const wrapper = mount(CodeBlock, {
            props: { code: multilineCode, maxLines: 3 },
        })
        const toggleButton = wrapper.find('.border-t-3.bg-brutal-muted button')

        await toggleButton.trigger('click')
        expect(toggleButton.text()).toContain('收起')

        await toggleButton.trigger('click')
        expect(toggleButton.text()).toContain('展开')

        const pre = wrapper.find('pre')
        const style = pre.attributes('style') || ''
        expect(style).toContain('max-height')
    })
})
