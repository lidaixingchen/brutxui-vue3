import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { createReadStream } from 'node:fs'
import { cp, lstat, mkdir, mkdtemp, readFile, readdir, rmdir, stat, unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, extname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { brotliCompressSync, gzipSync } from 'node:zlib'
import { once } from 'node:events'
import { chromium } from 'playwright'
import {
    BROWSER_PROFILES,
    CONSUMER_OPTIONAL_PEER_PACKAGES,
    CONSUMER_TOOLCHAIN_PACKAGES,
    CONSUMER_UI_PEER_PACKAGES,
    COST_PROFILE_VERSION,
    COST_SCENARIOS,
    LOCKED_PACKAGE_NAMES,
    MEASUREMENT_PROFILE,
} from './cost-profile.js'

type CostScenario = (typeof COST_SCENARIOS)[number]
type BrowserProfile = (typeof BROWSER_PROFILES)[number]

interface MetricTotals {
    rawBytes: number
    gzipBytes: number
    brotliBytes: number
}

interface FileMetric {
    file: string
    type: 'js' | 'css'
    rawBytes: number
    gzipBytes: number
    brotliBytes: number
}

interface ClosureMetric {
    files: string[]
    rawBytes: number
    gzipBytes: number
    brotliBytes: number
    js: MetricTotals
    css: MetricTotals
}

interface ByteDelta {
    rawBytes: number
    gzipBytes: number
    brotliBytes: number
    js: MetricTotals
    css: MetricTotals
}

interface BundleRecord {
    id: string
    component: string | null
    importPath: string | null
    dynamic: boolean
    outDir: string
    manifestPath: string
    files: FileMetric[]
    staticClosure: ClosureMetric
    dynamicClosure: ClosureMetric
    deltaFromEmpty?: {
        staticClosure: ByteDelta
        dynamicClosure: ByteDelta
    }
}

interface ResourceSnapshot {
    timers: {
        activeIntervals: number
        activeTimeouts: number
        intervalsCreated: number
        intervalsCleared: number
        timeoutsCreated: number
        timeoutsCleared: number
    }
    media: {
        activeChangeListeners: number
        listenersAdded: number
        listenersRemoved: number
    }
    text: {
        textReads: number
        dataTextWrites: number
    }
}

interface BrowserSample {
    mountMs: number
    updateMs: number
    unmountMs: number
    afterMount: ResourceSnapshot
    afterSettle: ResourceSnapshot
    beforeUnmount: ResourceSnapshot
    afterUnmount: ResourceSnapshot
    afterDeactivate?: ResourceSnapshot
    afterActivate?: ResourceSnapshot
}

interface BrowserRecord {
    id: string
    effect: BrowserProfile['effect']
    trigger: BrowserProfile['trigger']
    reducedMotion: BrowserProfile['reducedMotion']
    lifecycle: BrowserProfile['lifecycle']
    url: string
    samples: BrowserSample[]
    styles: { display: string; borderWidth: string; borderToken: string; borderStyle: string; boxShadow: string; valid: boolean }
    summary: {
        mountMs: PercentileSummary
        updateMs: PercentileSummary
        unmountMs: PercentileSummary
    }
    resourceChecks: {
        afterUnmountHasNoActiveResources: boolean
        expectedResourcesMatch: boolean
        afterSettleSnapshots: ResourceSnapshot[]
    }
}

interface PercentileSummary {
    count: number
    minMs: number
    p50Ms: number
    p95Ms: number
    maxMs: number
}

interface RunnerOptions {
    artifactPath: string
    outputDir: string
    scenarioIds: string[]
    skipBrowser: boolean
    keepFixture: boolean
    assertResources: boolean
}

const PERF_DIR = dirname(fileURLToPath(import.meta.url))
const UI_DIR = resolve(PERF_DIR, '..')
const REPO_ROOT = resolve(UI_DIR, '../..')
const SOURCE_LOCK_PATH = join(REPO_ROOT, 'pnpm-lock.yaml')
const SOURCE_PACKAGE_JSON_PATH = join(REPO_ROOT, 'package.json')
const ARTIFACT_INTEGRITY_PLACEHOLDER = '__BRUTX_ARTIFACT_INTEGRITY__'
const DEFAULT_OUTPUT_DIR = join(PERF_DIR, '.cache', 'cost-current')
const FIXED_FIXTURE_LOCK_PATH = join(PERF_DIR, 'fixtures', 'consumer-lock.yaml')
const FIXTURE_PACKAGE_NAME = 'brutx-cost-consumer'
const FIXTURE_ARTIFACT_DIR = 'artifacts'
const FIXTURE_ARTIFACT_NAME = 'brutx-ui-vue.tgz'
const FIXTURE_SRC_DIR = 'src'
const FIXTURE_DIST_DIR = 'dist'
const MANIFEST_CANDIDATE_PATHS = ['.vite/manifest.json', 'manifest.json']
const HTTP_FILE_TYPES: Record<string, string> = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
}
const PNPM_EXECUTABLE = (() => {
    const home = process.env.PNPM_HOME
    if (home) {
        const candidate = join(home, 'pnpm')
        try {
            execFileSync(candidate, ['--version'], { stdio: 'ignore' })
            return candidate
        } catch {
            return 'pnpm'
        }
    }
    try {
        return execFileSync('/bin/zsh', ['-lc', 'command -v pnpm'], { encoding: 'utf8' }).trim()
    } catch {
        return 'pnpm'
    }
})()

function parseArgs(argv: string[]): RunnerOptions {
    const options: RunnerOptions = {
        artifactPath: '',
        outputDir: DEFAULT_OUTPUT_DIR,
        scenarioIds: [],
        skipBrowser: false,
        keepFixture: false,
        assertResources: false,
    }

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index]
        if (arg === '--artifact') {
            options.artifactPath = resolve(argv[++index] ?? '')
        } else if (arg === '--output') {
            options.outputDir = resolve(argv[++index] ?? '')
        } else if (arg === '--scenario') {
            options.scenarioIds.push(argv[++index] ?? '')
        } else if (arg === '--skip-browser') {
            options.skipBrowser = true
        } else if (arg === '--keep-fixture') {
            options.keepFixture = true
        } else if (arg === '--assert-resources') {
            options.assertResources = true
        } else if (arg === '--help') {
            printUsage()
            process.exit(0)
        } else {
            throw new Error(`未知参数：${arg}`)
        }
    }

    if (!options.artifactPath) throw new Error('必须通过 --artifact 指定待测 tarball')
    return options
}

