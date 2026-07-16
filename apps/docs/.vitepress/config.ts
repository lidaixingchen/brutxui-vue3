import { defineConfig } from 'vitepress'
import tailwindcss from '@tailwindcss/vite'
import { generateComponentsSidebar, generateBlocksSidebar } from './theme/lib/sidebar-generator'

// @ts-expect-error VitePress 1.x 内置 Vite 类型与 Vite 8 不兼容 (TS2321: Excessive stack depth)
// @see https://github.com/vuejs/vitepress/issues/4600
export default defineConfig({
    lang: 'zh-CN',
    title: 'BrutxUI',
    locales: {
        root: {
            label: '简体中文',
            themeConfig: {
                outline: {
                    label: '本页目录',
                    level: [2, 3],
                },
                lastUpdated: {
                    text: '最后更新于',
                },
                docFooter: {
                    prev: '上一页',
                    next: '下一页',
                },
                darkModeSwitchLabel: '外观',
                sidebarMenuLabel: '菜单',
                returnToTopLabel: '回到顶部',
            },
        },
        en: {
            label: 'English',
            lang: 'en',
            title: 'BrutxUI',
            description: 'Neo-Brutalism Vue 3 Component Library',
            themeConfig: {
                outline: { label: 'On this page', level: [2, 3] },
                lastUpdated: { text: 'Last updated' },
                docFooter: { prev: 'Previous', next: 'Next' },
                darkModeSwitchLabel: 'Appearance',
                sidebarMenuLabel: 'Menu',
                returnToTopLabel: 'Back to top',
                nav: [
                    { text: 'Guide', link: '/en/guide/getting-started' },
                    { text: 'Components', link: '/en/components/' },
                    { text: 'Blocks', link: '/en/blocks/' },
                    { text: 'GitHub', link: 'https://github.com/lidaixingchen/brutxui-vue3' },
                ],
                sidebar: {
                    '/en/guide/': [
                        { text: 'Getting Started', link: '/en/guide/getting-started' },
                        {
                            text: 'Installation',
                            items: [
                                { text: 'Vite', link: '/en/guide/installation-vite' },
                                { text: 'Manual', link: '/en/guide/installation-manual' },
                            ],
                        },
                        { text: 'CLI', link: '/en/guide/cli' },
                        { text: 'Theme & Tokens', link: '/en/guide/theme' },
                        { text: 'Theme Playground', link: '/en/guide/theme-playground' },
                        { text: 'Internationalization', link: '/en/guide/locale' },
                        { text: 'AI Integration', link: '/en/guide/ai' },
                        {
                            text: 'Advanced',
                            items: [
                                {
                                    text: 'Best Practices',
                                    items: [
                                        { text: 'Overview', link: '/en/guide/best-practices' },
                                        { text: 'Component Usage', link: '/en/guide/best-practices/component-usage' },
                                        { text: 'Styling & Customization', link: '/en/guide/best-practices/styling' },
                                        { text: 'Accessibility', link: '/en/guide/best-practices/accessibility' },
                                        { text: 'Performance', link: '/en/guide/best-practices/performance' },
                                    ],
                                },
                                { text: 'FAQ', link: '/en/guide/faq' },
                                { text: 'Migration Guide', link: '/en/guide/migration' },
                                { text: 'Changelog', link: '/en/guide/changelog' },
                                { text: 'Contributing', link: '/en/guide/contributing' },
                            ],
                        },
                    ],
                    '/en/components/': generateComponentsSidebar('en'),
                    '/en/blocks/': generateBlocksSidebar('en'),
                },
                search: {
                    provider: 'local',
                    options: {
                        translations: {
                            button: { buttonText: 'Search docs', buttonAriaLabel: 'Search docs' },
                            modal: {
                                displayDetails: 'Display details',
                                resetButtonTitle: 'Reset search',
                                backButtonTitle: 'Go back',
                                noResultsText: 'No results found',
                                footer: { selectText: 'Select', navigateText: 'Navigate', closeText: 'Close' },
                            },
                        },
                    },
                },
                socialLinks: [
                    { icon: 'github', link: 'https://github.com/lidaixingchen/brutxui-vue3' },
                ],
                footer: {
                    message: 'Brute force builds.',
                    copyright: `© ${new Date().getFullYear()} BrutxUI · MIT License`,
                },
                editLink: {
                    pattern: 'https://github.com/lidaixingchen/brutxui-vue3/edit/main/apps/docs/:path',
                    text: 'Edit this page on GitHub',
                },
            },
        },
    },
    description: 'Neo-Brutalism 风格 Vue 3 组件库',
    base: '/brutxui-vue3/',
    lastUpdated: true,
    sitemap: {
        hostname: 'https://lidaixingchen.github.io/brutxui-vue3/',
    },
    head: [
        ['link', { rel: 'icon', type: 'image/svg+xml', href: '/brutxui-vue3/favicon.svg' }],
        ['meta', { name: 'theme-color', content: '#FF6B6B' }],
        ['meta', { property: 'og:type', content: 'website' }],
        ['meta', { property: 'og:title', content: 'BrutxUI' }],
        ['meta', { property: 'og:image', content: 'https://lidaixingchen.github.io/brutxui-vue3/og-image.svg' }],
        ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
        ['meta', { name: 'twitter:title', content: 'BrutxUI' }],
        ['meta', { name: 'twitter:image', content: 'https://lidaixingchen.github.io/brutxui-vue3/og-image.svg' }],
        ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
        ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
        ['link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;900&display=swap' }],
        ['link', { rel: 'manifest', href: '/brutxui-vue3/manifest.json' }],
    ],
    transformHead(context) {
        let pageUrl = context.page.replace(/\.md$/, '')
        if (pageUrl === 'index') pageUrl = ''
        pageUrl = pageUrl.replace(/\/index$/, '')
        const isEn = pageUrl === 'en' || pageUrl.startsWith('en/')
        const basePath = isEn ? pageUrl.replace(/^en\/?/, '') : pageUrl
        const baseUrl = 'https://lidaixingchen.github.io/brutxui-vue3'
        const canonicalUrl = isEn ? `${baseUrl}/en/${basePath}` : `${baseUrl}/${basePath}`
        const description = isEn
            ? (context.description ?? 'Neo-Brutalism Vue 3 Component Library')
            : (context.description ?? 'Neo-Brutalism 风格 Vue 3 组件库')

        return [
            // hreflang 标签
            ['link', { rel: 'alternate', hreflang: 'zh-CN', href: `${baseUrl}/${basePath}` }],
            ['link', { rel: 'alternate', hreflang: 'en', href: `${baseUrl}/en/${basePath}` }],
            ['link', { rel: 'alternate', hreflang: 'x-default', href: `${baseUrl}/${basePath}` }],
            // canonical URL
            ['link', { rel: 'canonical', href: canonicalUrl }],
            // OG / Twitter meta
            ['meta', { property: 'og:url', content: canonicalUrl }],
            ['meta', { property: 'og:description', content: description }],
            ['meta', { name: 'twitter:description', content: description }],
            // JSON-LD 结构化数据
            [
                'script',
                { type: 'application/ld+json' },
                JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'SoftwareSourceCode',
                    name: context.title ?? 'BrutxUI',
                    description,
                    url: canonicalUrl,
                    codeRepository: 'https://github.com/lidaixingchen/brutxui-vue3',
                    programmingLanguage: 'Vue',
                    license: 'MIT',
                    author: {
                        '@type': 'Person',
                        name: 'lidaixingchen',
                        url: 'https://github.com/lidaixingchen',
                    },
                }),
            ],
        ]
    },
    themeConfig: {
        logo: '/favicon.svg',
        nav: [
            { text: '指南', link: '/guide/getting-started' },
            { text: '组件', link: '/components/' },
            { text: '区块与模板', link: '/blocks/' },
            {
                text: 'GitHub',
                link: 'https://github.com/lidaixingchen/brutxui-vue3',
            },
        ],
        sidebar: {
            '/guide/': [
                {
                    text: '快速开始',
                    link: '/guide/getting-started',
                },
                {
                    text: '安装',
                    items: [
                        { text: 'Vite', link: '/guide/installation-vite' },
                        { text: '手动安装', link: '/guide/installation-manual' },
                    ],
                },
                {
                    text: 'CLI 工具',
                    link: '/guide/cli',
                },
                {
                    text: '主题与令牌',
                    link: '/guide/theme',
                },
                {
                    text: '主题实验室',
                    link: '/guide/theme-playground',
                },
                {
                    text: '国际化',
                    link: '/guide/locale',
                },
                {
                    text: 'AI 集成',
                    link: '/guide/ai',
                },
                {
                    text: '进阶',
                    items: [
                        {
                            text: '最佳实践',
                            items: [
                                { text: '概览', link: '/guide/best-practices' },
                                { text: '组件使用规范', link: '/guide/best-practices/component-usage' },
                                { text: '样式定制指南', link: '/guide/best-practices/styling' },
                                { text: '可访问性指南', link: '/guide/best-practices/accessibility' },
                                { text: '性能优化建议', link: '/guide/best-practices/performance' },
                            ],
                        },
                        { text: '常见问题', link: '/guide/faq' },
                        { text: '迁移指南', link: '/guide/migration' },
                        { text: '版本历史', link: '/guide/changelog' },
                        { text: '贡献指南', link: '/guide/contributing' },
                    ],
                },
            ],
            '/components/': generateComponentsSidebar('zh'),
            '/blocks/': generateBlocksSidebar('zh'),
        },
        search: {
            provider: 'local',
            options: {
                translations: {
                    button: {
                        buttonText: '搜索文档',
                        buttonAriaLabel: '搜索文档',
                    },
                    modal: {
                        displayDetails: '显示详情',
                        resetButtonTitle: '清除查询条件',
                        backButtonTitle: '返回',
                        noResultsText: '无法找到相关结果',
                        footer: {
                            selectText: '选择',
                            navigateText: '切换',
                            closeText: '关闭',
                        },
                    },
                },
            },
        },
        socialLinks: [
            { icon: 'github', link: 'https://github.com/lidaixingchen/brutxui-vue3' },
        ],
        footer: {
            message: '蛮力铸就。',
            copyright: `© ${new Date().getFullYear()} BrutxUI · MIT License`,
        },
        editLink: {
            pattern: 'https://github.com/lidaixingchen/brutxui-vue3/edit/main/apps/docs/:path',
            text: '在 GitHub 上编辑此页',
        },
    },
    vite: {
        // @ts-expect-error VitePress 1.x PluginOption 类型与 Vite 8 不兼容 (TS2322)
        plugins: [tailwindcss()],
        resolve: {
            alias: {
                '@': import.meta.dirname,
            },
        },
    },
})
