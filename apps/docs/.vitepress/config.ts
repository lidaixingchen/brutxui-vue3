import { resolve } from 'node:path'
import { defineConfig } from 'vitepress'

export default defineConfig({
    title: 'BrutxUI',
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
        const canonicalUrl = `https://lidaixingchen.github.io/brutxui-vue3/${pageUrl}`

        return [
            ['link', { rel: 'canonical', href: canonicalUrl }],
            ['meta', { property: 'og:url', content: canonicalUrl }],
            [
                'script',
                { type: 'application/ld+json' },
                JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'SoftwareSourceCode',
                    name: context.title ?? 'BrutxUI',
                    description: context.description ?? 'Neo-Brutalism 风格 Vue 3 组件库',
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
            message: 'Built with brute force.',
            copyright: `© ${new Date().getFullYear()} BrutxUI · MIT License`,
        },
        editLink: {
            pattern: 'https://github.com/lidaixingchen/brutxui-vue3/edit/main/apps/docs/:path',
            text: '在 GitHub 上编辑此页',
        },
    },
    vite: {
        resolve: {
            alias: {
                '@': resolve(import.meta.dirname, '.vitepress'),
            },
        },
    },
})
