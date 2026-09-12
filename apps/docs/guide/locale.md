---
title: 国际化
description: 了解 BrutxUI 的多语言支持与 52+ 组件本地化配置
---

# 国际化（i18n）

BrutxUI 内置轻量多语言系统，**默认语言为中文（zh-CN）**，同时提供英文（en）语言包。无需强制安装 `vue-i18n`，开箱即用。

---

## 设计原则

- **无需强制第三方依赖**：自带轻量级基于 Vue `provide/inject` 的 locale 系统，同时可无缝与 `vue-i18n` 联动协同；
- **默认中文**：所有组件的原生内置文本默认为简体中文（`zh-CN`）；
- **层级优先级**：`组件 props > 全局/子树 locale 配置 > 默认中文`；
- **响应式驱动**：支持传入 `Ref` 或 `ComputedRef` 语言包，语言切换实时无感刷新。

---

## 优先级链

组件文本的解析优先级从高到低：

```text
组件显式 Props > 组件 texts 局部 Props > provideLocale 注入值 > 全局插件配置 > 默认中文 (zh-CN)
```

---

## 快速上手

### 1. 默认中文（零配置）

不进行任何配置时，组件直接展示标准中文文本：

```vue
<template>
    <CommandInput />
    <!-- 默认 placeholder 显示 "输入命令或搜索..." -->
</template>
```

### 2. 全局配置语言包

在应用入口通过 `BrutxUIPlugin` 设置默认语言：

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import { BrutxUIPlugin, en } from 'brutx-ui-vue'

const app = createApp(App)
app.use(BrutxUIPlugin, { locale: en })
app.mount('#app')
```

---

## 响应式动态切换语言

`provideLocale` 接受 `MaybeRef<Locale>`，传入 `computed` 或 `ref` 时，语言切换将响应式更新所有后代组件：

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { provideLocale, zhCN, en, Button, CommandInput } from 'brutx-ui-vue'

const currentLang = ref<'zh' | 'en'>('zh')
const activeLocale = computed(() => (currentLang.value === 'en' ? en : zhCN))

// 向子树注入响应式 locale
provideLocale(activeLocale)

function toggleLanguage() {
    currentLang.value = currentLang.value === 'zh' ? 'en' : 'zh'
}
</script>

<template>
    <div class="flex flex-col gap-4 p-4">
        <div class="flex items-center gap-2">
            <Button variant="default" size="sm" @click="toggleLanguage">
                切换为 {{ currentLang === 'zh' ? 'English' : '中文' }}
            </Button>
        </div>
        <CommandInput />
    </div>
</template>
```

---

## 局部子树与降级覆盖

### 局部子树覆盖

使用 `provideLocale` 可以将某部分区域切换为不同语言，不影响外层其他模块：

```vue
<script setup lang="ts">
import { provideLocale, en, CommandInput } from 'brutx-ui-vue'

// 该组件及其所有后代组件渲染为英文
provideLocale(en)
</script>

<template>
    <div class="border-3 border-brutal p-4">
        <CommandInput />
    </div>
</template>
```

### 自定义回退链（Fallback Locale）

当自定义语言包仅翻译了部分键名时，支持设置 `fallbackLocale`：

```vue
<script setup lang="ts">
import { provideLocale, en } from 'brutx-ui-vue'

provideLocale({
    locale: en,
    fallbackLocale: {
        popconfirm: { confirm: '确定执行', cancel: '取消' },
    },
})
</script>
```

回退顺序：`当前 locale` → `自定义 fallbackLocale` → `内置 zhCN` → `返回 path 原文`。

---

## 自定义与深度合并

### 使用 mergeLocale 部分覆盖

通过 `mergeLocale` 深合并现有语言包，定制特定组件提示文案：

```ts
import { zhCN, mergeLocale } from 'brutx-ui-vue'

const customZh = mergeLocale(zhCN, {
    command: {
        placeholder: '键入快捷指令或检索文档...',
    },
    dataTable: {
        emptyText: '暂无符合筛选条件的数据记录',
    },
})
```

---

## 与 vue-i18n 共存

在集成 `vue-i18n` 的项目中，可在其变更时联动同步 BrutxUI 的语言：

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { provideLocale, zhCN, en } from 'brutx-ui-vue'

const { locale } = useI18n()

// 映射 vue-i18n 的 locale 到 BrutxUI 语言包
const brutxLocale = computed(() => (locale.value === 'en' ? en : zhCN))
provideLocale(brutxLocale)
</script>
```

---

## useLocale 组合式函数

在自定义组件中读取当前语言包或调用插值翻译：

```vue
<script setup lang="ts">
import { useLocale } from 'brutx-ui-vue'

const { locale, t } = useLocale()

// 普通键翻译
const placeholder = t('command.placeholder')

