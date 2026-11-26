import assert from 'node:assert/strict'
import { mkdir, mkdtemp, realpath, rm, symlink, unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'
import { createServer } from 'vitepress'
import type { HeadConfig } from 'vitepress'
import type { LanguageMenuTarget } from './site-translations'

const zhArticle = 'guide/article.md'
const enArticle = `en/${zhArticle}`
const archive = 'changelog/index.md'
const enChangelogGuide = 'en/guide/changelog.md'
const pollIntervalMs = 25
const watchTimeoutMs = 5000

test('文档开发服务在翻译文件增删后刷新已经加载的页面', async (t) => {
    const root = await mkdtemp(path.join(await realpath(tmpdir()), 'brutx-vitepress-translations-'))
    t.after(() => rm(root, { recursive: true, force: true }))

    async function write(relativePath: string, content: string) {
        const filename = path.join(root, relativePath)
        await mkdir(path.dirname(filename), { recursive: true })
        await writeFile(filename, content)
    }

    await symlink(path.resolve(import.meta.dirname, '../node_modules'), path.join(root, 'node_modules'), 'junction')
    await write('.vitepress/config.ts', `
        import { defineConfig } from 'vitepress'
        import { createSiteTranslations } from ${JSON.stringify(path.join(import.meta.dirname, 'site-translations-dev.ts'))}
        const translations = createSiteTranslations()
        export default defineConfig({
            lang: 'zh-CN',
            base: '/fixture/',
            locales: { root: { label: '简体中文' }, en: { label: 'English', lang: 'en' } },
            markdown: translations.markdown,
            transformPageData: translations.transformPageData,
            vite: { plugins: [translations.plugin] },
        })
    `)
    for (const filename of ['index.md', 'en/index.md', zhArticle, archive]) {
        await write(filename, '# 测试文档')
    }
    await write(enChangelogGuide, '# Changelog')

    const server = await createServer(root, {
        host: '127.0.0.1',
        port: 0,
        watch: { usePolling: true, interval: pollIntervalMs },
    })
    try {
        await server.listen()
        const enGuide = path.dirname(path.join(root, enArticle))
        const isWatchingEnGuide = () => server.watcher.getWatched()[enGuide]?.includes(path.basename(enChangelogGuide))
        const startupDeadline = Date.now() + watchTimeoutMs
        while (!isWatchingEnGuide() && Date.now() < startupDeadline) {
            await delay(pollIntervalMs)
        }
        assert.ok(isWatchingEnGuide(), '英文指南目录应已开始监听')

        async function readPageData(filename: string) {
            const result = await server.transformRequest(`/${filename}`)
            assert.ok(result, filename)
            const serialized = /export const __pageData\s*=\s*JSON\.parse\(("(?:[^"\\]|\\.)*")\)/u.exec(result.code)?.[1]
            assert.ok(serialized, filename)
            const { frontmatter } = JSON.parse(JSON.parse(serialized)) as {
                frontmatter: { languageMenuTarget: LanguageMenuTarget; head: HeadConfig[] }
            }
            return frontmatter
        }

        async function expectLink(filename: string, target: LanguageMenuTarget) {
            const deadline = Date.now() + watchTimeoutMs
            let data = await readPageData(filename)
            while (data.languageMenuTarget.path !== target.path && Date.now() < deadline) {
                await delay(pollIntervalMs)
                data = await readPageData(filename)
            }
            assert.deepEqual(data.languageMenuTarget, target)
            const alternateLanguages = data.head.flatMap(([, attrs]) => attrs.hreflang ? [attrs.hreflang] : [])
            assert.deepEqual(alternateLanguages, target.translated ? ['zh-CN', 'en', 'x-default'] : [])
        }

        const enHome = { path: '/en/', translated: false }
        await expectLink(zhArticle, enHome)
        await expectLink(archive, { path: '/en/guide/changelog.html', translated: false })

        await write(enArticle, '# English article')
        await expectLink(zhArticle, { path: '/en/guide/article.html', translated: true })
        await expectLink(enArticle, { path: '/guide/article.html', translated: true })
        await unlink(path.join(root, enArticle))
        await expectLink(zhArticle, enHome)

        await unlink(path.join(root, enChangelogGuide))
        await expectLink(archive, enHome)
        await write(enChangelogGuide, '# Changelog')
        await expectLink(archive, { path: '/en/guide/changelog.html', translated: false })
    } finally {
        await server.close()
    }
})
