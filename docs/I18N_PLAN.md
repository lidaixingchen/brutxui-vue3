# BrutxUI 文档国际化（i18n）改造方案

## 概述

本文档描述了为 BrutxUI 文档网站添加英文版本的完整改造方案。当前文档仅有中文版本，需要支持英文以扩大国际用户群体。

---

## 1. 核心策略

| 项目 | 方案 |
| --- | --- |
| **多语言框架** | VitePress 原生 `locales` 配置 |
| **中文路径** | 保持 `root` 不变，现有 URL 零影响 |
| **英文路径** | `/en/` 前缀，如 `/en/components/button` |
| **翻译范围** | 配置文本 + 文档内容 + SEO meta |

---

## 2. 配置改造

修改 `apps/docs/.vitepress/config.ts`，添加英文 locale 配置：

```ts
export default defineConfig({
  lang: 'zh-CN',
  locales: {
    root: {
      label: '简体中文',
      // ... 保持现有中文配置不变
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
            {
              text: 'Getting Started',
              link: '/en/guide/getting-started',
            },
            {
              text: 'Installation',
              items: [
                { text: 'Vite', link: '/en/guide/installation-vite' },
                { text: 'Manual', link: '/en/guide/installation-manual' },
              ],
            },
            {
              text: 'CLI',
              link: '/en/guide/cli',
            },
            {
              text: 'Theme & Tokens',
              link: '/en/guide/theme',
            },
            {
              text: 'Theme Playground',
              link: '/en/guide/theme-playground',
            },
            {
              text: 'Internationalization',
              link: '/en/guide/locale',
            },
            {
              text: 'AI Integration',
              link: '/en/guide/ai',
            },
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
            {
              text: 'Overview',
              link: '/en/components/',
            },
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
              ],
            },
          ],
          '/en/blocks/': [
            {
              text: 'Overview',
              link: '/en/blocks/',
            },
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
              button: {
                buttonText: 'Search docs',
                buttonAriaLabel: 'Search docs',
              },
              modal: {
                displayDetails: 'Display details',
                resetButtonTitle: 'Reset search',
                backButtonTitle: 'Go back',
                noResultsText: 'No results found',
                footer: {
                  selectText: 'Select',
                  navigateText: 'Navigate',
                  closeText: 'Close',
                },
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
  // ... 其余配置
})
```

---

## 3. 文件目录结构

```text
apps/docs/
├── index.md                    # 中文首页 (root)
├── guide/
│   ├── getting-started.md      # 中文
│   ├── cli.md
│   └── ...
├── components/
│   ├── button.md               # 中文
│   └── ...
├── blocks/
│   └── ...
└── en/                         # 英文版本
    ├── index.md                # 英文首页
    ├── guide/
    │   ├── getting-started.md
    │   ├── cli.md
    │   └── ...
    ├── components/
    │   ├── button.md
    │   └── ...
    └── blocks/
        └── ...
```

---

## 4. SEO 优化

### 4.1 hreflang 标签

在 `transformHead` 中添加 `hreflang` 标签，确保搜索引擎正确识别多语言版本：

```ts
transformHead(context) {
  const pageUrl = context.page.replace(/\.md$/, '').replace(/\/index$/, '')
  const isEn = pageUrl.startsWith('en/')
  const basePath = isEn ? pageUrl.replace(/^en\//, '') : pageUrl
  const baseUrl = 'https://lidaixingchen.github.io/brutxui-vue3'

  return [
    // hreflang 标签
    ['link', { rel: 'alternate', hreflang: 'zh-CN', href: `${baseUrl}/${basePath}` }],
    ['link', { rel: 'alternate', hreflang: 'en', href: `${baseUrl}/en/${basePath}` }],
    ['link', { rel: 'alternate', hreflang: 'x-default', href: `${baseUrl}/${basePath}` }],
    // canonical URL — 根据当前语言动态生成
    ['link', { rel: 'canonical', href: isEn ? `${baseUrl}/en/${basePath}` : `${baseUrl}/${basePath}` }],
    // OG/Twitter meta — 根据当前语言动态生成
    ['meta', { property: 'og:url', content: isEn ? `${baseUrl}/en/${basePath}` : `${baseUrl}/${basePath}` }],
    ['meta', { property: 'og:description', content: isEn ? context.description ?? 'Neo-Brutalism Vue 3 Component Library' : context.description ?? 'Neo-Brutalism 风格 Vue 3 组件库' }],
    ['meta', { name: 'twitter:description', content: isEn ? context.description ?? 'Neo-Brutalism Vue 3 Component Library' : context.description ?? 'Neo-Brutalism 风格 Vue 3 组件库' }],
  ]
}
```