function printUsage(): void {
    console.log(`用法：
  node --import tsx/esm perf/cost-runner.ts [选项]

选项：
  --artifact <path>    已打包的 brutx-ui-vue tarball
  --output <path>     ignored 原始结果目录
  --scenario <id>     只运行一个场景，可重复传入
  --skip-browser      只构建并分析 JS/CSS 闭包
  --keep-fixture      保留临时消费者目录以便排查
  --assert-resources  对候选包启用确定性资源断言
  --help              显示帮助`)
}

function hashBuffer(buffer: Uint8Array): string {
    return createHash('sha256').update(buffer).digest('hex')
}

async function sha256File(filePath: string): Promise<string> {
    return hashBuffer(await readFile(filePath))
}

function runGit(args: string[]): string {
    return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' }).trim()
}

function runPnpm(fixtureRoot: string, args: string[], allowFailure = false): string {
    const env = {
        ...process.env,
        CI: 'true',
        NODE_PATH: '',
        npm_config_ignore_scripts: 'true',
        pnpm_config_enable_global_virtual_store: 'false',
        pnpm_config_verify_deps_before_run: 'error',
    }
    const result = spawnSync(PNPM_EXECUTABLE, args, {
        cwd: fixtureRoot,
        env,
        encoding: 'utf8',
        maxBuffer: 32 * 1024 * 1024,
    })
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
    if (!allowFailure && result.status !== 0) {
        throw new Error(`pnpm ${args.join(' ')} 失败（${result.status ?? 'signal'}）\n${output}`)
    }
    return output
}

function runNode(cwd: string, args: string[]): string {
    const result = spawnSync(process.execPath, args, {
        cwd,
        env: { ...process.env, NODE_PATH: '' },
        encoding: 'utf8',
        maxBuffer: 32 * 1024 * 1024,
    })
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
    if (result.status !== 0) {
        throw new Error(`${process.execPath} ${args.join(' ')} 失败（${result.status ?? 'signal'}）\n${output}`)
    }
    return output
}

