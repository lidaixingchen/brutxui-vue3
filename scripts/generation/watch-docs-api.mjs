import { watch as createFileWatcher } from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url))
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIRECTORY, '..', '..')
const API_GENERATION_DEBOUNCE_MS = 180
const PNPM_COMMAND = 'pnpm'
const UI_PACKAGE_FILTER = 'brutx-ui-vue'
const DOCS_PACKAGE_DIRECTORY = 'apps/docs'
const API_CONTENT_DIRECTORY = 'apps/docs/.vitepress/api-content'
const API_TYPES_FILE = 'apps/docs/.vitepress/api-types.ts'
const VITEPRESS_CONFIG_FILE = 'apps/docs/.vitepress/config.ts'
const DOCS_PACKAGE_FILES = new Set(['apps/docs/package.json', 'apps/docs/tsconfig.json'])
const ROOT_PACKAGE_FILES = new Set(['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'turbo.json'])
const UI_PACKAGE_FILES = new Set(['packages/ui/package.json', 'packages/ui/api-contract.ts', 'packages/ui/tsconfig.json'])
const SHARED_PACKAGE_FILES = new Set(['packages/shared/package.json', 'packages/shared/tsconfig.json'])
const COMPONENT_PAGE_DIRECTORIES = ['apps/docs/components/', 'apps/docs/en/components/']
const UI_API_SOURCE_DIRECTORIES = ['packages/ui/src/', 'packages/ui/scripts/']
const SHARED_SOURCE_DIRECTORY = 'packages/shared/src/'
const ROOT_TYPESCRIPT_CONFIGURATION = /^tsconfig(?:\.[^/]+)?\.json$/u
const TEST_FILE_PATTERN = /(?:\.test|\.spec)\.[^.]+$|\/__snapshots__\//u

const WATCH_ROOTS = [
    { relativePath: '.', recursive: false },
    { relativePath: 'apps/docs', recursive: false },
    { relativePath: 'apps/docs/.vitepress', recursive: false },
    { relativePath: API_CONTENT_DIRECTORY, recursive: true },
    { relativePath: 'apps/docs/components', recursive: true },
    { relativePath: 'apps/docs/en/components', recursive: true },
    { relativePath: 'packages/ui', recursive: false },
    { relativePath: 'packages/ui/src', recursive: true },
    { relativePath: 'packages/ui/scripts', recursive: true },
    { relativePath: 'packages/shared', recursive: false },
    { relativePath: 'packages/shared/src', recursive: true },
]

function normalizeRelativePath(relativePath) {
    return path.posix.normalize(String(relativePath).replaceAll('\\', '/')).replace(/^\.\//u, '')
}

export function isDocsApiGenerationInput(relativePath) {
    const normalized = normalizeRelativePath(relativePath)
    if (!normalized || normalized === '.' || TEST_FILE_PATTERN.test(normalized)) return false
    if (ROOT_PACKAGE_FILES.has(normalized) || ROOT_TYPESCRIPT_CONFIGURATION.test(normalized)) return true
    if (DOCS_PACKAGE_FILES.has(normalized) || UI_PACKAGE_FILES.has(normalized) || SHARED_PACKAGE_FILES.has(normalized)) return true
    if (normalized === API_TYPES_FILE || normalized === VITEPRESS_CONFIG_FILE) return true
    if (normalized.startsWith(`${API_CONTENT_DIRECTORY}/`)) return true
    if (COMPONENT_PAGE_DIRECTORIES.some(directory => normalized.startsWith(directory))) return true
    if (UI_API_SOURCE_DIRECTORIES.some(directory => normalized.startsWith(directory))) return true
    return normalized.startsWith(SHARED_SOURCE_DIRECTORY)
}

export function createDocsApiGenerationQueue({
    run,
    debounceMs = API_GENERATION_DEBOUNCE_MS,
    onError = error => console.error(error instanceof Error ? error.message : error),
}) {
    let timer
    let running = false
    let pending = false
    let closed = false
    let lastError
    const idleWaiters = []

    const isIdle = () => !running && !pending && timer === undefined
    const settleIfIdle = () => {
        if (!isIdle()) return
        for (const settle of idleWaiters.splice(0)) settle()
    }

    const schedule = () => {
        if (closed) return
        if (timer !== undefined) clearTimeout(timer)
        timer = setTimeout(() => {
            timer = undefined
            if (running || !pending) {
                settleIfIdle()
                return
            }
            void drain()
        }, debounceMs)
    }

    const drain = async () => {
        if (closed || running || !pending) {
            settleIfIdle()
            return
        }
        pending = false
        running = true
        lastError = undefined
        try {
            await run()
        } catch (error) {
            lastError = error
            onError(error)
        } finally {
            running = false
            if (pending && timer === undefined) schedule()
            settleIfIdle()
        }
    }

    return {
        request() {
            if (closed) return
            pending = true
            schedule()
        },
        flush() {
            if (closed) return Promise.resolve()
            if (timer !== undefined) {
                clearTimeout(timer)
                timer = undefined
            }
            if (pending && !running) void drain()
            return new Promise((resolve, reject) => {
                const settle = () => lastError ? reject(lastError) : resolve()
                if (isIdle()) settle()
                else idleWaiters.push(settle)
            })
        },
        close() {
            closed = true
            pending = false
            if (timer !== undefined) {
                clearTimeout(timer)
                timer = undefined
            }
            settleIfIdle()
        },
    }
}

export function watchDocsApiInputs(root, onChange, { watcher = createFileWatcher, onError = console.error } = {}) {
    const watchers = []
    for (const watchedRoot of WATCH_ROOTS) {
        const absolutePath = path.resolve(root, watchedRoot.relativePath)
        try {
            const fileWatcher = watcher(absolutePath, { recursive: watchedRoot.recursive }, (_eventType, filename) => {
                if (filename === null) {
                    onChange(watchedRoot.relativePath)
                    return
                }
                const changedPath = normalizeRelativePath(path.posix.join(watchedRoot.relativePath, String(filename)))
                if (isDocsApiGenerationInput(changedPath)) onChange(changedPath)
            })
            fileWatcher.on('error', onError)
            watchers.push(fileWatcher)
        } catch (error) {
            onError(new Error(`无法监听 API 文档生成输入 ${absolutePath}`, { cause: error }))
        }
    }
    return () => watchers.forEach(fileWatcher => fileWatcher.close())
}

function runCommand(command, argumentsList, options) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, argumentsList, options)
        child.once('error', reject)
        child.once('exit', (code, signal) => {
            if (code === 0) resolve()
            else reject(new Error(`${command} 退出，code=${code ?? 'null'} signal=${signal ?? 'none'}`))
        })
    })
}

