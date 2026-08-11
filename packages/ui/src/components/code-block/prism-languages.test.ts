import { describe, it, expect } from 'vitest'
import { resolveLanguage, loadLanguage, isLanguageLoaded } from './prism-languages'

describe('prism-languages', () => {
    describe('resolveLanguage', () => {
        it('maps aliases to canonical names', () => {
            expect(resolveLanguage('ts')).toBe('typescript')
            expect(resolveLanguage('html')).toBe('markup')
            expect(resolveLanguage('py')).toBe('python')
            expect(resolveLanguage('shell')).toBe('shell-session')
        })

        it('passes through unknown languages unchanged', () => {
            expect(resolveLanguage('brainfuck')).toBe('brainfuck')
        })
    })

    describe('loadLanguage', () => {
        it('returns plaintext immediately for plaintext', async () => {
            await expect(loadLanguage('plaintext')).resolves.toBe('plaintext')
        })

        it('returns plaintext for unknown language without loader', async () => {
            await expect(loadLanguage('brainfuck')).resolves.toBe('plaintext')
        })

        it('loads a language once and marks it loaded', async () => {
            expect(isLanguageLoaded('go')).toBe(false)
            await expect(loadLanguage('go')).resolves.toBe('go')
            expect(isLanguageLoaded('go')).toBe(true)
        })

        it('keeps concurrent loads of the same canonical consistent', async () => {
            const results = await Promise.all([
                loadLanguage('ts'),
                loadLanguage('typescript'),
                loadLanguage('jsx'),
            ])
            // 别名解析到同一 canonical；并发下所有调用都应成功解析而非相互干扰
            expect(results[0]).toBe('typescript')
            expect(results[1]).toBe('typescript')
            expect(results[2]).toBe('jsx')
            expect(isLanguageLoaded('typescript')).toBe(true)
        })

        it('loads dependencies before tsx', async () => {
            // prism-tsx 组件在模块求值时会读取 jsx/typescript 父语法，依赖未先行注册会抛错降级
            await expect(loadLanguage('tsx')).resolves.toBe('tsx')
            expect(isLanguageLoaded('jsx')).toBe(true)
            expect(isLanguageLoaded('typescript')).toBe(true)
            expect(isLanguageLoaded('markup')).toBe(true)
            expect(isLanguageLoaded('tsx')).toBe(true)
        })
    })
})