function readLockedVersions(lockText: string): Record<string, string> {
    const lines = lockText.split('\n')
    const importerStart = lines.findIndex(line => line === '  packages/ui:')
    if (importerStart < 0) throw new Error('pnpm-lock.yaml 缺少 packages/ui importer')

    const versions: Record<string, string> = {}
    const names = new Set<string>(LOCKED_PACKAGE_NAMES)
    for (let index = importerStart + 1; index < lines.length; index += 1) {
        const line = lines[index]
        if (line.length > 0 && !line.startsWith('    ') && line.trim() !== '') break
        const match = line.match(/^(?: {6})(?:'([^']+)'|"([^"]+)"|([^:]+)):\s*$/)
        if (!match) continue
        const name = match[1] ?? match[2] ?? match[3]
        if (!names.has(name)) continue
        for (let next = index + 1; next < lines.length; next += 1) {
            const nextLine = lines[next]
            if (/^(?: {6})\S/.test(nextLine) || /^(?: {4})\S/.test(nextLine)) break
            const versionMatch = nextLine.match(/^(?: {8})version:\s*([^\s(]+)/)
            if (versionMatch) {
                versions[name] = versionMatch[1]
                break
            }
        }
    }

    const missing = LOCKED_PACKAGE_NAMES.filter((name: string) => !versions[name])
    if (missing.length > 0) throw new Error(`无法从 packages/ui lock importer 解析版本：${missing.join(', ')}`)
    return versions
}

function assertLockedProfile(lockedVersions: Record<string, string>): void {
    const expected = { ...CONSUMER_TOOLCHAIN_PACKAGES, ...CONSUMER_UI_PEER_PACKAGES }
    for (const [name, expectedVersion] of Object.entries(expected)) {
        if (lockedVersions[name] !== expectedVersion) {
            throw new Error(`成本 profile 版本与当前 lock 不一致：${name} 期望 ${expectedVersion}，实际 ${lockedVersions[name]}`)
        }
    }
}

function packageJsonForFixture(artifactRelativePath: string, packageManager: string): Record<string, unknown> {
    return {
        name: FIXTURE_PACKAGE_NAME,
        private: true,
        type: 'module',
        packageManager,
        dependencies: {
            'brutx-ui-vue': artifactRelativePath,
            ...CONSUMER_UI_PEER_PACKAGES,
        },
        devDependencies: Object.fromEntries(
            Object.entries(CONSUMER_TOOLCHAIN_PACKAGES).filter(([name]) => name !== 'vue'),
        ),
    }
}

async function createFixture(artifactPath: string, outputDir: string): Promise<{
    root: string
    lockPath: string
    lockHash: string
    packageJsonHash: string
    packageManager: string
}> {
    const fixtureRoot = await mkdtemp(join(tmpdir(), 'brutx-ui-r2-consumer-'))
    const artifactDir = join(fixtureRoot, FIXTURE_ARTIFACT_DIR)
    await mkdir(artifactDir, { recursive: true })
    const artifactTarget = join(artifactDir, FIXTURE_ARTIFACT_NAME)
    await cp(artifactPath, artifactTarget)

    const sourcePackageJson = JSON.parse(await readFile(SOURCE_PACKAGE_JSON_PATH, 'utf8')) as { packageManager?: string }
    if (!sourcePackageJson.packageManager?.startsWith('pnpm@')) throw new Error('根 package.json 缺少 pnpm packageManager')
    const packageJson = JSON.stringify(
        packageJsonForFixture(`./${FIXTURE_ARTIFACT_DIR}/${FIXTURE_ARTIFACT_NAME}`, sourcePackageJson.packageManager),
        null,
        4,
    )
    const packageJsonPath = join(fixtureRoot, 'package.json')
    await writeFile(packageJsonPath, `${packageJson}\n`, 'utf8')

    const lockPath = join(fixtureRoot, 'pnpm-lock.yaml')
    const lockTemplate = await readFile(FIXED_FIXTURE_LOCK_PATH, 'utf8')
    if (lockTemplate.split(ARTIFACT_INTEGRITY_PLACEHOLDER).length !== 2) {
        throw new Error('消费者锁文件必须包含一个候选产物摘要占位符')
    }
    const artifactIntegrity = `sha512-${createHash('sha512').update(await readFile(artifactTarget)).digest('base64')}`
    await writeFile(lockPath, lockTemplate.replace(ARTIFACT_INTEGRITY_PLACEHOLDER, artifactIntegrity))
    runPnpm(fixtureRoot, ['install', '--frozen-lockfile', '--ignore-scripts'])

    const lockText = await readFile(lockPath, 'utf8')
    await mkdir(outputDir, { recursive: true })
    await writeFile(join(outputDir, 'fixture-package.json'), `${packageJson}\n`, 'utf8')
    const lockSnapshotPath = join(outputDir, 'fixture-pnpm-lock.yaml')
    await writeFile(lockSnapshotPath, lockText, 'utf8')
    const packageManager = (JSON.parse(packageJson) as { packageManager: string }).packageManager
    return {
        root: fixtureRoot,
        lockPath: lockSnapshotPath,
        lockHash: hashBuffer(Buffer.from(lockText)),
        packageJsonHash: hashBuffer(Buffer.from(`${packageJson}\n`)),
        packageManager,
    }
}

function cssForScenario(scenario: CostScenario): string {
    const consumerSources = '@import "tailwindcss" source(none);\n@source "./";\n'
    return scenario.component === null
        ? consumerSources
        : `${consumerSources}@import "brutx-ui-vue/style.css";\n`
}

function appScriptForScenario(scenario: CostScenario): string {
    if (scenario.component === null) {
        return `<script setup lang="ts">
import { ref } from 'vue'

const label = ref('Empty consumer')
;(window as any).__brutxSetLabel = (value: string) => { label.value = value }
</script>

<template>
    <main id="bench-root"><span id="bench-value">{{ label }}</span></main>
</template>
`
    }

    const importExpression = scenario.dynamic
        ? `defineAsyncComponent(() => import('${scenario.importPath}').then(module => module.${scenario.component}))`
        : `ImportedComponent`
    const staticImport = scenario.dynamic
        ? ''
        : `import { ${scenario.component} as ImportedComponent } from '${scenario.importPath}'`
    const props = scenario.component === 'Button'
        ? `
const query = new URLSearchParams(window.location.search)
const effect = query.get('effect') === 'glitch' ? 'glitch' : 'none'
const trigger = query.get('trigger') === 'autoplay' ? 'autoplay' : 'none'
const interval = Number(query.get('interval') ?? '${MEASUREMENT_PROFILE.autoplayIntervalMs}')
const keepAlive = query.get('lifecycle') === 'keep-alive'
const buttonVisible = ref(true)
`
        : ''
    const buttonMarkup = `<component
            :is="BenchComponent"
            id="bench-button"
            :effect="effect"
            :glitch-trigger="trigger"
            :glitch-interval="interval"
        >{{ label }}</component>`
    const keepAliveButtonMarkup = buttonMarkup.replace('<component', '<component v-if="buttonVisible"')
    const standardButtonMarkup = buttonMarkup.replace('<component', '<component v-else')
    const template = scenario.component === 'Button'
        ? `<KeepAlive v-if="keepAlive">${keepAliveButtonMarkup}</KeepAlive>${standardButtonMarkup}`
        : scenario.component === 'Input'
            ? `<component :is="BenchComponent" id="bench-input" v-model="label" />`
            : scenario.component === 'DataTable'
                ? `<component :is="BenchComponent" id="bench-data-table" :data="rows" :columns="columns" row-key="id" />`
                : `<component :is="BenchComponent" id="bench-glitch-text" text="Baseline glitch text" trigger="none" />`
    const dataTableState = scenario.component === 'DataTable'
        ? `
const rows = [{ id: 1, name: 'one' }, { id: 2, name: 'two' }]
const columns = [
    { id: 'id', header: 'ID', accessorKey: 'id' },
    { id: 'name', header: 'Name', accessorKey: 'name' },
]
`
        : ''

    const buttonController = scenario.component === 'Button'
        ? `
;(window as any).__brutxSetButtonVisible = (value: boolean) => { buttonVisible.value = value }
`
        : ''

    return `<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue'
${staticImport}

const label = ref('Baseline component')
const BenchComponent = ${importExpression}
${props}${dataTableState}${buttonController}
;(window as any).__brutxSetLabel = (value: string) => { label.value = value }
</script>

<template>
    <main id="bench-root">
        ${template}
        <span id="bench-value">{{ label }}</span>
    </main>
</template>
`
}

function instrumentationSource(): string {
    return `
type CostMetrics = {
    reset: () => void
    snapshot: () => unknown
}

const state = {
    intervalsCreated: 0,
    intervalsCleared: 0,
    timeoutsCreated: 0,
    timeoutsCleared: 0,
    listenersAdded: 0,
    listenersRemoved: 0,
    textReads: 0,
    dataTextWrites: 0,
}
const activeIntervals = new Set<number>()
const activeTimeouts = new Set<number>()
const mediaListeners = new Map<MediaQueryList, Set<EventListenerOrEventListenerObject>>()
const nativeSetInterval = window.setInterval.bind(window)
const nativeClearInterval = window.clearInterval.bind(window)
const nativeSetTimeout = window.setTimeout.bind(window)
const nativeClearTimeout = window.clearTimeout.bind(window)
const nativeMatchMedia = window.matchMedia.bind(window)

function resetCounters() {
    state.intervalsCreated = 0
    state.intervalsCleared = 0
    state.timeoutsCreated = 0
    state.timeoutsCleared = 0
    state.listenersAdded = 0
    state.listenersRemoved = 0
    state.textReads = 0
    state.dataTextWrites = 0
}

;(window as any).setInterval = ((handler: TimerHandler, timeout?: number, ...args: any[]) => {
    state.intervalsCreated += 1
    const id = nativeSetInterval(handler, timeout, ...args) as unknown as number
    activeIntervals.add(id)
    return id
}) as typeof window.setInterval

;(window as any).clearInterval = ((id?: number) => {
    if (id !== undefined && activeIntervals.delete(id)) state.intervalsCleared += 1
    nativeClearInterval(id)
}) as typeof window.clearInterval

;(window as any).setTimeout = ((handler: TimerHandler, timeout?: number, ...args: any[]) => {
    state.timeoutsCreated += 1
    let id = 0
    const wrapped = (...callbackArgs: any[]) => {
        activeTimeouts.delete(id)
        handler instanceof Function ? handler(...callbackArgs) : Function(handler)()
    }
    id = nativeSetTimeout(wrapped, timeout, ...args) as unknown as number
    activeTimeouts.add(id)
    return id
}) as typeof window.setTimeout

;(window as any).clearTimeout = ((id?: number) => {
    if (id !== undefined && activeTimeouts.delete(id)) state.timeoutsCleared += 1
    nativeClearTimeout(id)
}) as typeof window.clearTimeout

;(window as any).matchMedia = ((query: string) => {
    const mediaQuery = nativeMatchMedia(query)
    if (mediaListeners.has(mediaQuery)) return mediaQuery
    const listeners = new Set<EventListenerOrEventListenerObject>()
    mediaListeners.set(mediaQuery, listeners)
    const nativeAdd = mediaQuery.addEventListener.bind(mediaQuery)
    const nativeRemove = mediaQuery.removeEventListener.bind(mediaQuery)
    mediaQuery.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
        if (type === 'change' && !listeners.has(listener)) {
            listeners.add(listener)
            state.listenersAdded += 1
        }
        nativeAdd(type, listener, options)
    }) as typeof mediaQuery.addEventListener
    mediaQuery.removeEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) => {
        if (type === 'change' && listeners.delete(listener)) state.listenersRemoved += 1
        nativeRemove(type, listener, options)
    }) as typeof mediaQuery.removeEventListener
    return mediaQuery
}) as typeof window.matchMedia

const textDescriptor = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent')
if (textDescriptor?.get && textDescriptor.set) {
    Object.defineProperty(Node.prototype, 'textContent', {
        configurable: textDescriptor.configurable,
        enumerable: textDescriptor.enumerable,
        get() {
            if ((this as HTMLElement).id === 'bench-button') state.textReads += 1
            return textDescriptor.get!.call(this)
        },
        set(value: string | null) {
            textDescriptor.set!.call(this, value)
        },
    })
}

const nativeSetAttribute = Element.prototype.setAttribute
Element.prototype.setAttribute = function(name: string, value: string) {
    if (this.id === 'bench-button' && name === 'data-text') state.dataTextWrites += 1
    return nativeSetAttribute.call(this, name, value)
}

function activeMediaListenerCount() {
    let count = 0
    for (const listeners of mediaListeners.values()) count += listeners.size
    return count
}

const metrics: CostMetrics = {
    reset: resetCounters,
    snapshot: () => ({
        timers: {
            activeIntervals: activeIntervals.size,
            activeTimeouts: activeTimeouts.size,
            intervalsCreated: state.intervalsCreated,
            intervalsCleared: state.intervalsCleared,
            timeoutsCreated: state.timeoutsCreated,
            timeoutsCleared: state.timeoutsCleared,
        },
        media: {
            activeChangeListeners: activeMediaListenerCount(),
            listenersAdded: state.listenersAdded,
            listenersRemoved: state.listenersRemoved,
        },
        text: {
            textReads: state.textReads,
            dataTextWrites: state.dataTextWrites,
        },
    }),
}
;(window as any).__brutxCostMetrics = metrics
`
}

function mainSource(): string {
    return `import './instrumentation'
import { createApp, nextTick } from 'vue'
import App from './App.vue'

const root = document.querySelector('#app')
if (!root) throw new Error('缺少 #app 宿主')
let app: ReturnType<typeof createApp> | null = null

;(window as any).__brutxCostController = {
    async mount() {
        if (!app) app = createApp(App)
        app.mount(root)
        await nextTick()
        await nextTick()
    },
    async update(value: string) {
        const setter = (window as any).__brutxSetLabel
        if (typeof setter !== 'function') throw new Error('组件尚未完成 setup')
        setter(value)
        await nextTick()
        await nextTick()
    },
    async deactivate() {
        const setter = (window as any).__brutxSetButtonVisible
        if (typeof setter !== 'function') throw new Error('成本 fixture 未启用 KeepAlive Button')
        setter(false)
        await nextTick()
        await nextTick()
    },
    async activate() {
        const setter = (window as any).__brutxSetButtonVisible
        if (typeof setter !== 'function') throw new Error('成本 fixture 未启用 KeepAlive Button')
        setter(true)
        await nextTick()
        await nextTick()
    },
    async unmount() {
        app?.unmount()
        app = null
        await nextTick()
    },
}
`
}

async function writeScenarioSource(fixtureRoot: string, scenario: CostScenario): Promise<void> {
    const srcDir = join(fixtureRoot, FIXTURE_SRC_DIR)
    await mkdir(srcDir, { recursive: true })
    await writeFile(join(fixtureRoot, 'index.html'), '<!doctype html>\n<html><body><div id="app"></div><script type="module" src="/src/main.ts"></script></body></html>\n', 'utf8')
    await writeFile(join(srcDir, 'instrumentation.ts'), instrumentationSource(), 'utf8')
    await writeFile(join(srcDir, 'App.vue'), appScriptForScenario(scenario), 'utf8')
    await writeFile(join(srcDir, 'bench.css'), cssForScenario(scenario), 'utf8')
    await writeFile(join(srcDir, 'main.ts'), `${mainSource()}\nimport './bench.css'\n`, 'utf8')
}

function viteConfigSource(outDir: string): string {
    const escapedOutDir = JSON.stringify(outDir)
    return `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [vue(), tailwindcss()],
    build: {
        outDir: ${escapedOutDir},
        emptyOutDir: true,
        manifest: 'manifest.json',
        sourcemap: false,
        cssCodeSplit: true,
    },
})
`
}

async function buildScenario(fixtureRoot: string, scenario: CostScenario, outputDir: string): Promise<BundleRecord> {
    await writeScenarioSource(fixtureRoot, scenario)
    const scenarioOutDir = join(outputDir, 'bundles', scenario.id)
    await mkdir(scenarioOutDir, { recursive: true })
    const fixtureOutDir = join(fixtureRoot, FIXTURE_DIST_DIR, scenario.id)
    const configPath = join(fixtureRoot, 'vite.config.mjs')
    await writeFile(configPath, viteConfigSource(join(FIXTURE_DIST_DIR, scenario.id)), 'utf8')
    const vitePath = join(fixtureRoot, 'node_modules', 'vite', 'bin', 'vite.js')
    const buildOutput = runNode(fixtureRoot, [vitePath, 'build', '--config', configPath])
    await writeFile(join(outputDir, 'build-logs', `${scenario.id}.log`), buildOutput, 'utf8')
    await cp(fixtureOutDir, scenarioOutDir, { recursive: true })

    const manifestPath = await findManifest(scenarioOutDir)
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Record<string, ManifestEntry>
    const files = await collectFileMetrics(scenarioOutDir)
    const fileMap = new Map(files.map(file => [file.file, file]))
    const entryKey = findManifestEntryKey(manifest, 'index.html')
    if (!entryKey) throw new Error(`${scenario.id} manifest 缺少 index.html entry`)
    const staticFiles = collectStaticClosure(manifest, entryKey)
    const dynamicFiles = collectDynamicClosure(manifest, entryKey)
    return {
        id: scenario.id,
        component: scenario.component,
        importPath: scenario.importPath,
        dynamic: scenario.dynamic,
        outDir: scenarioOutDir,
        manifestPath,
        files,
        staticClosure: closureMetrics(staticFiles, fileMap),
        dynamicClosure: closureMetrics(dynamicFiles, fileMap),
    }
}

interface ManifestEntry {
    file: string
    src?: string
    isEntry?: boolean
    isDynamicEntry?: boolean
    imports?: string[]
    dynamicImports?: string[]
    css?: string[]
}

async function findManifest(outDir: string): Promise<string> {
    for (const candidate of MANIFEST_CANDIDATE_PATHS) {
        const path = join(outDir, candidate)
        try {
            await stat(path)
            return path
        } catch {
            continue
        }
    }
    throw new Error(`构建目录缺少 Vite manifest：${outDir}`)
}

function findManifestEntryKey(manifest: Record<string, ManifestEntry>, sourceName: string): string | undefined {
    return Object.keys(manifest).find(key => key === sourceName || key.endsWith(`/${sourceName}`))
        ?? Object.keys(manifest).find(key => manifest[key]?.isEntry)
}

function collectStaticClosure(manifest: Record<string, ManifestEntry>, entryKey: string): string[] {
    const files = new Set<string>()
    const visitedKeys = new Set<string>()
    const visit = (key: string) => {
        if (visitedKeys.has(key)) return
        visitedKeys.add(key)
        const entry = manifest[key]
        if (!entry) return
        files.add(entry.file)
        for (const css of entry.css ?? []) files.add(css)
        for (const imported of entry.imports ?? []) visit(imported)
    }
    visit(entryKey)
    return [...files].sort()
}

function collectDynamicClosure(manifest: Record<string, ManifestEntry>, entryKey: string): string[] {
    const files = new Set<string>()
    const visitedKeys = new Set<string>()
    const visit = (key: string) => {
        if (visitedKeys.has(key)) return
        visitedKeys.add(key)
        const entry = manifest[key]
        if (!entry) return
        files.add(entry.file)
        for (const css of entry.css ?? []) files.add(css)
        for (const imported of entry.imports ?? []) visit(imported)
        for (const nested of entry.dynamicImports ?? []) visit(nested)
    }
    for (const dynamic of manifest[entryKey]?.dynamicImports ?? []) visit(dynamic)
    return [...files].sort()
}

async function collectFileMetrics(outDir: string): Promise<FileMetric[]> {
    const files: FileMetric[] = []
    const visit = async (directory: string) => {
        for (const name of await readdir(directory, { withFileTypes: true })) {
            const path = join(directory, name.name)
            if (name.isDirectory()) {
                await visit(path)
                continue
            }
            const type = extname(name.name) === '.js' ? 'js' : extname(name.name) === '.css' ? 'css' : null
            if (!type) continue
            const content = await readFile(path)
            files.push({
                file: relative(outDir, path).replaceAll('\\', '/'),
                type,
                rawBytes: content.byteLength,
                gzipBytes: gzipSync(content, { level: MEASUREMENT_PROFILE.compressionLevel }).byteLength,
                brotliBytes: brotliCompressSync(content).byteLength,
            })
        }
    }
    await visit(outDir)
    return files.sort((left, right) => left.file.localeCompare(right.file))
}

function closureMetrics(paths: string[], fileMap: Map<string, FileMetric>): ClosureMetric {
    const missing = paths.filter(path => !fileMap.has(path))
    if (missing.length > 0) throw new Error(`manifest closure 缺少构建文件：${missing.join(', ')}`)
    const files = paths.filter(path => fileMap.has(path)).sort()
    const totalsFor = (type: FileMetric['type']): MetricTotals => {
        const typedFiles = files.filter(path => fileMap.get(path)!.type === type)
        return {
            rawBytes: typedFiles.reduce((sum, path) => sum + fileMap.get(path)!.rawBytes, 0),
            gzipBytes: typedFiles.reduce((sum, path) => sum + fileMap.get(path)!.gzipBytes, 0),
            brotliBytes: typedFiles.reduce((sum, path) => sum + fileMap.get(path)!.brotliBytes, 0),
        }
    }
    return {
        files,
        rawBytes: files.reduce((sum, path) => sum + fileMap.get(path)!.rawBytes, 0),
        gzipBytes: files.reduce((sum, path) => sum + fileMap.get(path)!.gzipBytes, 0),
        brotliBytes: files.reduce((sum, path) => sum + fileMap.get(path)!.brotliBytes, 0),
        js: totalsFor('js'),
        css: totalsFor('css'),
    }
}

function metricDelta(left: MetricTotals, right: MetricTotals): MetricTotals {
    return {
        rawBytes: left.rawBytes - right.rawBytes,
        gzipBytes: left.gzipBytes - right.gzipBytes,
        brotliBytes: left.brotliBytes - right.brotliBytes,
    }
}

function byteDelta(left: ClosureMetric, right: ClosureMetric): ByteDelta {
    return {
        rawBytes: left.rawBytes - right.rawBytes,
        gzipBytes: left.gzipBytes - right.gzipBytes,
        brotliBytes: left.brotliBytes - right.brotliBytes,
        js: metricDelta(left.js, right.js),
        css: metricDelta(left.css, right.css),
    }
}

function percentile(values: number[], fraction: number): number {
    if (values.length === 0) return 0
    const sorted = [...values].sort((left, right) => left - right)
    const position = (sorted.length - 1) * fraction
    const lower = Math.floor(position)
    const upper = Math.ceil(position)
    if (lower === upper) return Number(sorted[lower].toFixed(4))
    const value = sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower)
    return Number(value.toFixed(4))
}

