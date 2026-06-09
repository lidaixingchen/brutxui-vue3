# BrutxUI 设计令牌与主题参考

本文件包含完整的 CSS 变量定义、主题预设说明、暗色模式支持和国际化 API。当需要自定义主题、查看设计令牌或配置多语言时读取此文件。

## 目录

- [CSS 变量](#css-变量)
- [Tailwind 工具类](#tailwind-工具类)
- [主题预设](#主题预设)
- [暗色模式](#暗色模式)
- [useTheme 组合式函数](#usetheme-组合式函数)
- [国际化](#国际化)

---

## CSS 变量

BrutxUI 使用 CSS 自定义属性定义设计令牌，便于主题切换和自定义：

| 令牌 | 亮色模式 | 暗色模式 | 用途 |
| --- | --- | --- | --- |
| `--brutal-border-width` | `3px` | `3px` | 边框粗细 |
| `--brutal-border-color` | `#000000` | `#ffffff` | 边框颜色 |
| `--brutal-shadow-offset-x` | `4px` | `4px` | 阴影水平偏移 |
| `--brutal-shadow-offset-y` | `4px` | `4px` | 阴影垂直偏移 |
| `--brutal-shadow-color` | `#000000` | `#ffffff` | 阴影颜色 |
| `--brutal-radius` | `0px` | `0px` | 圆角 |
| `--brutal-bg` | `#ffffff` | `#141414` | 背景颜色 |
| `--brutal-fg` | `#000000` | `#ffffff` | 前景（文本）颜色 |
| `--brutal-primary` | `#FF6B6B` | `#FF6B6B` | 主色（珊瑚红） |
| `--brutal-secondary` | `#4ECDC4` | `#4ECDC4` | 辅助色（薄荷青） |
| `--brutal-accent` | `#FFE66D` | `#FFE66D` | 强调色（黄色） |
| `--brutal-destructive` | `#EF476F` | `#EF476F` | 危险/错误颜色 |
| `--brutal-success` | `#7FB069` | `#7FB069` | 成功颜色 |
| `--brutal-muted` | `#f3f4f6` | `#1e1e1e` | 柔和背景 |
| `--brutal-muted-foreground` | `#4B5563` | `#9CA3AF` | 柔和文本颜色 |
| `--brutal-ring` | `#000000` | `#ffffff` | 焦点环颜色 |
| `--brutal-pressed-offset` | `2px` | `2px` | 按压状态 Y 轴偏移 |
| `--brutal-info` | `#4A90D9` | `#3B82F6` | 信息颜色 |
| `--brutal-overlay` | `rgba(0,0,0,0.5)` | `rgba(0,0,0,0.7)` | 遮罩背景 |
| `--brutal-placeholder` | `#9CA3AF` | `#6B7280` | 占位符文本颜色 |

### 自定义主题

通过覆盖 CSS 变量实现自定义主题：

```css
/* 全局自定义 */
:root {
  --brutal-primary: #8B5CF6;     /* 改为紫色 */
  --brutal-secondary: #06B6D4;   /* 改为青色 */
  --brutal-accent: #f59e0b;      /* 改为琥珀色 */
  --brutal-border-width: 4px;    /* 更粗的边框 */
  --brutal-shadow-offset-x: 6px; /* 更大的阴影 */
  --brutal-shadow-offset-y: 6px;
}

/* 局部自定义 */
.sidebar {
  --brutal-primary: #8B5CF6;
  --brutal-border-width: 2px;
}
```

```vue
<template>
  <div class="my-brand">
    <Button variant="primary">自定义主题按钮</Button>
  </div>
</template>
```

如果用户想先可视化调参，使用 docs 的“主题实验室”（`/guide/theme-playground`）。它基于 `classic`、`pastel`、`mono` 调节 token，提供产品预览、组件矩阵、对比度检查和 token 覆盖率，并生成可复制的 `.theme-custom` CSS：

```html
<div class="theme-custom">
  <!-- Your app -->
</div>
```

主题实验室只生成 CSS 变量，不扩展 `useTheme()` 的内置主题类型。

---

## Tailwind 工具类

### 边框

```vue
<div class="border-3 border-brutal rounded-brutal">
```

| 类名 | 映射到 |
| --- | --- |
| `border-3` | `border-width: var(--brutal-border-width)` |
| `border-brutal` | `border-color: var(--brutal-border-color)` |
| `rounded-brutal` | `border-radius: var(--brutal-radius)` |

### 阴影

```vue
<div class="shadow-brutal">          <!-- 标准阴影（4px 4px） -->
<div class="shadow-brutal-sm">       <!-- 小阴影（2px 2px） -->
<div class="shadow-brutal-lg">       <!-- 大阴影（6px 6px） -->
<div class="shadow-brutal-xl">       <!-- 超大阴影（8px 8px） -->
<div class="shadow-brutal-primary">  <!-- 主色阴影 -->
<div class="shadow-brutal-secondary"> <!-- 辅助色阴影 -->
```

| 类名 | 偏移量 |
| --- | --- |
| `shadow-brutal` | 4px 4px |
| `shadow-brutal-sm` | 2px 2px |
| `shadow-brutal-lg` | 6px 6px |
| `shadow-brutal-xl` | 8px 8px |
| `shadow-brutal-primary` | 使用 `--brutal-primary` 颜色 |
| `shadow-brutal-secondary` | 使用 `--brutal-secondary` 颜色 |

> 注意：所有阴影都是硬偏移（无模糊），这是新粗野主义的核心视觉特征。

### 颜色

```vue
<!-- 背景色 + 文字色 -->
<div class="bg-brutal-bg text-brutal-fg">           <!-- 白底黑字 -->
<div class="bg-brutal-primary text-brutal-fg">       <!-- 珊瑚红 -->
<div class="bg-brutal-secondary text-brutal-fg">     <!-- 薄荷青 -->
<div class="bg-brutal-accent text-brutal-fg">        <!-- 黄色 -->
<div class="bg-brutal-destructive text-brutal-fg">   <!-- 危险红 -->
<div class="bg-brutal-success text-brutal-fg">       <!-- 成功绿 -->
<div class="bg-brutal-info text-brutal-fg">          <!-- 信息蓝 -->
<div class="bg-brutal-muted text-brutal-fg">         <!-- 柔和灰 -->
<div class="text-brutal-muted-foreground">           <!-- 柔和文本 -->
<div class="text-brutal-placeholder">                <!-- 占位符文本 -->
<div class="ring-brutal-ring">                       <!-- 焦点环 -->
```

### 交互效果

```vue
<!-- 悬停：阴影增大 + 微偏移 -->
<button class="hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5">

<!-- 按压：向下偏移 + 阴影消失 -->
<button class="active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none">

<!-- 完整交互效果（推荐用于所有可点击元素） -->
<button class="hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none">
```

---

## 主题预设

BrutxUI 提供三个内置主题预设，通过 CSS 类名切换：

### theme-classic（默认）

经典粗野主义风格，深黑阴影、霓虹强调色、锐利直角。

```vue
<div class="theme-classic">
  <Button variant="primary">经典风格</Button>
</div>
```

特征：
- 纯黑阴影（`#000000`）
- 霓虹感的强调色（珊瑚红、薄荷青、黄色）
- 0px 圆角（完全直角）
- 3px 边框

### theme-pastel

柔和新粗野风格，降低对比度，增加圆角。

```vue
<div class="theme-pastel">
  <Button variant="primary">柔和风格</Button>
</div>
```

特征：
- 较轻的阴影对比度
- 8px 圆角
- 柔和的色彩变体（粉紫、薄荷绿、米黄）
- 2px 边框

### theme-mono

纯粹单色风格，灰度色彩、更粗线条。

```vue
<div class="theme-mono">
  <Button variant="primary">单色风格</Button>
</div>
```

特征：
- 灰度色彩方案
- 4px 边框（更粗）
- 更强的黑白对比
- 0px 圆角

---

## 暗色模式

BrutxUI 通过 `.dark` 类支持暗色模式。当 `dark` 类被应用到 `<html>` 或 `<body>` 元素时，所有 CSS 变量会自动切换为暗色值。

```html
<html class="dark">
  <!-- 暗色模式生效 -->
</html>
```

主题预设也支持暗色模式：

- `.dark .theme-classic` 或 `.theme-classic.dark`
- `.dark .theme-pastel` 或 `.theme-pastel.dark`
- `.dark .theme-mono` 或 `.theme-mono.dark`

---

## useTheme 组合式函数

BrutxUI 提供了 `useTheme` 组合式函数，用于在运行时切换主题和暗色模式。

```typescript
import { useTheme } from 'brutx-ui-vue'

const { theme, colorMode, setTheme, toggleColorMode, applyColorMode, initTheme } = useTheme()
```

### API

| 属性/方法 | 类型 | 说明 |
| --- | --- | --- |
| `theme` | `Ref<'classic' \| 'pastel' \| 'mono'>` | 当前主题名称（响应式） |
| `colorMode` | `Ref<'light' \| 'dark'>` | 当前颜色模式（响应式） |
| `setTheme(name)` | `(name: ThemeName) => void` | 切换主题，同时更新 DOM class 和 localStorage |
| `toggleColorMode()` | `() => void` | 在亮色/暗色模式之间切换 |
| `applyColorMode(mode)` | `(mode: ColorMode) => void` | 设置指定的颜色模式 |
| `initTheme()` | `() => void` | 从 localStorage 恢复用户偏好，或跟随系统偏好 |

### 使用示例

在应用入口调用 `initTheme` 恢复用户上次的选择：

```typescript
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import { useTheme } from 'brutx-ui-vue'

const { initTheme } = useTheme()
initTheme()

createApp(App).mount('#app')
```

在组件中切换主题和暗色模式：

```vue
<script setup lang="ts">
import { useTheme } from 'brutx-ui-vue'

const { theme, colorMode, setTheme, toggleColorMode } = useTheme()
</script>

<template>
  <select :value="theme" @change="setTheme(($event.target as HTMLSelectElement).value)">
    <option value="classic">经典</option>
    <option value="pastel">柔和</option>
    <option value="mono">单色</option>
  </select>
  <button @click="toggleColorMode">
    {{ colorMode === 'dark' ? '☀️ 亮色模式' : '🌙 暗色模式' }}
  </button>
</template>
```

---

## 国际化

BrutxUI 内置轻量多语言支持，**默认语言为中文（zh-CN）**，同时提供英文（en）语言包。无需安装 `vue-i18n`，开箱即用。

### 优先级链

```
组件 props > 全局 locale 配置 > 默认中文（zh-CN）
```

### 全局切换语言

通过 `BrutxUIPlugin` 的 `locale` 选项切换：

```typescript
import { createApp } from 'vue'
import { BrutxUIPlugin, en } from 'brutx-ui-vue'

const app = createApp(App)
app.use(BrutxUIPlugin, { locale: en })
app.mount('#app')
```

locale 支持响应式值，切换时组件自动更新：

```typescript
import { ref, computed } from 'vue'
import { BrutxUIPlugin, zhCN, en } from 'brutx-ui-vue'

const isEnglish = ref(false)
const locale = computed(() => isEnglish.value ? en : zhCN)
app.use(BrutxUIPlugin, { locale })
```

### 局部子树覆盖

使用 `provideLocale` 在某个组件子树内使用不同语言，不影响全局：

```vue
<script setup>
import { provideLocale, en } from 'brutx-ui-vue'

provideLocale(en)
</script>
```

### useLocale 组合式函数

```typescript
import { useLocale } from 'brutx-ui-vue'

const { t, locale } = useLocale()

// 使用翻译（点号路径）
const title = t('saasPricing.title')

// 带插值
const message = t('combobox.selectedCount', { count: 3 })
```

### 通过 props 或 texts 覆盖

props 优先级最高，可以覆盖任何 locale 文本：

```vue
<!-- 单个 prop 覆盖 -->
<CommandInput placeholder="自定义搜索..." />

<!-- texts prop 批量覆盖（适用于 AuthCard 等大量文本组件） -->
<AuthCard :texts="{
    google: '使用 Google 登录',
    github: '使用 GitHub 登录',
    signIn: '登 录',
}" />
```

### 自定义语言包

```typescript
import { zhCN, mergeLocale } from 'brutx-ui-vue/locales'

// 部分覆盖
const customLocale = mergeLocale(zhCN, {
    command: { placeholder: '请输入...' },
})
app.use(BrutxUIPlugin, { locale: customLocale })
```

创建全新语言包：

```typescript
import type { Locale } from 'brutx-ui-vue'
import { zhCN } from 'brutx-ui-vue/locales'

const jaJP: Locale = {
    command: {
        placeholder: 'コマンドを入力...',
        emptyText: '結果が見つかりません。',
        dialogTitle: 'コマンドパレット',
        dialogDescription: '実行するコマンドを検索...',
    },
    // ... 其他组件的翻译
}

app.use(BrutxUIPlugin, { locale: jaJP })
```

### t() 翻译函数

`useLocale()` 返回的 `t()` 函数支持点号路径访问和插值参数：

```typescript
const { t } = useLocale()

t('command.placeholder')
// → '输入命令或搜索...'

t('combobox.selectedCount', { count: 3 })
// → '已选 3 项'

t('pagination.page', { number: 5 })
// → '第 5 页'
```

### 回退链

1. 当前 locale 中查找 `path` 对应的值
2. 不存在 → 回退到 zh-CN 语言包中 `path` 对应的值
3. 仍不存在 → 返回路径字符串 `path` 本身

### API 参考

| API | 说明 |
|-----|------|
| `BrutxUIPlugin` | Vue 插件，用于全局配置 locale：`app.use(BrutxUIPlugin, { locale: en })` |
| `provideLocale(locale)` | 在组件子树内注入 locale 配置 |
| `useLocale()` | 返回 `{ locale, t }`，`t(path, params?)` 支持点号路径和插值 |
| `mergeLocale(base, override)` | 深合并语言包，用于部分覆盖 |
| `zhCN` | 简体中文语言包（默认） |
| `en` | 英文语言包 |

### 与 vue-i18n 共存

```typescript
import { watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { provideLocale, zhCN, en } from 'brutx-ui-vue'

const LOCALE_MAP = { 'zh-CN': zhCN, en }

const { locale } = useI18n()
provideLocale(computed(() => LOCALE_MAP[locale.value] ?? zhCN))
```

### 最佳实践

1. **文本 props 默认值设为 `undefined`**，通过 `t()` 提供默认文本
2. **不要硬编码文案**，始终使用 `t()` 函数
3. **支持插值**，使用 `{变量名}` 语法：`t('greeting', { name: '用户' })`
