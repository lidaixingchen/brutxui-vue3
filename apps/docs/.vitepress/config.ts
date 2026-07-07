import { resolve } from 'node:path'
import { defineConfig } from 'vitepress'
import tailwindcss from '@tailwindcss/vite'

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
                                { text: 'Changelog', link: '/en/guide/changelog' },
                                { text: 'Contributing', link: '/en/guide/contributing' },
                            ],
                        },
                    ],
                    '/en/components/': [
                        { text: 'Overview', link: '/en/components/' },
                        {
                            text: 'Basic',
                            items: [
                                { text: 'Button', link: '/en/components/button' },
                                { text: 'Badge', link: '/en/components/badge' },
                                { text: 'Label', link: '/en/components/label' },
                                { text: 'Kbd', link: '/en/components/kbd' },
                                { text: 'Separator', link: '/en/components/separator' },
                                { text: 'Spinner', link: '/en/components/spinner' },
                                { text: 'Skeleton', link: '/en/components/skeleton' },
                                { text: 'Avatar', link: '/en/components/avatar' },
                                { text: 'CopyToClipboard', link: '/en/components/copy-to-clipboard' },
                            ],
                        },
                        {
                            text: 'Layout',
                            items: [
                                { text: 'Card', link: '/en/components/card' },
                                { text: 'Card3D', link: '/en/components/card-3d' },
                                { text: 'Accordion', link: '/en/components/accordion' },
                                { text: 'Scroll Area', link: '/en/components/scroll-area' },
                                { text: 'Carousel', link: '/en/components/carousel' },
                                { text: 'Breadcrumb', link: '/en/components/breadcrumb' },
                                { text: 'Menu', link: '/en/components/menu' },
                            ],
                        },
                        {
                            text: 'Form',
                            items: [
                                { text: 'Input', link: '/en/components/input' },
                                { text: 'HardcoreInput', link: '/en/components/hardcore-input' },
                                { text: 'NumberInput', link: '/en/components/number-input' },
                                { text: 'Textarea', link: '/en/components/textarea' },
                                { text: 'Checkbox', link: '/en/components/checkbox' },
                                { text: 'Radio Group', link: '/en/components/radio-group' },
                                { text: 'Switch', link: '/en/components/switch' },
                                { text: 'Toggle', link: '/en/components/toggle' },
                                { text: 'Toggle Group', link: '/en/components/toggle-group' },
                                { text: 'Select', link: '/en/components/select' },
                                { text: 'Combobox', link: '/en/components/combobox' },
                                { text: 'TreeSelect', link: '/en/components/tree-select' },
                                { text: 'Cascader', link: '/en/components/cascader' },
                                { text: 'Slider', link: '/en/components/slider' },
                                { text: 'TagsInput', link: '/en/components/tags-input' },
                                { text: 'ColorPicker', link: '/en/components/color-picker' },
                                { text: 'Transfer', link: '/en/components/transfer' },
                                { text: 'Rate', link: '/en/components/rate' },
                                { text: 'Upload', link: '/en/components/upload' },
                                { text: 'Form', link: '/en/components/form' },
                            ],
                        },
                        {
                            text: 'Data Display',
                            items: [
                                { text: 'Table', link: '/en/components/table' },
                                { text: 'VirtualScroll', link: '/en/components/virtual-scroll' },
                                { text: 'Timeline', link: '/en/components/timeline' },
                                { text: 'Progress', link: '/en/components/progress' },
                                { text: 'Counter', link: '/en/components/counter' },
                                { text: 'Marquee', link: '/en/components/marquee' },
                                { text: 'SketchyChart', link: '/en/components/sketchy-chart' },
                                { text: 'CodeBlock', link: '/en/components/code-block' },
                                { text: 'ChatBubble', link: '/en/components/chat-bubble' },
                                { text: 'TreeView', link: '/en/components/tree-view' },
                                { text: 'Descriptions', link: '/en/components/descriptions' },
                                { text: 'DataTable', link: '/en/components/data-table' },
                                { text: 'Image', link: '/en/components/image' },
                            ],
                        },
                        {
                            text: 'Navigation',
                            items: [
                                { text: 'Tabs', link: '/en/components/tabs' },
                                { text: 'Stepper', link: '/en/components/stepper' },
                                { text: 'Pagination', link: '/en/components/pagination' },
                                { text: 'Dropdown Menu', link: '/en/components/dropdown-menu' },
                                { text: 'Command', link: '/en/components/command' },
                                { text: 'Tour', link: '/en/components/tour' },
                            ],
                        },
                        {
                            text: 'Feedback',
                            items: [
                                { text: 'Dialog', link: '/en/components/dialog' },
                                { text: 'Alert Dialog', link: '/en/components/alert-dialog' },
                                { text: 'Sheet', link: '/en/components/sheet' },
                                { text: 'Popover', link: '/en/components/popover' },
                                { text: 'Popconfirm', link: '/en/components/popconfirm' },
                                { text: 'Tooltip', link: '/en/components/tooltip' },
                                { text: 'Toast', link: '/en/components/toast' },
                                { text: 'Alert', link: '/en/components/alert' },
                                { text: 'Loading', link: '/en/components/loading' },
                                { text: 'Result', link: '/en/components/result' },
                                { text: 'Message', link: '/en/components/message' },
                            ],
                        },
                        {
                            text: 'Date & Time',
                            items: [
                                { text: 'Calendar', link: '/en/components/calendar' },
                                { text: 'DatePicker', link: '/en/components/date-picker' },
                            ],
                        },
                        {
                            text: 'Other',
                            items: [
                                { text: 'GlitchText', link: '/en/components/glitch-text' },
                                { text: 'TypewriterText', link: '/en/components/typewriter-text' },
                                { text: 'BeforeAfter', link: '/en/components/before-after' },
                                { text: 'ScratchCard', link: '/en/components/scratch-card' },
                                { text: 'NoiseBackground', link: '/en/components/noise-background' },
                                { text: 'KanbanBoard', link: '/en/components/kanban-board' },
                                { text: 'ColorModeSwitcher', link: '/en/components/color-mode-switcher' },
                                { text: 'InfiniteScroll', link: '/en/components/infinite-scroll' },
                                { text: 'Watermark', link: '/en/components/watermark' },
                                { text: 'Backtop', link: '/en/components/backtop' },
                            ],
                        },
                    ],
                    '/en/blocks/': [
                        { text: 'Overview', link: '/en/blocks/' },
                        {
                            text: 'Cards & Components',
                            items: [
                                { text: 'Auth Card', link: '/en/blocks/auth-card' },
                                { text: 'Feedback Form', link: '/en/blocks/feedback-form' },
                                { text: 'Cookie Consent', link: '/en/blocks/cookie-consent' },
                            ],
                        },
                        {
                            text: 'Sections',
                            items: [
                                { text: 'Brutalist Hero', link: '/en/blocks/brutalist-hero' },
                                { text: 'Pricing Section', link: '/en/blocks/pricing-section' },
                                { text: 'Dashboard Shell', link: '/en/blocks/dashboard-shell' },
                                { text: 'Header Section', link: '/en/blocks/header-section' },
                                { text: 'Footer Section', link: '/en/blocks/footer-section' },
                            ],
                        },
                    ],
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
        ['meta', { property: 'og:description', content: 'Neo-Brutalism 风格 Vue 3 组件库' }],
        ['meta', { property: 'og:image', content: 'https://lidaixingchen.github.io/brutxui-vue3/og-image.svg' }],
        ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
        ['meta', { name: 'twitter:title', content: 'BrutxUI' }],
        ['meta', { name: 'twitter:description', content: 'Neo-Brutalism 风格 Vue 3 组件库' }],
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
        const isEn = pageUrl.startsWith('en/')
        const basePath = isEn ? pageUrl.replace(/^en\//, '') : pageUrl
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
                        { text: '版本历史', link: '/guide/changelog' },
                        { text: '贡献指南', link: '/guide/contributing' },
                    ],
                },
            ],
            '/components/': [
                {
                    text: '组件总览',
                    link: '/components/',
                },
                {
                    text: '基础',
                    items: [
                        { text: 'Button 按钮', link: '/components/button' },
                        { text: 'Badge 徽标', link: '/components/badge' },
                        { text: 'Label 标签', link: '/components/label' },
                        { text: 'Kbd 键盘按键', link: '/components/kbd' },
                        { text: 'Separator 分隔线', link: '/components/separator' },
                        { text: 'Spinner 加载指示器', link: '/components/spinner' },
                        { text: 'Skeleton 骨架屏', link: '/components/skeleton' },
                        { text: 'Avatar 头像', link: '/components/avatar' },
                        { text: 'CopyToClipboard 复制按钮', link: '/components/copy-to-clipboard' },
                    ],
                },
                {
                    text: '布局',
                    items: [
                        { text: 'Card 卡片', link: '/components/card' },
                        { text: 'Card3D 3D 悬浮卡片', link: '/components/card-3d' },
                        { text: 'Accordion 折叠面板', link: '/components/accordion' },
                        { text: 'Scroll Area 滚动区域', link: '/components/scroll-area' },
                        { text: 'Carousel 轮播图', link: '/components/carousel' },
                        { text: 'Breadcrumb 面包屑', link: '/components/breadcrumb' },
                        { text: 'Menu 导航菜单', link: '/components/menu' },
                    ],
                },
                {
                    text: '表单',
                    items: [
                        { text: 'Input 输入框', link: '/components/input' },
                        { text: 'HardcoreInput 硬核输入框', link: '/components/hardcore-input' },
                        { text: 'NumberInput 数字输入框', link: '/components/number-input' },
                        { text: 'Textarea 文本域', link: '/components/textarea' },
                        { text: 'Checkbox 复选框', link: '/components/checkbox' },
                        { text: 'Radio Group 单选组', link: '/components/radio-group' },
                        { text: 'Switch 开关', link: '/components/switch' },
                        { text: 'Toggle 切换', link: '/components/toggle' },
                        { text: 'Toggle Group 切换组', link: '/components/toggle-group' },
                        { text: 'Select 选择器', link: '/components/select' },
                        { text: 'Combobox 组合框', link: '/components/combobox' },
                        { text: 'TreeSelect 树形选择器', link: '/components/tree-select' },
                        { text: 'Cascader 级联选择器', link: '/components/cascader' },
                        { text: 'Slider 滑块', link: '/components/slider' },
                        { text: 'TagsInput 标签输入', link: '/components/tags-input' },
                        { text: 'ColorPicker 颜色选择器', link: '/components/color-picker' },
                        { text: 'Transfer 穿梭框', link: '/components/transfer' },
                        { text: 'Rate 评分', link: '/components/rate' },
                        { text: 'Upload 上传', link: '/components/upload' },
                        { text: 'Form 表单', link: '/components/form' },
                    ],
                },
                {
                    text: '数据展示',
                    items: [
                        { text: 'Table 表格', link: '/components/table' },
                        { text: 'VirtualScroll 虚拟滚动', link: '/components/virtual-scroll' },
                        { text: 'Timeline 时间线', link: '/components/timeline' },
                        { text: 'Progress 进度条', link: '/components/progress' },
                        { text: 'Counter 数字滚动', link: '/components/counter' },
                        { text: 'Marquee 跑马灯', link: '/components/marquee' },
                        { text: 'SketchyChart 手绘图表', link: '/components/sketchy-chart' },
                        { text: 'CodeBlock 代码块', link: '/components/code-block' },
                        { text: 'ChatBubble 聊天气泡', link: '/components/chat-bubble' },
                        { text: 'TreeView 树形目录', link: '/components/tree-view' },
                        { text: 'Descriptions 描述列表', link: '/components/descriptions' },
                        { text: 'DataTable 数据表格', link: '/components/data-table' },
                        { text: 'Image 图片', link: '/components/image' },
                    ],
                },
                {
                    text: '导航',
                    items: [
                        { text: 'Tabs 标签页', link: '/components/tabs' },
                        { text: 'Stepper 步骤条', link: '/components/stepper' },
                        { text: 'Pagination 分页', link: '/components/pagination' },
                        { text: 'Dropdown Menu 下拉菜单', link: '/components/dropdown-menu' },
                        { text: 'Command 命令面板', link: '/components/command' },
                        { text: 'Tour 导览', link: '/components/tour' },
                    ],
                },
                {
                    text: '反馈',
                    items: [
                        { text: 'Dialog 对话框', link: '/components/dialog' },
                        { text: 'Alert Dialog 提示对话框', link: '/components/alert-dialog' },
                        { text: 'Sheet 抽屉', link: '/components/sheet' },
                        { text: 'Popover 弹出层', link: '/components/popover' },
                        { text: 'Popconfirm 气泡确认框', link: '/components/popconfirm' },
                        { text: 'Tooltip 工具提示', link: '/components/tooltip' },
                        { text: 'Toast 轻提示', link: '/components/toast' },
                        { text: 'Alert 提示', link: '/components/alert' },
                        { text: 'Loading 加载', link: '/components/loading' },
                        { text: 'Result 结果', link: '/components/result' },
                        { text: 'Message 消息提示', link: '/components/message' },
                    ],
                },
                {
                    text: '日期时间',
                    items: [
                        { text: 'Calendar 日历', link: '/components/calendar' },
                        { text: 'DatePicker 日期选择器', link: '/components/date-picker' },
                    ],
                },
                {
                    text: '其他',
                    items: [
                        { text: 'GlitchText 故障文本', link: '/components/glitch-text' },
                        { text: 'TypewriterText 打字机文本', link: '/components/typewriter-text' },
                        { text: 'BeforeAfter 对比滑块', link: '/components/before-after' },
                        { text: 'ScratchCard 刮刮卡', link: '/components/scratch-card' },
                        { text: 'NoiseBackground 噪点背景', link: '/components/noise-background' },
                        { text: 'KanbanBoard 看板', link: '/components/kanban-board' },
                        { text: 'ColorModeSwitcher 颜色模式切换', link: '/components/color-mode-switcher' },
                        { text: 'InfiniteScroll 无限滚动', link: '/components/infinite-scroll' },
                        { text: 'Watermark 水印', link: '/components/watermark' },
                        { text: 'Backtop 回到顶部', link: '/components/backtop' },
                    ],
                },
            ],
            '/blocks/': [
                {
                    text: '概览',
                    link: '/blocks/',
                },
                {
                    text: '卡片与组件',
                    items: [
                        { text: 'Auth Card 认证卡片', link: '/blocks/auth-card' },
                        { text: 'Feedback Form 反馈表单', link: '/blocks/feedback-form' },
                        { text: 'Cookie Consent Cookie 同意', link: '/blocks/cookie-consent' },
                    ],
                },
                {
                    text: '区块',
                    items: [
                        { text: 'Brutalist Hero 英雄区', link: '/blocks/brutalist-hero' },
                        { text: 'Pricing Section 定价区', link: '/blocks/pricing-section' },
                        { text: 'Dashboard Shell 仪表盘框架', link: '/blocks/dashboard-shell' },
                        { text: 'Header Section 顶部导航', link: '/blocks/header-section' },
                        { text: 'Footer Section 底部信息栏', link: '/blocks/footer-section' },
                    ],
                },
            ],
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
                '@': resolve(import.meta.dirname, '.vitepress'),
            },
        },
    },
})