function summarize(values: number[]): PercentileSummary {
    return {
        count: values.length,
        minMs: Number(Math.min(...values).toFixed(4)),
        p50Ms: percentile(values, 0.5),
        p95Ms: percentile(values, 0.95),
        maxMs: Number(Math.max(...values).toFixed(4)),
    }
}

function browserExecutablePath(): string {
    const configured = process.env.BRUTX_CHROMIUM_EXECUTABLE
    if (configured) return configured
    const candidates = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
    ]
    const found = [...candidates, chromium.executablePath()].find(candidate => {
        try {
            execFileSync('test', ['-x', candidate])
            return true
        } catch {
            return false
        }
    })
    if (!found) throw new Error('找不到 Chromium；设置 BRUTX_CHROMIUM_EXECUTABLE 指向现有 Chromium 可执行文件')
    return found
}

function chromiumVersion(executablePath: string): string {
    try {
        return execFileSync(executablePath, ['--version'], { encoding: 'utf8' }).trim()
    } catch {
        return 'unknown'
    }
}

function httpPath(urlPath: string): string {
    const decoded = decodeURIComponent(urlPath.split('?')[0] || '/')
    return decoded === '/' ? '/index.html' : decoded
}

async function serveDirectory(root: string): Promise<{ server: ReturnType<typeof createServer>; url: string }> {
    const server = createServer(async (request: IncomingMessage, response: ServerResponse) => {
        try {
            const relativePath = httpPath(request.url ?? '/')
            const filePath = resolve(root, `.${relativePath}`)
            const rootPrefix = `${resolve(root)}${sep}`
            if (filePath !== resolve(root) && !filePath.startsWith(rootPrefix)) {
                response.writeHead(403).end('forbidden')
                return
            }
            const fileStat = await stat(filePath)
            if (!fileStat.isFile()) {
                response.writeHead(404).end('not found')
                return
            }
            response.writeHead(200, {
                'Cache-Control': 'no-store',
                'Content-Type': HTTP_FILE_TYPES[extname(filePath)] ?? 'application/octet-stream',
            })
            createReadStream(filePath).pipe(response)
        } catch {
            response.writeHead(404).end('not found')
        }
    })
    server.listen(MEASUREMENT_PROFILE.serverPort, '127.0.0.1')
    await once(server, 'listening')
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('无法获取成本 fixture HTTP 端口')
    return { server, url: `http://127.0.0.1:${address.port}` }
}

