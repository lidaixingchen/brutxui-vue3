import Prism from 'prismjs'
import type { Grammar } from 'prismjs'

// Prism 组件文件依赖全局 Prism 对象来注册语法
if (typeof globalThis !== 'undefined' && !(globalThis as Record<string, unknown>).Prism) {
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

const loadedLanguages = new Set<string>()

export async function loadLanguage(lang: string): Promise<string> {
    if (lang === 'plaintext') return 'plaintext'

    if (loadedLanguages.has(lang)) return lang

    const loader = languageLoaders[lang]
    if (!loader) return 'plaintext'

    try {
        await loader()
        loadedLanguages.add(lang)
        return lang
    } catch {
        return 'plaintext'
    }
}

export function isLanguageLoaded(lang: string): boolean {
    return lang === 'plaintext' || loadedLanguages.has(lang)
}

export function getGrammar(lang: string): Grammar | undefined {
    if (lang === 'plaintext') return undefined
    return Prism.languages[lang] as Grammar | undefined
}

export { Prism }
