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
// 加载失败计数（有限重试而非永久缓存）：动态 import 失败可能来自瞬时因素
// （如文档站重新部署后旧 chunk 哈希 404、开发期 HMR 瞬时错误），若永久缓存失败，
// 本会话内该语言将永远降级为 'plaintext'，SPA 切路由也无法恢复，只能硬刷新。
// 因此改为连续失败达到上限后才降级，期间任意一次成功即可恢复；上限同时兜底了
// 「避免每次渲染都反复发起失败的 import」的诉求。
const failedAttempts = new Map<string, number>()
const MAX_FAILED_ATTEMPTS = 2
// in-flight 加载去重：多个调用方并发请求同一语言时复用同一个 Promise，
// 避免各自绕过 loadedLanguages 检查并重复执行动态 import
const pendingLoads = new Map<string, Promise<string>>()

const markFailed = (canonical: string): void => {
    failedAttempts.set(canonical, (failedAttempts.get(canonical) ?? 0) + 1)
}

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

// 依赖图一次性校验（惰性执行：首次 loadLanguage 调用时跑一次，避免模块顶层
// 同步执行 DFS 引入副作用）：
// 1) 环检测——若维护时引入 A→B→A 环，loadLanguage 在 pendingLoads 登记前的同步
//    阶段会递归回到 A 并不断新建 Promise 形成无限递归（栈溢出），与
//    「复用同一 Promise 去重」相悖，需在加载前显式暴露；
// 2) 依赖名校验——拼写错误的依赖会让父语言按 plaintext 降级，这里以告警暴露配置漂移。
//    仅告警而非抛错：抛错会让「单语言配置错误」扩大为「本会话内所有语言加载全部失效」，
//    且 dependenciesValidated 无法置位、每次 loadLanguage 都重跑并重复抛错。缺 loader 的
//    语言本身由 loadLanguage 的「无 loader 即 plaintext」分支按语言粒度降级，属可接受行为。
let dependenciesValidated = false

function assertDependenciesValid(): void {
    if (dependenciesValidated) return
    // visiting：当前 DFS 路径上的节点（环检测）；explored：已完成校验的节点（剪枝）
    const visiting = new Set<string>()
    const explored = new Set<string>()
    const walk = (name: string): void => {
        const canonical = resolveLanguage(name)
        if (explored.has(canonical)) return
        if (visiting.has(canonical)) {
            throw new Error(`[prism-languages] languageDependencies 存在环（经过 ${canonical}）`)
        }
        const deps = languageDependencies[canonical]
        if (deps === undefined) return
        if (deps.length === 0) {
            explored.add(canonical)
            return
        }
        if (!languageLoaders[canonical]) {
            console.warn(`[prism-languages] 依赖图节点 "${canonical}" 在 languageLoaders 中不存在，按 plaintext 降级`)
        }
        visiting.add(canonical)
        for (const dep of deps) {
            const depCanonical = resolveLanguage(dep)
            if (!languageLoaders[depCanonical]) {
                console.warn(`[prism-languages] 依赖 "${dep}"（→ ${depCanonical}）在 languageLoaders 中不存在，按 plaintext 降级`)
            }
            walk(dep)
        }
        visiting.delete(canonical)
        explored.add(canonical)
    }
    for (const name of Object.keys(languageDependencies)) {
        walk(name)
    }
    dependenciesValidated = true
}

export function resolveLanguage(lang: string): string {
    return canonicalNames[lang] || lang
}

export async function loadLanguage(lang: string): Promise<string> {
    if (lang === 'plaintext') return 'plaintext'

    // 首次加载前校验依赖图（环 / 依赖名），见 assertDependenciesValid 注释
    assertDependenciesValid()

    const canonical = resolveLanguage(lang)
    if (loadedLanguages.has(canonical)) return canonical
    if ((failedAttempts.get(canonical) ?? 0) >= MAX_FAILED_ATTEMPTS) return 'plaintext'

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
                    markFailed(canonical)
                    return 'plaintext'
                }
            }
            await loader()
            loadedLanguages.add(canonical)
            // 成功即清零失败计数：与注释「连续失败达上限才降级、期间任意一次成功即可恢复」语义一致，
            // 避免已恢复语言残留累计失败计数，给未来语言卸载/重置逻辑留下陷阱
            failedAttempts.delete(canonical)
            return canonical
        } catch {
            markFailed(canonical)
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