### 4.2 JSON-LD 结构化数据

当前 `transformHead` 中的 JSON-LD 使用了中文硬编码描述，英文页面需要动态切换：

```ts
// 在 transformHead 返回数组中追加
[
  'script',
  { type: 'application/ld+json' },
  JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: context.title ?? 'BrutxUI',
    description: isEn
      ? (context.description ?? 'Neo-Brutalism Vue 3 Component Library')
      : (context.description ?? 'Neo-Brutalism 风格 Vue 3 组件库'),
    url: isEn ? `${baseUrl}/en/${basePath}` : `${baseUrl}/${basePath}`,
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
```

### 4.3 Sitemap

VitePress 内置 sitemap 插件会自动为所有页面生成 `<url>` 条目，但不会自动添加 `<xhtml:link rel="alternate" hreflang="...">`。如需完整的多语言 sitemap，可在 `transformPageData` 中为每个页面注入 `alternates` 元数据，或在构建后使用脚本注入 hreflang 链接。

**初期可先依赖 `hreflang` 标签，暂不处理 sitemap 中的 hreflang。**

---

## 5. 主题组件 i18n

VitePress 自定义主题中存在硬编码中文文本，需要同步处理。这些组件被所有页面共享，如果不处理，英文页面中仍会显示中文。

### 5.1 需要 i18n 处理的组件清单

| 组件 | 文件路径 | 硬编码文本 |
| --- | --- | --- |
| **InstallationTabs** | `.vitepress/theme/components/InstallationTabs.vue` | `手动`、`安装依赖`、`从 GitHub 复制组件源码`、`保存到你的项目`、`导入并使用`、`在 GitHub 上查看` |
| **HomeCodePreview** | `.vitepress/theme/components/HomeCodePreview.vue` | 首页代码预览区的中文注释 |
| **HomeComponentShowcase** | `.vitepress/theme/components/HomeComponentShowcase.vue` | 首页组件展示区的描述文本 |
| **HomeStats** | `.vitepress/theme/components/HomeStats.vue` | 统计信息的标签文本 |

**无需处理的组件：**

- `ComponentPreview` — 徽标文本 "Preview" 中英文一致，属于设计元素
- `CopyButton` — 纯图标按钮，无文本
- `ThemeToggle` — 纯图标按钮，无文本

### 5.2 实现策略

使用 VitePress 提供的 `useData()` composable 获取当前语言，动态切换文案：

```vue
<script setup>
import { useData } from 'vitepress'

const { lang } = useData()

const i18n = {
  'zh-CN': {
    manual: '手动',
    installDeps: '安装依赖',
    copyFromGitHub: '从 GitHub 复制组件源码',
    saveToProject: '保存到你的项目',
    importAndUse: '导入并使用',
    viewOnGitHub: '在 GitHub 上查看',
  },
  en: {
    manual: 'Manual',
    installDeps: 'Install dependencies',
    copyFromGitHub: 'Copy source from GitHub',
    saveToProject: 'Save to your project',
    importAndUse: 'Import and use',
    viewOnGitHub: 'View on GitHub',
  },
} as const

const t = (key: keyof typeof i18n['zh-CN']) => {
  const locale = lang.value.startsWith('zh') ? 'zh-CN' : 'en'
  return i18n[locale][key]
}
</script>
```

**注意事项：** 首页的 `<HomeCodePreview />`、`<HomeComponentShowcase />`、`<HomeStats />` 组件需要创建对应的英文版本首页 `en/index.md`，在其中使用不同的组件或通过 prop 切换语言。

---

## 6. 翻译内容分层

