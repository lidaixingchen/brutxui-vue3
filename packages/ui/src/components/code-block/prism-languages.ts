import Prism from 'prismjs'
import type { Grammar } from 'prismjs'

// prismjs 的 prism-* 语言组件依赖全局 Prism 对象注册语言。
// 必须无条件把本模块实例挂到 globalThis，确保动态加载的语言注册到
// 与本模块 getGrammar 读取的同一实例（避免宿主页已有其他版本 Prism 时实例分裂）。
if (typeof globalThis !== 'undefined') {
    (globalThis as Record<string, unknown>).Prism = Prism
}

const languageLoaders: Record<string, () => Promise<unknown>> = {
    markup: () => import('prismjs/components/prism-markup'),
    html: () => import('prismjs/components/prism-markup'),
    xml: () => import('prismjs/components/prism-markup'),
    svg: () => import('prismjs/components/prism-markup'),
    css: () => import('prismjs/components/prism-css'),
    clike: () => import('prismjs/components/prism-clike'),
    javascript: () => import('prismjs/components/prism-javascript'),
    js: () => import('prismjs/components/prism-javascript'),
    typescript: () => import('prismjs/components/prism-typescript'),
    ts: () => import('prismjs/components/prism-typescript'),
    jsx: () => import('prismjs/components/prism-jsx'),
    tsx: () => import('prismjs/components/prism-tsx'),
    json: () => import('prismjs/components/prism-json'),
    bash: () => import('prismjs/components/prism-bash'),
    sh: () => import('prismjs/components/prism-bash'),
    'shell-session': () => import('prismjs/components/prism-shell-session'),
    python: () => import('prismjs/components/prism-python'),
    py: () => import('prismjs/components/prism-python'),
    sql: () => import('prismjs/components/prism-sql'),
    java: () => import('prismjs/components/prism-java'),
    c: () => import('prismjs/components/prism-c'),
    cpp: () => import('prismjs/components/prism-cpp'),
    go: () => import('prismjs/components/prism-go'),
    rust: () => import('prismjs/components/prism-rust'),
    scss: () => import('prismjs/components/prism-scss'),
    yaml: () => import('prismjs/components/prism-yaml'),
    yml: () => import('prismjs/components/prism-yaml'),
    markdown: () => import('prismjs/components/prism-markdown'),
    md: () => import('prismjs/components/prism-markdown'),
    shell: () => import('prismjs/components/prism-shell-session'),
}

const canonicalNames: Record<string, string> = {
    markup: 'markup',
    html: 'markup',
    xml: 'markup',
    svg: 'markup',
    css: 'css',
    clike: 'clike',
    javascript: 'javascript',
    js: 'javascript',
    typescript: 'typescript',
    ts: 'typescript',
    jsx: 'jsx',
    tsx: 'tsx',
    json: 'json',
    bash: 'bash',
    sh: 'bash',
    python: 'python',
    py: 'python',
    sql: 'sql',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    go: 'go',
    rust: 'rust',
    scss: 'scss',
    yaml: 'yaml',
    yml: 'yaml',
    markdown: 'markdown',
    md: 'markdown',
    shell: 'shell-session',
}

const loadedLanguages = new Set<string>()
// 加载失败缓存：动态 import 失败（如构建产物缺失、语言组件被摇树）属确定性错误，
// 缓存后后续调用直接降级为 'plaintext'，避免每次渲染都反复发起失败的 import
const failedLanguages = new Set<string>()
// in-flight 加载去重：多个调用方并发请求同一语言时复用同一个 Promise，
// 避免各自绕过 loadedLanguages 检查并重复执行动态 import
const pendingLoads = new Map<string, Promise<string>>()

// Prism 语言组件的依赖关系：tsx/jsx/typescript 等组件在模块求值时直接读取父语法
// （Prism.languages.extend('jsx', ...) 并对 undefined 取 .tag 会抛错），
// 因此加载这些语言前必须先把父语法注册到同一 Prism 实例。
const languageDependencies: Record<string, string[]> = {
    javascript: ['clike'],
    typescript: ['clike', 'javascript'],
    jsx: ['markup', 'javascript'],
    tsx: ['jsx', 'typescript'],
    c: ['clike'],
    cpp: ['clike', 'c'],
    java: ['clike'],
    go: ['clike'],
    scss: ['css'],
    markdown: ['markup'],
    'shell-session': ['bash'],
}

export function resolveLanguage(lang: string): string {
    return canonicalNames[lang] || lang
}

export async function loadLanguage(lang: string): Promise<string> {
    if (lang === 'plaintext') return 'plaintext'

    const canonical = resolveLanguage(lang)
    if (loadedLanguages.has(canonical)) return canonical
    if (failedLanguages.has(canonical)) return 'plaintext'

    const loader = languageLoaders[lang] ?? languageLoaders[canonical]
    if (!loader) return 'plaintext'

    const existing = pendingLoads.get(canonical)
    if (existing) return existing

    const pending = (async () => {
        // try/finally 包裹全部逻辑，保证 pendingLoads 无论成败都清理，不留过期条目
        try {
            // 先递归加载依赖（递归自身同样走 loadedLanguages/pendingLoads 去重），
            // 保证 Prism 组件 extend/clone 时父语法已注册；任一依赖加载失败则本语言必失败
            for (const dep of languageDependencies[canonical] ?? []) {
                if (await loadLanguage(dep) === 'plaintext') {
                    failedLanguages.add(canonical)
                    return 'plaintext'
                }
            }
            await loader()
            loadedLanguages.add(canonical)
            return canonical
        } catch {
            failedLanguages.add(canonical)
            return 'plaintext'
        } finally {
            pendingLoads.delete(canonical)
        }
    })()

    pendingLoads.set(canonical, pending)
    return pending
}

export function isLanguageLoaded(lang: string): boolean {
    if (lang === 'plaintext') return true
    return loadedLanguages.has(resolveLanguage(lang))
}

/**
 * 获取语言的 Prism Grammar。
 *
 * 契约：必须**先 `await loadLanguage(lang)` 成功**再调用本函数——本函数不负责触发加载，
 * 未加载的语言（含加载失败降级）会返回 `undefined`。调用方需对 `undefined` 做兜底
 * （如回退为 `escapeHtml` 纯文本渲染），不应假设返回值恒非空。
 */
export function getGrammar(lang: string): Grammar | undefined {
    if (lang === 'plaintext') return undefined
    return Prism.languages[resolveLanguage(lang)] as Grammar | undefined
}

export { Prism }