// 带占位符插值参数
const countLabel = t('combobox.selectedCount', { count: 5 }) // "已选 5 项"
const pageInfo = t('pagination.page', { number: 3 })         // "第 3 页"
</script>
```

---

## 支持的组件与文本键索引（52+ 组件）

| 模块 / 组件 | 语言包键前缀 | 核心文本键与插值说明 |
| :--- | :--- | :--- |
| **Command** | `command.*` | `placeholder`, `emptyText`, `dialogTitle`, `dialogDescription`, `searchLabel` |
| **Combobox** | `combobox.*` | `placeholder`, `multiPlaceholder`, `searchPlaceholder`, `emptyText`, `selectedCount` (`{count}`), `create` |
| **Pagination** | `pagination.*` | `firstPage`, `previousPage`, `nextPage`, `lastPage`, `page` (`{number}`), `perPageOption` (`{size}`), `total` (`{total}`) |
| **Carousel** | `carousel.*` | `previousSlide`, `nextSlide`, `goToSlide` (`{index}`) |
| **Spinner** | `spinner.*` | `loading` |
| **Button / Submit** | `submitButton.*` | `submitting` |
| **CopyToClipboard** | `copyToClipboard.*` | `copy`, `copied`, `copyFailed` |
| **BeforeAfter** | `beforeAfter.*` | `before`, `after`, `comparisonSlider` |
| **AuthCard** | `authCard.*` | `welcomeBack`, `signInToContinue`, `google`, `github`, `orEmailLogin`, `email`, `password`, `signIn`, `register` |
| **DashboardShell** | `dashboardShell.*` | `sidebarNavigation`, `signOut`, `brand`, `openNavigation`, `closeNavigation` |
| **BrutalistHero** | `brutalistHero.*` | `title`, `primaryCtaText`, `secondaryCtaText`, `neoBrutalismUI`, `defaultSubtitle` |
| **CardWindowHeader**| `cardWindowHeader.*`| `close`, `minimize`, `maximize` |
| **Toast** | `toast.*` | `close`, `container` |
| **Message** | `message.*` | `close` |
| **Dialog** | `dialog.*` | `close` |
| **MessageBox** | `messageBox.*` | `confirm`, `cancel` |
| **Sheet** | `sheet.*` | `close` |
| **Breadcrumb** | `breadcrumb.*` | `label`, `more` |
| **TreeView** | `treeView.*` | `fileTree` |
| **TreeSelect** | `treeSelect.*` | `placeholder`, `emptyText` |
| **Cascader** | `cascader.*` | `placeholder`, `emptyText` |
| **Transfer** | `transfer.*` | `availableTitle`, `selectedTitle`, `searchPlaceholder`, `emptyText`, `clearAll`, `selectAll`, `itemCount` (`{count}`) |
| **Stepper** | `stepper.*` | `progressSteps`, `step` (`{index}`, `{title}`) |
| **HeaderSection** | `headerSection.*` | `defaultLogoText`, `defaultCtaText`, `menuLabel` |
| **FooterSection** | `footerSection.*` | `defaultLogoText`, `defaultDescription`, `defaultCopyright` |
| **FeedbackForm** | `feedbackForm.*` | `defaultTitle`, `defaultDescription`, `defaultSubmitText`, `successTitle`, `nameLabel`, `emailLabel`, `messageLabel` |
| **CookieConsent** | `cookieConsent.*` | `defaultTitle`, `defaultDescription`, `defaultAcceptText`, `defaultDeclineText` |
| **DataTable** | `dataTable.*` | `emptyText`, `searchPlaceholder`, `selectedCount` (`{count}`) |
| **FormWizard** | `formWizard.*` | `previous`, `next`, `submit` |
| **ChatBubble** | `chatBubble.*` | `delivered`, `read` |
| **ScratchCard** | `scratchCard.*` | `ariaLabel` |
| **SketchyChart** | `sketchyChart.*` | `lineAriaLabel`, `barAriaLabel`, `pieAriaLabel` |
| **Card3D** | `card3d.*` | `ariaLabel` |
| **Avatar** | `avatar.*` | `fallback` |
| **HardcoreInput** | `hardcoreInput.*` | `invalidInput` |
| **CodeBlock** | `codeBlock.*` | `copy`, `copied`, `expand`, `collapse` |
| **Calendar** | `calendar.*` | `previousMonth`, `nextMonth` |
| **DatePicker** | `datePicker.*` | `placeholder`, `clear` |
| **ColorPicker** | `colorPicker.*` | `placeholder`, `clear` |
| **Kanban** | `kanban.*` | `dropCardsHere`, `addCard`, `cardGrabbed`, `cardReleased`, `cardMoved`, `cardMovedToColumn` (`{column}`) |
| **Timeline** | `timeline.*` | `label` |
| **Tabs** | `tabs.*` | `more` |
| **PricingSection** | `pricingSection.*` | `defaultTitle`, `mostPopular`, `perLifetime`, `planStarterName`, `planProName`, `planEnterpriseName` |
| **ColorModeSwitcher**| `colorModeSwitcher.*`| `light`, `dark`, `system`, `toggleTheme` |
| **Input / NumberInput / Textarea** | `input.*` / `numberInput.*` / `textarea.*` | `placeholder` |
| **VirtualScroll / InfiniteScroll** | `virtualScroll.*` / `infiniteScroll.*` | `emptyText` / `loading` |
| **Switch / Checkbox**| `switch.*` / `checkbox.*` | `checked`, `unchecked` |
| **TagsInput** | `tagsInput.*` | `placeholder`, `remove` |
| **Badge / Alert** | `badge.*` / `alert.*` | `close` |
| **Popconfirm** | `popconfirm.*` | `confirm`, `cancel` |
| **Upload** | `upload.*` | `dragText`, `browseText`, `maxSizeError`, `limitError` (`{limit}`), `retry` |
| **Tour** | `tour.*` | `prev`, `next`, `finish`, `skip` |
| **Statistic** | `statistic.*` | `empty`, `up`, `down` |
| **Countdown** | `countdown.*` | `finished` |
