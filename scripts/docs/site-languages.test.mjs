import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import test, { after } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'

async function previewBuiltSite() {
    const docsPackage = new URL('../../apps/docs/package.json', import.meta.url)
    const require = createRequire(docsPackage)
    const { resolveConfig } = await import(pathToFileURL(require.resolve('vitepress')).href)
    const { preview } = await import(pathToFileURL(require.resolve('vite')).href)
    const root = fileURLToPath(new URL('.', docsPackage))
    const config = await resolveConfig(root, 'serve', 'production')
    assert.ok(existsSync(join(config.outDir, 'index.html')), '请先运行 pnpm build:docs 生成站点产物')
    const server = await preview({
        root,
        configFile: false,
        appType: 'mpa',
        base: config.site.base,
        build: { outDir: config.outDir },
        preview: { host: '127.0.0.1', port: 0 },
    })
    after(() => server.close())
    return { site: server.resolvedUrls.local[0], cleanUrls: config.site.cleanUrls }
}

const { site, cleanUrls } = process.env.DOCS_SITE_URL
    ? { site: process.env.DOCS_SITE_URL, cleanUrls: process.env.DOCS_CLEAN_URLS === '1' }
    : await previewBuiltSite()
const extension = cleanUrls ? '' : '.html'
const component = (locale, name) => `${locale}components/${name}${extension}`
const paginationAnchor = '#api-component_3Apagination_2FPagination-props'
const changelogGuide = `en/guide/changelog${extension}`
const archiveVersion = `changelog/v0.11.1${extension}`
const archives = ['changelog/', archiveVersion]
const examples = [
    { page: 'pagination', zh: '转到下一页', en: 'Go to next page' },
    { page: 'carousel', zh: '上一张幻灯片', en: 'Previous slide' },
]

function url(path) {
    return new URL(path, `${site.replace(/\/$/, '')}/`)
}

test('双语页面的服务端渲染使用真实译本和对应语言包', async () => {
    for (const [prefix, lang] of [['', 'zh-CN'], ['en/', 'en']]) {
        for (const { page, zh, en } of examples) {
            const response = await fetch(url(component(prefix, page)))
            assert.equal(response.status, 200)
            const html = await response.text()
            assert.ok(html.includes(`<html lang="${lang}"`))
            const [expected, other] = lang === 'en' ? [en, zh] : [zh, en]
            assert.ok(html.includes(`aria-label="${expected}"`))
            assert.ok(!html.includes(`aria-label="${other}"`))
            const head = html.split('</head>', 1)[0]
            for (const alternate of ['zh-CN', 'en', 'x-default']) {
                assert.ok(head.includes(`hreflang="${alternate}"`))
            }
        }
    }

    for (const archive of archives) {
        const response = await fetch(url(archive))
        assert.equal(response.status, 200)
        const [head, body] = (await response.text()).split('</head>')
        assert.ok(!head.includes('hreflang="en"'))
        assert.ok(body.includes(`href="${url(changelogGuide).pathname}"`))
    }
    assert.equal((await fetch(url(changelogGuide))).status, 200)
})

test('桌面、窄屏和移动端的换语言菜单在水合后可用', { timeout: 60_000 }, async () => {
    const require = createRequire(new URL('../../packages/ui/package.json', import.meta.url))
    const { chromium } = require('playwright')
    const executablePath = process.env.DOCS_CHROME_PATH || process.env.BRUTX_CHROMIUM_EXECUTABLE
    const browser = await chromium.launch(executablePath ? { executablePath } : { channel: 'chrome' })

    try {
        for (const [width, selector, mobile] of [
            [1440, '.VPNavBarTranslations', false],
            [1024, '.VPNavBarExtra', false],
            [390, '.VPNavScreenTranslations', true],
        ]) {
            const page = await browser.newPage({ viewport: { width, height: 900 } })
            const pageErrors = []
            page.on('pageerror', (error) => pageErrors.push(error.message))
            await page.route('**/*', (route) => new URL(route.request().url()).origin === url('').origin
                ? route.continue()
                : route.abort())

            async function visit(path) {
                assert.equal((await page.goto(url(path).href)).status(), 200)
                await page.waitForFunction(() => Boolean(document.querySelector('#app')?.__vue_app__))
            }

            async function switchLanguage(name, path) {
                if (mobile) await page.getByRole('button', { name: 'mobile navigation' }).click()
                const menu = page.locator(selector)
                const trigger = menu.getByRole('button').first()
                if (mobile) {
                    await trigger.click()
                } else {
                    await trigger.hover()
                }
                const link = menu.getByRole('link', { name, exact: true })
                const target = url(path)
                assert.equal(new URL(await link.getAttribute('href'), target.origin).href, target.href)
                await link.click()
                await page.waitForURL(target.href)
            }

            await visit(`${component('', 'pagination')}${paginationAnchor}`)
            await page.locator(paginationAnchor).waitFor({ state: 'attached' })
            await page.evaluate(() => { window.docsLanguageTest = true })
            await switchLanguage('English', `${component('en/', 'pagination')}${paginationAnchor}`)
            await page.waitForFunction(() => document.documentElement.lang === 'en')
            await page.locator(paginationAnchor).waitFor({ state: 'attached' })
            const preview = page.locator('[data-brutx-preview]')
            await preview.getByRole('button', { name: 'Go to next page', exact: true }).first().waitFor()
            assert.equal(await preview.getByRole('button', { name: '转到下一页', exact: true }).count(), 0)
            assert.equal(await page.evaluate(() => window.docsLanguageTest), true)
            await switchLanguage('简体中文', `${component('', 'pagination')}${paginationAnchor}`)
            await page.waitForFunction(() => document.documentElement.lang === 'zh-CN')
            await page.locator(paginationAnchor).waitFor({ state: 'attached' })
            await preview.getByRole('button', { name: '转到下一页', exact: true }).first().waitFor()

            await visit(`${archiveVersion}#changelog`)
            await switchLanguage('English', changelogGuide)
            await page.waitForFunction(() => document.documentElement.lang === 'en')

            if (selector === '.VPNavBarTranslations') {
                for (const [name, zh, en] of [
                    ['carousel', '上一张幻灯片', 'Previous slide'],
                    ['sketchy-chart', '查看数据表', 'View data table'],
                ]) {
                    await visit(component('en/', name))
                    await preview.getByRole('button', { name: en, exact: true }).first().waitFor()
                    assert.equal(await preview.getByRole('button', { name: zh, exact: true }).count(), 0)
                }
            }
            assert.deepEqual(pageErrors, [])
            await page.close()
        }
    } finally {
        await browser.close()
    }
})
