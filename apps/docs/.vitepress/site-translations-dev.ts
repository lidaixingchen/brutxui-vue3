import path from 'node:path'
import { resolvePages, type createServer, type SiteConfig, type UserConfig } from 'vitepress'
import { resolvePageTranslations } from './site-translations'

type VitePlugin = Extract<NonNullable<NonNullable<UserConfig['vite']>['plugins']>[number], { name: string }>
type DevServer = Awaited<ReturnType<typeof createServer>>
type SiteRoutes = Pick<SiteConfig, 'pages' | 'rewrites'>

export function createSiteTranslations() {
    let server: DevServer
    let site: SiteConfig
    let routes: SiteRoutes
    let refresh = Promise.resolve()

    const plugin: VitePlugin = {
        name: 'brutx:refresh-site-translations',
        apply: 'serve',
        configureServer(devServer) {
            server = devServer
            site = (server.config as typeof server.config & { vitepress: SiteConfig }).vitepress
            routes = { pages: site.pages, rewrites: site.rewrites }
        },
        watchChange(file, { event }) {
            const relative = path.relative(site.srcDir, file)
            if (event === 'update' || !relative.endsWith('.md') || path.isAbsolute(relative) || relative.startsWith(`..${path.sep}`)) return

            refresh = refresh.then(async () => {
                // VitePress 独立更新路由缓存，页面数据要等此次文件扫描完成再失效。
                const latest = await resolvePages(site.srcDir, site.userConfig, site.logger)
                const changed = latest.pages.length !== routes.pages.length || latest.pages.some((page, index) =>
                    page !== routes.pages[index] || latest.rewrites.map[page] !== routes.rewrites.map[page],
                )
                routes = latest
                if (changed) {
                    server.moduleGraph.invalidateAll()
                    server.hot.send({ type: 'full-reload' })
                }
            }).catch((error: unknown) => {
                site.logger.error(`刷新文档译本失败：${String(error)}`)
            })
            return refresh
        },
    }

    const transformPageData: NonNullable<UserConfig['transformPageData']> = (pageData, { siteConfig }) => {
        const { pages, rewrites } = routes ?? siteConfig
        const { menu, head } = resolvePageTranslations({ pages, rewrites, cleanUrls: siteConfig.cleanUrls }, pageData.relativePath)
        return {
            frontmatter: {
                ...pageData.frontmatter,
                languageMenuTarget: menu,
                head: [...(pageData.frontmatter.head ?? []), ...head],
            },
        }
    }

    // 开发态 Markdown 的结果还依赖其他页面是否存在，路由变化后由 Vite 重新转换。
    return { plugin, transformPageData, markdown: { cache: false } }
}
