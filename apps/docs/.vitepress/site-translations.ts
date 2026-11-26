import type { HeadConfig, SiteConfig } from 'vitepress'
import { CHANGELOG_GUIDE, DOCS_CANONICAL_ROOT } from './site-paths'

export interface LanguageMenuTarget {
    path: string
    translated: boolean
}

export function docsPagePath(page: string, cleanUrls?: boolean): string {
    return `/${page.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, cleanUrls ? '' : '.html')}`
}

export function docsPageCanonical(path: string): string {
    return new URL(path.slice(1), DOCS_CANONICAL_ROOT).href
}

export function resolvePageTranslations(
    { pages, rewrites, cleanUrls }: Pick<SiteConfig, 'pages' | 'rewrites' | 'cleanUrls'>,
    page: string,
): { menu: LanguageMenuTarget | undefined; head: HeadConfig[] } {
    const paths = new Set(pages.map((source) => docsPagePath(rewrites.map[source] ?? source, cleanUrls)))
    const path = docsPagePath(page, cleanUrls)
    const isEn = path.startsWith('/en/')
    const zh = isEn ? path.slice('/en'.length) : path
    const en = `/en${zh}`
    const translated = paths.has(zh) && paths.has(en)
    const localeHome = isEn ? '/' : '/en/'
    const changelogGuide = `/en${docsPagePath(`${CHANGELOG_GUIDE.slice(1)}.md`, cleanUrls)}`
    const fallback = !isEn && zh.startsWith('/changelog/') && paths.has(changelogGuide)
        ? changelogGuide
        : localeHome
    const target = translated ? (isEn ? zh : en) : fallback

    const head: HeadConfig[] = [['link', { rel: 'canonical', href: docsPageCanonical(path) }]]
    if (translated) {
        for (const [hreflang, alternate] of [['zh-CN', zh], ['en', en], ['x-default', zh]] as const) {
            head.push(['link', { rel: 'alternate', hreflang, href: docsPageCanonical(alternate) }])
        }
    }

    return { menu: paths.has(target) ? { path: target, translated } : undefined, head }
}