function isZeroResourceSnapshot(snapshot: ResourceSnapshot): boolean {
    return snapshot.timers.activeIntervals === 0
        && snapshot.timers.activeTimeouts === 0
        && snapshot.media.activeChangeListeners === 0
}

interface ResourceExpectation {
    activeIntervals: number
    activeTimeouts: number
    activeChangeListeners: number
    textReads?: number
    dataTextWrites?: number
}

interface BrowserResourceExpectations {
    afterSettle: ResourceExpectation
    afterDeactivate?: ResourceExpectation
    afterActivate?: ResourceExpectation
    afterUnmount: ResourceExpectation
}

function matchesResourceExpectation(
    snapshot: ResourceSnapshot | undefined,
    expectation: ResourceExpectation | undefined,
): boolean {
    if (!expectation) return true
    if (!snapshot) return false
    return snapshot.timers.activeIntervals === expectation.activeIntervals
        && snapshot.timers.activeTimeouts === expectation.activeTimeouts
        && snapshot.media.activeChangeListeners === expectation.activeChangeListeners
        && (expectation.textReads === undefined || snapshot.text.textReads === expectation.textReads)
        && (expectation.dataTextWrites === undefined || snapshot.text.dataTextWrites === expectation.dataTextWrites)
}

function matchesBrowserResourceExpectations(
    sample: BrowserSample,
    profile: BrowserProfile & { expected: BrowserResourceExpectations },
): boolean {
    return matchesResourceExpectation(sample.afterSettle, profile.expected.afterSettle)
        && matchesResourceExpectation(sample.afterDeactivate, profile.expected.afterDeactivate)
        && matchesResourceExpectation(sample.afterActivate, profile.expected.afterActivate)
        && matchesResourceExpectation(sample.afterUnmount, profile.expected.afterUnmount)
}