export function buildVitePressDevArguments(args = []) {
    const forwardedArgs = args[0] === '--' ? args.slice(1) : args
    return ['exec', 'vitepress', 'dev', ...forwardedArgs]
}

async function startDevServer(root, closeWatchers, queue, args) {
    await new Promise((resolve, reject) => {
        const child = spawn(PNPM_COMMAND, buildVitePressDevArguments(args), {
            cwd: path.join(root, DOCS_PACKAGE_DIRECTORY),
            stdio: 'inherit',
        })
        const forwardSignal = signal => child.kill(signal)
        const cleanup = () => {
            process.off('SIGINT', handleInterrupt)
            process.off('SIGTERM', handleTerminate)
            closeWatchers()
            queue.close()
        }
        const handleInterrupt = () => forwardSignal('SIGINT')
        const handleTerminate = () => forwardSignal('SIGTERM')
        process.on('SIGINT', handleInterrupt)
        process.on('SIGTERM', handleTerminate)
        child.once('error', error => {
            cleanup()
            reject(error)
        })
        child.once('exit', (code, signal) => {
            cleanup()
            process.exitCode = code ?? 1
            if (signal) process.exitCode = 1
            resolve()
        })
    })
}

async function main() {
    const queue = createDocsApiGenerationQueue({
        run: () => runCommand(PNPM_COMMAND, ['--filter', UI_PACKAGE_FILTER, 'docs:manifest'], {
            cwd: REPOSITORY_ROOT,
            stdio: 'inherit',
        }),
        onError: error => console.error(`[API 文档生成失败] ${error instanceof Error ? error.message : error}`),
    })
    const closeWatchers = watchDocsApiInputs(REPOSITORY_ROOT, changedPath => {
        console.log(`[API 文档输入变化] ${changedPath}`)
        queue.request()
    })

    queue.request()
    try {
        await queue.flush()
    } catch (error) {
        closeWatchers()
        queue.close()
        throw error
    }
    await startDevServer(REPOSITORY_ROOT, closeWatchers, queue, process.argv.slice(2))
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    main().catch(error => {
        console.error(error instanceof Error ? error.message : error)
        process.exitCode = 1
    })
}
