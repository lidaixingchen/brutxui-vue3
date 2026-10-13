import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'

import {
    buildVitePressDevArguments,
    createDocsApiGenerationQueue,
    isDocsApiGenerationInput,
    watchDocsApiInputs,
} from './watch-docs-api.mjs'

const TEST_DEBOUNCE_MS = 5
const DOCS_DEV_TEST_PORT = '5180'
const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

test('VitePress head and PWA manifest follow each deployment base', () => {
    const configUrl = pathToFileURL(path.resolve(REPOSITORY_ROOT, 'apps/docs/.vitepress/config.ts')).href
    const publicDirectory = path.resolve(REPOSITORY_ROOT, 'apps/docs/public')
    const manifest = JSON.parse(fs.readFileSync(path.join(publicDirectory, 'manifest.json'), 'utf8'))
    const readConfig = `
        const { default: config } = await import(${JSON.stringify(configUrl)})
        const link = rel => config.head.find(([tag, attrs]) => tag === 'link' && attrs.rel === rel)?.[1].href
        console.log(JSON.stringify({ base: config.base, favicon: link('icon'), manifest: link('manifest') }))
    `

    for (const deployment of [
        { name: 'GitHub Pages', vercel: false, base: '/brutxui-vue3/' },
        { name: 'Vercel', vercel: true, base: '/' },
    ]) {
        const env = { ...process.env }
        delete env.VERCEL
        if (deployment.vercel) env.VERCEL = '1'

        const result = spawnSync(process.execPath, [
            '--import', 'tsx',
            '--input-type=module',
            '-e', readConfig,
        ], {
            cwd: REPOSITORY_ROOT,
            env,
            encoding: 'utf8',
        })
        assert.equal(result.status, 0, `${deployment.name} config failed to load: ${result.stderr}`)
        const config = JSON.parse(result.stdout)
        assert.equal(config.base, deployment.base, `${deployment.name} site base`)
        assert.equal(config.favicon, `${deployment.base}favicon.svg`, `${deployment.name} favicon URL`)
        assert.equal(config.manifest, `${deployment.base}manifest.json`, `${deployment.name} manifest URL`)

        const manifestUrl = new URL(config.manifest, 'https://docs.example')
        assert.equal(new URL(manifest.start_url, manifestUrl).pathname, deployment.base)
        assert.equal(new URL(manifest.icons[0].src, manifestUrl).pathname, `${deployment.base}favicon.svg`)
        assert.ok(fs.existsSync(path.join(publicDirectory, 'favicon.svg')))
        assert.ok(fs.existsSync(path.join(publicDirectory, 'manifest.json')))
    }
})

test('文档开发服务参数透传到 VitePress', () => {
    const vitePressOptions = ['--host', '127.0.0.1', '--port', DOCS_DEV_TEST_PORT]
    assert.deepEqual(
        buildVitePressDevArguments(vitePressOptions),
        ['exec', 'vitepress', 'dev', ...vitePressOptions],
    )
    assert.deepEqual(
        buildVitePressDevArguments(['--', ...vitePressOptions]),
        ['exec', 'vitepress', 'dev', ...vitePressOptions],
    )
})

test('只将 API 清单依赖变化作为文档生成输入', () => {
    assert.equal(isDocsApiGenerationInput('packages/ui/src/components/button/Button.vue'), true)
    assert.equal(isDocsApiGenerationInput('packages/shared/src/component-metadata.ts'), true)
    assert.equal(isDocsApiGenerationInput('apps/docs/.vitepress/api-content/button.ts'), true)
    assert.equal(isDocsApiGenerationInput('apps/docs/en/components/button.md'), true)
    assert.equal(isDocsApiGenerationInput('packages/ui/scripts/api-docs/catalog.ts'), true)
    assert.equal(isDocsApiGenerationInput('tsconfig.base.json'), true)
    assert.equal(isDocsApiGenerationInput('apps/docs/.vitepress/api-generated/button.en.json'), false)
    assert.equal(isDocsApiGenerationInput('packages/ui/scripts/api-docs/catalog.test.ts'), false)
    assert.equal(isDocsApiGenerationInput('apps/docs/blog/announcement.md'), false)
    assert.equal(isDocsApiGenerationInput('docs/architecture/overview.md'), false)
})

test('文件监听器连接源码目录并忽略无关文档', () => {
    const watched = []
    const changes = []
    let closedCount = 0
    const close = watchDocsApiInputs('/candidate', changedPath => changes.push(changedPath), {
        watcher: (watchPath, options, callback) => {
            const fileWatcher = {
                on: () => fileWatcher,
                close: () => { closedCount += 1 },
            }
            watched.push({ watchPath, options, callback })
            return fileWatcher
        },
    })

    const emit = (relativeRoot, filename) => {
        const target = watched.find(item => item.watchPath === path.resolve('/candidate', relativeRoot))
        assert.ok(target, `missing watcher for ${relativeRoot}`)
        target.callback('change', filename)
    }
    emit('packages/ui/src', 'components/button/Button.vue')
    emit('apps/docs/components', 'button.md')
    emit('apps/docs', 'blog/announcement.md')

    assert.equal(watched.find(item => item.watchPath === path.resolve('/candidate/packages/ui/src')).options.recursive, true)
    assert.deepEqual(changes, [
        'packages/ui/src/components/button/Button.vue',
        'apps/docs/components/button.md',
    ])
    close()
    assert.equal(closedCount, watched.length)
})

test('快速连续的输入变化合并为一轮生成', async () => {
    let callCount = 0
    const queue = createDocsApiGenerationQueue({
        debounceMs: TEST_DEBOUNCE_MS,
        run: async () => { callCount += 1 },
    })

    queue.request()
    queue.request()
    queue.request()
    await queue.flush()
    queue.close()

    assert.equal(callCount, 1)
})

test('生成期间的新输入排入下一轮且不并发运行', async () => {
    const started = []
    let active = 0
    let maximumActive = 0
    let releaseFirstRun
    let notifyFirstRunStarted
    const firstRunReleased = new Promise(resolve => { releaseFirstRun = resolve })
    const firstRunStarted = new Promise(resolve => { notifyFirstRunStarted = resolve })
    const queue = createDocsApiGenerationQueue({
        debounceMs: TEST_DEBOUNCE_MS,
        run: async () => {
            active += 1
            maximumActive = Math.max(maximumActive, active)
            started.push(started.length + 1)
            if (started.length === 1) {
                notifyFirstRunStarted()
                await firstRunReleased
            }
            active -= 1
        },
    })

    queue.request()
    await firstRunStarted
    assert.deepEqual(started, [1])
    queue.request()
    queue.request()
    releaseFirstRun()
    await queue.flush()
    queue.close()

    assert.deepEqual(started, [1, 2])
    assert.equal(maximumActive, 1)
})

test('生成失败通过 flush 显式返回错误', async () => {
    const failure = new Error('API 内容键无效')
    const observed = []
    const queue = createDocsApiGenerationQueue({
        debounceMs: TEST_DEBOUNCE_MS,
        run: async () => { throw failure },
        onError: error => observed.push(error),
    })

    queue.request()
    await assert.rejects(queue.flush(), failure)
    queue.close()

    assert.deepEqual(observed, [failure])
})