| 层级 | 内容 | 工作量 | 优先级 |
| --- | --- | --- | --- |
| **L0 - 主题组件层** | InstallationTabs、首页组件等硬编码中文 | 小 | P0 |
| **L1 - 配置层** | nav、sidebar、footer、search UI 文本 | 小 | P0 |
| **L2 - 框架层** | guide/*.md（快速开始、安装、CLI 等） | 中 | P1 |
| **L3 - 组件层** | components/*.md（约 60+ 组件文档） | 大 | P2 |
| **L4 - 区块层** | blocks/*.md（约 30+ 区块文档） | 大 | P3 |

---

## 7. 翻译原则

### 7.1 不翻译的内容

- **代码示例**：Vue 代码块中的变量名、函数名保持英文原样
- **组件名**：`Button`、`Input`、`Dialog` 等组件名保持英文
- **技术术语**：`props`、`slots`、`events`、`CSS`、`TypeScript` 等
- **Demo 组件**：英文文档可直接引用同一个 `<ButtonDemo />` 组件

### 7.2 需要翻译的内容

- **标题和描述**：文档标题、frontmatter 中的 description
- **段落文本**：说明文字、注意事项、最佳实践
- **表格内容**：Props 表格中的描述列
- **注释**：代码示例中的中文注释（可选）

### 7.3 翻译风格

- 使用简洁的技术文档语言
- 保持与中文版本相同的结构和层级
- 避免过度意译，保持技术准确性

---

## 8. 英文文档模板

### 组件文档模板

````markdown
---
title: Button
description: Neo-Brutalism button component with 9 color variants, loading animation and keyboard navigation.
---

# Button

Neo-Brutalism button component supporting 9 variants, 4 sizes + icon mode, loading state and `asChild` composition.

## Demo

<ComponentPreview>
  <ButtonDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="button" />

## Usage

```vue
<script setup>
import { Button } from 'brutx-ui-vue'
</script>

<template>
    <Button variant="primary" size="default">
        Click me
    </Button>
</template>
```

### Loading State

```vue
<script setup>
import { ref } from 'vue'
import { Button } from 'brutx-ui-vue'

const isLoading = ref(false)

async function handleSubmit() {
    isLoading.value = true
    await new Promise(resolve => setTimeout(resolve, 2000))
    isLoading.value = false
}
</script>

<template>
    <Button variant="primary" :loading="isLoading" @click="handleSubmit">
        Save Changes
    </Button>
</template>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| variant | `'primary' \| 'secondary' \| 'outline' \| ...` | `'primary'` | Button style variant |
| size | `'sm' \| 'default' \| 'lg' \| 'icon'` | `'default'` | Button size |
| loading | `boolean` | `false` | Show loading spinner |
| disabled | `boolean` | `false` | Disable the button |
| asChild | `boolean` | `false` | Render as child element |

## Events

| Event | Payload | Description |
| --- | --- | --- |
| click | `MouseEvent` | Emitted when button is clicked |
````

---

## 9. 实施计划

### 阶段 1：配置层（2 天）

- [ ] 修改 `config.ts` 添加英文 locale 配置
- [ ] 创建 `en/` 目录结构
- [ ] 添加英文首页 `en/index.md`
- [ ] 配置 SEO hreflang、JSON-LD、canonical URL
- [ ] 国际化 `InstallationTabs` 组件（使用 `useData().lang` 切换文案）
- [ ] 国际化首页组件（HomeCodePreview、HomeComponentShowcase、HomeStats）
- [ ] 创建 `<TranslationBanner />` 组件用于未翻译页面的降级提示
- [ ] 验证语言切换功能

### 阶段 2：框架文档（2 天）

- [ ] 翻译 `guide/getting-started.md`
- [ ] 翻译 `guide/installation-vite.md`
- [ ] 翻译 `guide/installation-manual.md`
- [ ] 翻译 `guide/cli.md`
- [ ] 翻译 `guide/theme.md`
- [ ] 翻译 `guide/theme-playground.md`
- [ ] 翻译 `guide/locale.md`
- [ ] 翻译 `guide/ai.md`
- [ ] 翻译 `guide/best-practices.md`
- [ ] 翻译 `guide/faq.md`
- [ ] 翻译 `guide/contributing.md`

### 阶段 3：组件文档（5 天）

按优先级分批翻译：

#### P0 - 核心组件（2 天）

- [ ] Button
- [ ] Input
- [ ] Select
- [ ] Checkbox
- [ ] Radio Group
- [ ] Switch
- [ ] Dialog
- [ ] Alert Dialog
- [ ] Toast
- [ ] Form

#### P1 - 常用组件（2 天）

- [ ] Card
- [ ] Tabs
- [ ] Table
- [ ] Dropdown Menu
- [ ] Popover
- [ ] Tooltip
- [ ] Avatar
- [ ] Badge
- [ ] Progress
- [ ] Skeleton

#### P2 - 其他组件（1 天）

- [ ] 剩余组件文档

### 阶段 4：区块文档（3 天）

- [ ] 翻译所有 blocks/*.md 文档

> **工作量说明：** 以上估算基于 AI 辅助翻译 + 人工校对的模式。67 个组件文档约 13,000-27,000 行、35 个区块文档约 5,000-10,500 行需翻译。若纯人工翻译，建议将阶段 3 上调至 8 天、阶段 4 上调至 5 天。总计约 12 个工作日（AI 辅助）或 17 个工作日（纯人工）。

---

## 10. 注意事项

### 10.1 技术细节

- **Demo 组件复用**：英文文档直接引用同一个 Vue Demo 组件，无需重复创建
- **代码块语言**：使用 ` ```vue ` 而不是 ` ```html ` 保持一致性
- **链接路径**：英文文档中的链接需要添加 `/en/` 前缀
- **Changelog 页面**：`guide/changelog.md` 通常由自动化脚本从 `CHANGELOG.md` 同步生成，翻译维护成本极高。建议英文版 changelog 直接使用英文原始内容（changelog 本身为版本记录，中英文混排可接受），或仅翻译页面框架文本，版本条目保持英文原样

### 10.2 维护策略

- **同步更新**：中文文档更新时，英文文档也需要同步更新
- **翻译标记**：可使用 `<!-- TODO: Translate -->` 标记待翻译内容
- **社区贡献**：欢迎社区贡献英文翻译

### 10.3 渐进式迁移与降级策略

采用渐进式发布，未翻译的页面提供合理的降级体验：

#### 方案 A：翻译提示横幅（推荐）

创建一个 `<TranslationBanner />` 组件，在未翻译的英文页面顶部显示提示：

```vue
<template>
  <div v-if="!isTranslated" class="translation-banner">
    This page is currently available in Chinese only.
    <a :href="chineseUrl">Switch to Chinese</a>
  </div>
</template>
```

在 frontmatter 中添加 `translated: true/false` 字段来标记翻译状态，已翻译的页面不显示横幅。

#### 方案 B：VitePress 路由守卫

在主题的 `Layout.vue` 中检测当前页面是否存在对应的英文 md 文件，若不存在则自动重定向到中文版本。

**不推荐的做法：** 使用 VitePress 的 `notFound` 页面——这会返回 404 状态码，对 SEO 不利。

### 10.4 CI/CD 与构建

- **构建产物大小**：英文文档预计增加约 30-40% 的构建产物（主要是额外的 HTML 和索引文件），对 GitHub Pages 部署无显著影响
- **链接检查**：在 CI 中添加英文文档的死链检查，确保 `/en/` 前缀的链接全部有效。可使用 `markdown-link-check` 或 `lychee` 工具
- **GitHub Actions**：无需修改现有部署流程，VitePress 构建会自动包含所有 locale 的页面
- **PR 检查**：建议在 CI 中添加检查，确保新增的中文文档有对应的 `<!-- TODO: Translate -->` 标记或已同步翻译

### 10.5 质量保障

翻译完成后需通过以下检查：

1. **构建验证**：`pnpm docs:build` 无错误
2. **死链检查**：英文文档中所有内部链接（`/en/...`）均可访问
3. **语言切换**：顶部语言切换器在所有页面（包括组件页、指南页、首页）均正常工作
4. **SEO 验证**：使用 Google Search Console 的 URL 检查工具验证 hreflang 标签正确
5. **风格检查**（可选）：使用 `vale` 对英文文档进行英文技术写作风格检查

---

## 11. 参考资源

- [VitePress 国际化文档](https://vitepress.dev/guide/i18n)
- [VitePress 多语言配置](https://vitepress.dev/reference/site-config#locales)
- [VitePress Runtime API](https://vitepress.dev/reference/runtime-api#usedata)（`useData()` 获取当前语言）
- [MDN hreflang 标签](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link#hreflang)

---

*文档版本：v1.1*
*最后更新：2026-06-30*
