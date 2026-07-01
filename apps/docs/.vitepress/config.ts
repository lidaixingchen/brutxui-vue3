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
                                { text: 'Best Practices', link: '/en/guide/best-practices' },
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
                                { text: 'Slider', link: '/en/components/slider' },
                                { text: 'TagsInput', link: '/en/components/tags-input' },
                                { text: 'ColorPicker', link: '/en/components/color-picker' },
                                { text: 'Upload', link: '/en/components/upload' },
                                { text: 'Form', link: '/en/components/form' },
                                { text: 'Submit Button', link: '/en/components/submit-button' },
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
                                { text: 'Dashboard Stats', link: '/en/components/dashboard-stats' },
                                { text: 'DataTable', link: '/en/components/data-table' },
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
                                { text: 'GlitchButton', link: '/en/components/glitch-button' },
                                { text: 'TypewriterText', link: '/en/components/typewriter-text' },
                                { text: 'BeforeAfter', link: '/en/components/before-after' },
                                { text: 'ScratchCard', link: '/en/components/scratch-card' },
                                { text: 'NoiseBackground', link: '/en/components/noise-background' },
                                { text: 'SaaS Pricing', link: '/en/components/saas-pricing' },
                                { text: 'KanbanBoard', link: '/en/components/kanban-board' },
                                { text: 'ColorModeSwitcher', link: '/en/components/color-mode-switcher' },
                                { text: 'InfiniteScroll', link: '/en/components/infinite-scroll' },
                            ],
                        },
                    ],
                    '/en/blocks/': [
                        { text: 'Overview', link: '/en/blocks/' },
                        {
                            text: 'Cards & Components',
                            items: [
                                { text: 'Auth Card', link: '/en/blocks/auth-card' },
                                { text: 'Testimonial Card', link: '/en/blocks/testimonial-card' },
                                { text: 'Blog Card', link: '/en/blocks/blog-card' },
                                { text: 'File Card', link: '/en/blocks/file-card' },
                                { text: 'Error Card', link: '/en/blocks/error-card' },
                                { text: 'Success Card', link: '/en/blocks/success-card' },
                                { text: 'Upload Card', link: '/en/blocks/upload-card' },
                                { text: 'Empty State', link: '/en/blocks/empty-state' },
                                { text: 'Quick Actions', link: '/en/blocks/quick-actions' },
                                { text: 'Tabs Nav', link: '/en/blocks/tabs-nav' },
                                { text: 'Search Widget', link: '/en/blocks/search-widget' },
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
                                { text: 'FAQ Section', link: '/en/blocks/faq-section' },
                                { text: 'Data Table Section', link: '/en/blocks/data-table-section' },
                                { text: 'Stepper Section', link: '/en/blocks/stepper-section' },
                                { text: 'Chart Section', link: '/en/blocks/chart-section' },
                                { text: 'Gallery Section', link: '/en/blocks/gallery-section' },
                            ],
                        },
                        {
                            text: 'Pages',
                            items: [
                                { text: 'Waitlist Page', link: '/en/blocks/waitlist-page' },
                                { text: 'Not Found Page', link: '/en/blocks/not-found-page' },
                                { text: 'Loading Page', link: '/en/blocks/loading-page' },
                                { text: 'Settings Page', link: '/en/blocks/settings-page' },
                                { text: 'Blog List Page', link: '/en/blocks/blog-list-page' },
                                { text: 'Overview Page', link: '/en/blocks/overview-page' },
                                { text: 'Activity Log Page', link: '/en/blocks/activity-log-page' },
                                { text: 'Profile Page', link: '/en/blocks/profile-page' },
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
                        { text: 'Slider 滑块', link: '/components/slider' },
                        { text: 'TagsInput 标签输入', link: '/components/tags-input' },
                        { text: 'ColorPicker 颜色选择器', link: '/components/color-picker' },
                        { text: 'Upload 上传', link: '/components/upload' },
                        { text: 'Form 表单', link: '/components/form' },
                        { text: 'Submit Button 提交按钮', link: '/components/submit-button' },
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
                        { text: 'Dashboard Stats 仪表盘统计', link: '/components/dashboard-stats' },
                        { text: 'DataTable 数据表格', link: '/components/data-table' },
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
                        { text: 'GlitchButton 故障按钮', link: '/components/glitch-button' },
                        { text: 'TypewriterText 打字机文本', link: '/components/typewriter-text' },
                        { text: 'BeforeAfter 对比滑块', link: '/components/before-after' },
                        { text: 'ScratchCard 刮刮卡', link: '/components/scratch-card' },
                        { text: 'NoiseBackground 噪点背景', link: '/components/noise-background' },
                        { text: 'SaaS Pricing 定价', link: '/components/saas-pricing' },
                        { text: 'KanbanBoard 看板', link: '/components/kanban-board' },
                        { text: 'ColorModeSwitcher 颜色模式切换', link: '/components/color-mode-switcher' },
                        { text: 'InfiniteScroll 无限滚动', link: '/components/infinite-scroll' },
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
                        { text: 'Testimonial Card 评价卡片', link: '/blocks/testimonial-card' },
                        { text: 'Blog Card 博客卡片', link: '/blocks/blog-card' },
                        { text: 'File Card 文件卡片', link: '/blocks/file-card' },
                        { text: 'Error Card 错误卡片', link: '/blocks/error-card' },
                        { text: 'Success Card 成功卡片', link: '/blocks/success-card' },
                        { text: 'Upload Card 上传卡片', link: '/blocks/upload-card' },
                        { text: 'Empty State 空状态', link: '/blocks/empty-state' },
                        { text: 'Quick Actions 快捷操作', link: '/blocks/quick-actions' },
                        { text: 'Tabs Nav 标签导航', link: '/blocks/tabs-nav' },
                        { text: 'Search Widget 搜索组件', link: '/blocks/search-widget' },
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
                        { text: 'FAQ Section 常见问题', link: '/blocks/faq-section' },
                        { text: 'Data Table Section 数据表格', link: '/blocks/data-table-section' },
                        { text: 'Stepper Section 步骤导航', link: '/blocks/stepper-section' },
                        { text: 'Chart Section 图表区', link: '/blocks/chart-section' },
                        { text: 'Gallery Section 画廊区', link: '/blocks/gallery-section' },
                    ],
                },
                {
                    text: '页面',
                    items: [
                        { text: 'Waitlist Page 等候列表页', link: '/blocks/waitlist-page' },
                        { text: 'Not Found Page 404 页面', link: '/blocks/not-found-page' },
                        { text: 'Loading Page 加载页', link: '/blocks/loading-page' },
                        { text: 'Settings Page 设置页', link: '/blocks/settings-page' },
                        { text: 'Blog List Page 博客列表页', link: '/blocks/blog-list-page' },
                        { text: 'Overview Page 概览页', link: '/blocks/overview-page' },
                        { text: 'Activity Log Page 活动日志页', link: '/blocks/activity-log-page' },
                        { text: 'Profile Page 个人资料页', link: '/blocks/profile-page' },
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