async function clearOutputArtifacts(outputDir: string): Promise<void> {
    await mkdir(outputDir, { recursive: true })
    for (const name of ['bundles', 'build-logs', 'cost-baseline.json', 'fixture-package.json']) {
        await removeFixturePath(join(outputDir, name))
    }
}

async function removeFixturePath(filePath: string): Promise<void> {
    let info
    try {
        info = await lstat(filePath)
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return
        throw error
    }
    if (info.isDirectory()) {
        for (const name of await readdir(filePath)) await removeFixturePath(join(filePath, name))
        await rmdir(filePath)
    } else {
        await unlink(filePath)
    }
}

async function measureBrowserProfile(
    baseUrl: string,
    profile: BrowserProfile,
): Promise<BrowserRecord> {
    const executablePath = browserExecutablePath()
    const browser = await chromium.launch({ headless: true, executablePath })
    try {
        const page = await browser.newPage()
        await page.emulateMedia({ reducedMotion: profile.reducedMotion })
        const url = `${baseUrl}/?effect=${profile.effect}&trigger=${profile.trigger}&lifecycle=${profile.lifecycle}&interval=${MEASUREMENT_PROFILE.autoplayIntervalMs}`
        await page.goto(url, { waitUntil: 'load' })
        await page.waitForFunction('typeof window.__brutxCostController?.mount === "function"')

        const styles = await page.evaluate(`(async () => {
            const controller = window.__brutxCostController
            await controller.mount()
            const style = getComputedStyle(document.querySelector('#bench-button'))
            const result = {
                display: style.display,
                borderWidth: style.borderTopWidth,
                borderToken: style.getPropertyValue('--brutal-border-width').trim(),
                borderStyle: style.borderTopStyle,
                boxShadow: style.boxShadow,
            }
            await controller.unmount()
            return { ...result, valid: result.display === 'inline-flex'
                && result.borderStyle === 'solid' && Number.parseFloat(result.borderToken) > 0
                && Number.parseFloat(result.borderWidth) === Number.parseFloat(result.borderToken)
                && result.boxShadow !== 'none' }
        })()`) as BrowserRecord['styles']

        const runCycleScript = `async ({ sampleIndex, settleMs, frameCount, keepAlive }) => {
            const controller = window.__brutxCostController
            const metrics = window.__brutxCostMetrics
            const waitFrames = async () => {
                for (let index = 0; index < frameCount; index += 1) {
                    await new Promise(resolve => requestAnimationFrame(() => resolve()))
                }
            }
            const waitMs = duration => new Promise(resolve => window.setTimeout(resolve, duration))
            metrics.reset()
            const mountStart = performance.now()
            await controller.mount()
            const mountMs = performance.now() - mountStart
            const afterMount = metrics.snapshot()
            if (settleMs > 0) await waitMs(settleMs)
            const afterSettle = metrics.snapshot()
            let afterDeactivate
            let afterActivate
            if (keepAlive) {
                await controller.deactivate()
                await waitFrames()
                afterDeactivate = metrics.snapshot()
                await controller.activate()
                await waitFrames()
                afterActivate = metrics.snapshot()
            }
            const updateStart = performance.now()
            await controller.update('Updated label ' + sampleIndex)
            const updateMs = performance.now() - updateStart
            await waitFrames()
            const beforeUnmount = metrics.snapshot()
            const unmountStart = performance.now()
            await controller.unmount()
            const unmountMs = performance.now() - unmountStart
            await waitFrames()
            const afterUnmount = metrics.snapshot()
            return { mountMs, updateMs, unmountMs, afterMount, afterSettle, beforeUnmount, afterUnmount, afterDeactivate, afterActivate }
        }`
        const runCycle = async (sampleIndex: number): Promise<BrowserSample> => {
            const payload = JSON.stringify({
                sampleIndex,
                settleMs: profile.trigger === 'autoplay' ? MEASUREMENT_PROFILE.autoplaySettleMs : 0,
                frameCount: MEASUREMENT_PROFILE.animationFrameCount,
                keepAlive: profile.lifecycle === 'keep-alive',
            })
            return page.evaluate(`(${runCycleScript})(${payload})`) as Promise<BrowserSample>
        }

        for (let index = 0; index < MEASUREMENT_PROFILE.warmupIterations; index += 1) await runCycle(index)
        const samples: BrowserSample[] = []
        for (let index = 0; index < MEASUREMENT_PROFILE.measuredIterations; index += 1) {
            samples.push(await runCycle(index + MEASUREMENT_PROFILE.warmupIterations))
        }
        const expectedResourcesMatch = samples.every(sample => matchesBrowserResourceExpectations(sample, profile))
        return {
            id: profile.id,
            effect: profile.effect,
            trigger: profile.trigger,
            reducedMotion: profile.reducedMotion,
            lifecycle: profile.lifecycle,
            url,
            samples,
            styles,
            summary: {
                mountMs: summarize(samples.map(sample => sample.mountMs)),
                updateMs: summarize(samples.map(sample => sample.updateMs)),
                unmountMs: summarize(samples.map(sample => sample.unmountMs)),
            },
            resourceChecks: {
                afterUnmountHasNoActiveResources: samples.every(sample => isZeroResourceSnapshot(sample.afterUnmount)),
                expectedResourcesMatch,
                afterSettleSnapshots: samples.map(sample => sample.afterSettle),
            },
        }
    } finally {
        await browser.close()
    }
}

