import { describe, it, expect, vi } from 'vitest'
import { resolveLanguage, loadLanguage, isLanguageLoaded } from './prism-languages'

// 失败重试 / 阈值降级 / 恢复测试的 mock 状态：按 canonical 记录尝试次数，
// succeedAfter 表示第几次尝试开始成功（用于模拟瞬时故障后恢复）。
const mockLoadState = vi.hoisted(() => ({
    attempts: {} as Record<string, number>,
    succeedAfter: {} as Record<string, number>,
}))

function failOnAttempt(name: string): void {
    const attempt = (mockLoadState.attempts[name] ?? 0) + 1
    mockLoadState.attempts[name] = attempt
    if (attempt < (mockLoadState.succeedAfter[name] ?? Number.POSITIVE_INFINITY)) {
        throw new Error(`simulated load failure for ${name}`)
    }
}

// rust / sql 两个独立 canonical：现有成功路径测试不触碰它们（go/ts/tsx 等），
// 各自可独立覆盖「重试→降级」与「失败→恢复」，避免模块级 failedAttempts 状态跨测试串扰。
vi.mock('prismjs/components/prism-rust', () => {
    failOnAttempt('rust')
    return {}
})
vi.mock('prismjs/components/prism-sql', () => {
    failOnAttempt('sql')
    return {}
})

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

    describe('loadLanguage failure handling', () => {
        it('retries a transiently failing language up to MAX_FAILED_ATTEMPTS then degrades', async () => {
            // rust 的 loader 每次动态 import 都抛错（succeedAfter 默认 Infinity）
            await expect(loadLanguage('rust')).resolves.toBe('plaintext')
            expect(mockLoadState.attempts['rust']).toBe(1)
            expect(isLanguageLoaded('rust')).toBe(false)

            // 首次失败后仍会重试（失败计数未达阈值）
            await expect(loadLanguage('rust')).resolves.toBe('plaintext')
            expect(mockLoadState.attempts['rust']).toBe(2)

            // 达到阈值后直接降级，不再发起动态 import
            await expect(loadLanguage('rust')).resolves.toBe('plaintext')
            expect(mockLoadState.attempts['rust']).toBe(2)
            expect(isLanguageLoaded('rust')).toBe(false)
        })

        it('recovers after a transient failure once the loader succeeds', async () => {
            // sql 第 1 次尝试抛错、第 2 次开始成功（模拟瞬时故障恢复）
            mockLoadState.attempts['sql'] = 0
            mockLoadState.succeedAfter['sql'] = 2

            await expect(loadLanguage('sql')).resolves.toBe('plaintext')
            expect(mockLoadState.attempts['sql']).toBe(1)

            await expect(loadLanguage('sql')).resolves.toBe('sql')
            expect(mockLoadState.attempts['sql']).toBe(2)
            expect(isLanguageLoaded('sql')).toBe(true)

            // 成功后的再次加载走 loadedLanguages 短路，不再触发 loader
            await loadLanguage('sql')
            expect(mockLoadState.attempts['sql']).toBe(2)
        })
    })
})
