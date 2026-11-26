import assert from 'node:assert/strict'
import test from 'node:test'
import { DOCS_CANONICAL_ROOT } from './site-paths'
import { resolvePageTranslations } from './site-translations'

const site = {
    pages: [
        'index.md', 'en/index.md',
        'components/index.md', 'en/components/index.md',
        'components/button.md', 'en/components/button.md',
        'guide/changelog.md', 'en/guide/changelog.md',
        'changelog/index.md', 'changelog/v1.2.3.md',
    ],
    rewrites: { map: {}, inv: {} },
}

function getAlternates(page: ReturnType<typeof resolvePageTranslations>) {
    return Object.fromEntries(page.head.flatMap(([, attributes]) =>
        attributes.rel === 'alternate' ? [[attributes.hreflang, attributes.href]] : [],
    ))
}

for (const cleanUrls of [false, true]) {
    const ext = cleanUrls ? '' : '.html'
    const configuration = { ...site, cleanUrls }

    test(`双向链接与 hreflang 使用实际路径（cleanUrls=${cleanUrls}）`, () => {
        for (const page of ['index.md', 'components/index.md', 'components/button.md', 'guide/changelog.md']) {
            const relative = page.replace(/index\.md$/, '').replace(/\.md$/, ext)
            const zh = resolvePageTranslations(configuration, page)
            const en = resolvePageTranslations(configuration, `en/${page}`)
            assert.deepEqual(zh.menu, { path: `/en/${relative}`, translated: true })
            assert.deepEqual(en.menu, { path: `/${relative}`, translated: true })
            assert.deepEqual(getAlternates(zh), getAlternates(en))
            assert.deepEqual(getAlternates(zh), {
                'zh-CN': `${DOCS_CANONICAL_ROOT}${relative}`,
                en: `${DOCS_CANONICAL_ROOT}en/${relative}`,
                'x-default': `${DOCS_CANONICAL_ROOT}${relative}`,
            })
        }
    })

    test(`中文归档的英语菜单指向真实说明页（cleanUrls=${cleanUrls}）`, () => {
        for (const page of ['changelog/index.md', 'changelog/v1.2.3.md']) {
            const archive = resolvePageTranslations(configuration, page)
            assert.deepEqual(archive.menu, { path: `/en/guide/changelog${ext}`, translated: false })
            assert.deepEqual(getAlternates(archive), {})
        }
        const pages = site.pages.filter((page) => page !== 'en/guide/changelog.md')
        assert.deepEqual(resolvePageTranslations({ ...configuration, pages }, 'changelog/index.md').menu, {
            path: '/en/',
            translated: false,
        })
    })
}

test('站点页面列表包含归档译本时，两个方向都采用真实译本', () => {
    const page = 'changelog/v1.2.3.md'
    const translated = `en/${page}`
    const configuration = { ...site, pages: [...site.pages, translated] }
    const zh = resolvePageTranslations(configuration, page)
    const en = resolvePageTranslations(configuration, translated)
    assert.deepEqual(zh.menu, { path: '/en/changelog/v1.2.3.html', translated: true })
    assert.deepEqual(en.menu, { path: '/changelog/v1.2.3.html', translated: true })
    assert.deepEqual(getAlternates(zh), getAlternates(en))
    assert.equal(getAlternates(zh).en, `${DOCS_CANONICAL_ROOT}en/changelog/v1.2.3.html`)
})

test('使用 VitePress 重写后的页面路径配对', () => {
    const configuration = {
        ...site,
        rewrites: {
            map: { 'en/components/button.md': 'en/components/action.md' },
            inv: { 'en/components/action.md': 'en/components/button.md' },
        },
    }
    const zh = resolvePageTranslations(configuration, 'components/button.md')
    const en = resolvePageTranslations(configuration, 'en/components/action.md')
    assert.deepEqual(zh.menu, { path: '/en/', translated: false })
    assert.deepEqual(en.menu, { path: '/', translated: false })
    assert.deepEqual(getAlternates(zh), {})
    assert.deepEqual(getAlternates(en), {})
})