async function main(): Promise<void> {
    const options = parseArgs(process.argv.slice(2))
    const artifactPath = resolve(options.artifactPath)
    const outputDir = resolve(options.outputDir)
    const artifactStat = await stat(artifactPath)
    if (!artifactStat.isFile()) throw new Error(`artifact 不是文件：${artifactPath}`)
    const artifactHash = await sha256File(artifactPath)
    const sourceLockText = await readFile(SOURCE_LOCK_PATH, 'utf8')
    const sourceLockHash = hashBuffer(Buffer.from(sourceLockText))
    const lockedVersions = readLockedVersions(sourceLockText)
    assertLockedProfile(lockedVersions)

    const scenarios: CostScenario[] = options.scenarioIds.length > 0
        ? COST_SCENARIOS.filter((scenario: CostScenario) => options.scenarioIds.includes(scenario.id))
        : [...COST_SCENARIOS]
    if (scenarios.length === 0) throw new Error('没有匹配的成本场景')
    const unknownScenarios = options.scenarioIds.filter(id => !COST_SCENARIOS.some((scenario: CostScenario) => scenario.id === id))
    if (unknownScenarios.length > 0) throw new Error(`未知成本场景：${unknownScenarios.join(', ')}`)

    await clearOutputArtifacts(outputDir)
    await mkdir(join(outputDir, 'build-logs'), { recursive: true })
    const fixture = await createFixture(artifactPath, outputDir)
    let server: ReturnType<typeof createServer> | undefined
    try {
        const bundles: BundleRecord[] = []
        for (const scenario of scenarios) {
            console.log(`[cost] build ${scenario.id}`)
            bundles.push(await buildScenario(fixture.root, scenario, outputDir))
        }
        const emptyBundle = bundles.find(bundle => bundle.id === 'empty')
        if (!emptyBundle) throw new Error('成本结果缺少 empty 基线场景')
        for (const bundle of bundles) {
            bundle.deltaFromEmpty = {
                staticClosure: byteDelta(bundle.staticClosure, emptyBundle.staticClosure),
                dynamicClosure: byteDelta(bundle.dynamicClosure, emptyBundle.dynamicClosure),
            }
        }

        const browserExecutable = options.skipBrowser ? undefined : browserExecutablePath()
        const browserServer = bundles.find(bundle => bundle.id === 'button-root')
        const browserRecords: BrowserRecord[] = []
        if (!options.skipBrowser && browserServer) {
            const served = await serveDirectory(browserServer.outDir)
            server = served.server
            for (const profile of BROWSER_PROFILES) {
                console.log(`[cost] browser ${profile.id}`)
                browserRecords.push(await measureBrowserProfile(served.url, profile))
            }
        }

        const result = {
            schema: 'brutx-ui-cost-baseline/v1',
            profile: COST_PROFILE_VERSION,
            generatedAt: new Date().toISOString(),
            source: {
                repository: REPO_ROOT,
                gitCommit: runGit(['rev-parse', 'HEAD']),
                packageManager: fixture.packageManager,
                sourceLockPath: SOURCE_LOCK_PATH,
                sourceLockSha256: sourceLockHash,
                lockedVersions,
            },
            artifact: {
                path: artifactPath,
                sha256: artifactHash,
                sizeBytes: artifactStat.size,
            },
            fixture: {
                packageName: FIXTURE_PACKAGE_NAME,
                packageJsonSha256: fixture.packageJsonHash,
                lockPath: fixture.lockPath,
                fixedLockPath: FIXED_FIXTURE_LOCK_PATH,
                lockTemplateSha256: await sha256File(FIXED_FIXTURE_LOCK_PATH),
                lockSha256: fixture.lockHash,
                packageManager: fixture.packageManager,
                optionalPeerPackages: [...CONSUMER_OPTIONAL_PEER_PACKAGES],
                root: options.keepFixture ? fixture.root : undefined,
                nodePath: '',
                installArgs: ['install', '--frozen-lockfile', '--ignore-scripts'],
            },
            environment: {
                node: process.version,
                pnpm: runPnpm(fixture.root, ['--version']).trim(),
                pnpmPath: PNPM_EXECUTABLE,
                platform: process.platform,
                arch: process.arch,
                browser: browserExecutable ? {
                    executablePath: browserExecutable,
                    version: chromiumVersion(browserExecutable),
                    headless: true,
                    reducedMotionProfiles: [...new Set(BROWSER_PROFILES.map(profile => profile.reducedMotion))],
                } : null,
                measurement: MEASUREMENT_PROFILE,
            },
            scenarios: bundles,
            browser: browserRecords,
            metricSemantics: {
                buildMode: 'production',
                compressedBytes: 'sum of individually compressed files',
                staticClosure: 'entry plus recursive static imports and CSS references',
                dynamicClosure: 'recursive dynamic entries plus their static imports and CSS references',
                closureByType: 'every closure reports raw/gzip/Brotli totals separately for JS and CSS',
                optionalPeerPackages: 'optional peer packages are installed in the fixed consumer fixture and listed in fixture metadata',
            },
            probe: {
                scope: 'generated consumer fixture only',
                patched: [
                    'window.setInterval/clearInterval',
                    'window.setTimeout/clearTimeout',
                    'window.matchMedia change listeners',
                    'Node.prototype.textContent getter',
                    'Element.prototype.setAttribute(data-text)',
                ],
            },
            checks: {
                allBuildsCompleted: bundles.length === scenarios.length,
                productionStyles: browserRecords.length > 0 ? browserRecords.every(record => record.styles.valid) : null,
                browserAfterUnmountNoActiveResources: browserRecords.length > 0
                    ? browserRecords.every(record => record.resourceChecks.afterUnmountHasNoActiveResources)
                    : null,
                browserResourceExpectations: options.assertResources
                    ? browserRecords.length > 0
                        ? browserRecords.every(record => record.resourceChecks.expectedResourcesMatch)
                        : null
                    : null,
            },
        }
        await writeFile(join(outputDir, 'cost-baseline.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8')
        console.log(`[cost] result ${join(outputDir, 'cost-baseline.json')}`)
        if (result.checks.productionStyles === false) throw new Error('生产样式断言失败，详情见成本结果中的 styles')
        if (options.assertResources && result.checks.browserResourceExpectations !== true) {
            throw new Error('浏览器资源断言失败，全部样本已保存在成本结果中')
        }
    } finally {
        server?.close()
        if (!options.keepFixture) await removeFixturePath(fixture.root)
    }
}

main().catch(error => {
    console.error(error instanceof Error ? error.stack ?? error.message : error)
    process.exitCode = 1
})
