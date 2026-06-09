# 主题与令牌

BrutxUI 使用 CSS 自定义属性（设计令牌）来控制新粗野主义系统的每个视觉方面。这让定制变得像覆盖一个变量一样简单。

如果你想先可视化调参，再复制完整 CSS 变量，可以使用[主题实验室](/guide/theme-playground)。它会展示产品预览、组件矩阵、对比度检查和 token 覆盖率。

## CSS 变量

所有令牌都以 `--brutal-` 为前缀，并在 `:root` 级别定义：

| 令牌 | 亮色模式 | 暗色模式 | 用途 |
|-------|-------|------|---------|
| `--brutal-border-width` | `3px` | `3px` | 所有组件的边框粗细 |
| `--brutal-border-color` | `#000000` | `#ffffff` | 边框颜色 |
| `--brutal-shadow-offset-x` | `4px` | `4px` | 阴影水平偏移 |
| `--brutal-shadow-offset-y` | `4px` | `4px` | 阴影垂直偏移 |
| `--brutal-shadow-color` | `#000000` | `#ffffff` | 阴影颜色 |
| `--brutal-radius` | `0px` | `0px` | 圆角元素的边框圆角 |
| `--brutal-bg` | `#ffffff` | `#141414` | 背景颜色 |
| `--brutal-fg` | `#000000` | `#ffffff` | 前景（文本）颜色 |
| `--brutal-primary` | `#FF6B6B` | `#FF6B6B` | 主色（珊瑚色） |
| `--brutal-secondary` | `#4ECDC4` | `#4ECDC4` | 辅助色（薄荷青） |
| `--brutal-accent` | `#FFE66D` | `#FFE66D` | 强调色（黄色） |
| `--brutal-destructive` | `#EF476F` | `#EF476F` | 危险/错误颜色 |
| `--brutal-success` | `#7FB069` | `#7FB069` | 成功颜色 |
| `--brutal-muted` | `#f3f4f6` | `#1e1e1e` | 柔和背景 |
| `--brutal-muted-foreground` | `#4B5563` | `#9CA3AF` | 柔和文本颜色 |
| `--brutal-ring` | `#000000` | `#ffffff` | 焦点环颜色 |
| `--brutal-pressed-offset` | `2px` | `2px` | 按下状态的 Y 轴偏移 |
| `--brutal-info` | `#4A90D9` | `#3B82F6` | 信息颜色 |
| `--brutal-overlay` | `rgba(0,0,0,0.5)` | `rgba(0,0,0,0.7)` | 遮罩背景 |
| `--brutal-placeholder` | `#9CA3AF` | `#6B7280` | 占位符文本颜色 |

## 主题预设

### Classic（默认）

标志性的 BrutxUI 风格。粗边框、硬阴影、零圆角、鲜艳色彩。

```css
.theme-classic {
    --brutal-border-width: 3px;
    --brutal-border-color: #000000;
    --brutal-shadow-offset-x: 4px;
    --brutal-shadow-offset-y: 4px;
    --brutal-shadow-color: #000000;
    --brutal-radius: 0px;
    --brutal-bg: #ffffff;
    --brutal-fg: #000000;
    --brutal-primary: #FF6B6B;
    --brutal-secondary: #4ECDC4;
    --brutal-accent: #FFE66D;
    --brutal-destructive: #EF476F;
    --brutal-success: #7FB069;
    --brutal-muted: #f3f4f6;
    --brutal-muted-foreground: #4B5563;
    --brutal-ring: #000000;
    --brutal-info: #4A90D9;
    --brutal-overlay: rgba(0, 0, 0, 0.5);
    --brutal-placeholder: #9CA3AF;
}
.dark .theme-classic, .theme-classic.dark {
    --brutal-border-color: #ffffff;
    --brutal-shadow-color: #ffffff;
    --brutal-bg: #141414;
    --brutal-fg: #ffffff;
    --brutal-muted-foreground: #9CA3AF;
    --brutal-ring: #ffffff;
    --brutal-info: #3B82F6;
    --brutal-overlay: rgba(0, 0, 0, 0.7);
    --brutal-placeholder: #6B7280;
}
```

### Pastel

更柔和、更友好的风格。更细的边框、更小的阴影、圆角、柔和色调。

```css
.theme-pastel {
    --brutal-border-width: 2px;
    --brutal-border-color: #1e1e24;
    --brutal-shadow-offset-x: 3px;
    --brutal-shadow-offset-y: 3px;
    --brutal-shadow-color: #1e1e24;
    --brutal-radius: 8px;
    --brutal-bg: #faf9f6;
    --brutal-fg: #1e1e24;
    --brutal-primary: #d6c6e1;
    --brutal-secondary: #c5ded9;
    --brutal-accent: #fbe3b5;
    --brutal-destructive: #f3b0b0;
    --brutal-success: #cce2cb;
    --brutal-muted: #eae8e1;
    --brutal-muted-foreground: #6b6b78;
    --brutal-ring: #1e1e24;
    --brutal-info: #a8c8e8;
    --brutal-overlay: rgba(0, 0, 0, 0.4);
    --brutal-placeholder: #b0aeb5;
}
.dark .theme-pastel, .theme-pastel.dark {
    --brutal-border-color: #e5e5e5;
    --brutal-shadow-color: #e5e5e5;
    --brutal-bg: #18171c;
    --brutal-fg: #e5e5e5;
    --brutal-primary: #8a739b;
    --brutal-secondary: #6e8e88;
    --brutal-accent: #b28e56;
    --brutal-destructive: #9b5a5a;
    --brutal-success: #678465;
    --brutal-muted: #27252f;
    --brutal-muted-foreground: #8a8a99;
    --brutal-ring: #e5e5e5;
    --brutal-info: #5a7a9b;
    --brutal-overlay: rgba(0, 0, 0, 0.7);
    --brutal-placeholder: #5a5866;
}
```

### Mono

极致对比。超粗边框、更大阴影、灰度调色板。

```css
.theme-mono {
    --brutal-border-width: 4px;
    --brutal-border-color: #000000;
    --brutal-shadow-offset-x: 5px;
    --brutal-shadow-offset-y: 5px;
    --brutal-shadow-color: #000000;
    --brutal-radius: 0px;
    --brutal-bg: #ffffff;
    --brutal-fg: #000000;
    --brutal-primary: #000000;
    --brutal-secondary: #ffffff;
    --brutal-accent: #7a7a7a;
    --brutal-destructive: #333333;
    --brutal-success: #dddddd;
    --brutal-muted: #f0f0f0;
    --brutal-muted-foreground: #555555;
    --brutal-ring: #000000;
    --brutal-info: #666666;
    --brutal-overlay: rgba(0, 0, 0, 0.5);
    --brutal-placeholder: #888888;
}
.dark .theme-mono, .theme-mono.dark {
    --brutal-border-color: #ffffff;
    --brutal-shadow-color: #ffffff;
    --brutal-bg: #000000;
    --brutal-fg: #ffffff;
    --brutal-primary: #ffffff;
    --brutal-secondary: #000000;
    --brutal-accent: #888888;
    --brutal-destructive: #cccccc;
    --brutal-success: #222222;
    --brutal-muted: #1a1a1a;
    --brutal-muted-foreground: #aaaaaa;
    --brutal-ring: #ffffff;
    --brutal-info: #999999;
    --brutal-overlay: rgba(0, 0, 0, 0.7);
    --brutal-placeholder: #777777;
}
```

## 自定义令牌

在 `:root` 级别覆盖令牌以进行全局修改：

```css
:root {
    --brutal-primary: #8B5CF6;
    --brutal-secondary: #06B6D4;
    --brutal-radius: 4px;
}
```

或将覆盖范围限定到特定区域：

```css
.sidebar {
    --brutal-primary: #8B5CF6;
    --brutal-border-width: 2px;
}
```

也可以在[主题实验室](/guide/theme-playground)中选择基底主题并调节 token，然后复制生成的 `.theme-custom` CSS 到项目中。

## Tailwind 工具类

BrutxUI 注册了以下引用 CSS 变量的 Tailwind 工具类：

### 边框

| 工具类 | 映射到 |
|---------|---------|
| `border-3` | `border-width: var(--brutal-border-width)` |
| `border-brutal` | `border-color: var(--brutal-border-color)` |
| `rounded-brutal` | `border-radius: var(--brutal-radius)` |

### 阴影

| 工具类 | 映射到 |
|---------|---------|
| `shadow-brutal` | 完整偏移阴影 |
| `shadow-brutal-sm` | 半偏移阴影 |
| `shadow-brutal-lg` | 1.5 倍偏移阴影 |
| `shadow-brutal-xl` | 2 倍偏移阴影 |
| `shadow-brutal-primary` | 主色阴影 |
| `shadow-brutal-secondary` | 辅助色阴影 |

### 颜色

| 工具类 | 映射到 |
|---------|---------|
| `bg-brutal-bg` | `var(--brutal-bg)` |
| `text-brutal-fg` | `var(--brutal-fg)` |
| `bg-brutal-primary` | `var(--brutal-primary)` |
| `bg-brutal-secondary` | `var(--brutal-secondary)` |
| `bg-brutal-accent` | `var(--brutal-accent)` |
| `bg-brutal-destructive` | `var(--brutal-destructive)` |
| `bg-brutal-success` | `var(--brutal-success)` |
| `bg-brutal-info` | `var(--brutal-info)` |
| `bg-brutal-muted` | `var(--brutal-muted)` |
| `text-brutal-muted-foreground` | `var(--brutal-muted-foreground)` |
| `text-brutal-placeholder` | `var(--brutal-placeholder)` |
| `bg-brutal-placeholder` | `var(--brutal-placeholder)` |
| `ring-brutal-ring` | `var(--brutal-ring)` |

## 暗色模式

BrutxUI 通过 `.dark` 类支持暗色模式。当 `dark` 类被应用到 `<html>` 或 `<body>` 元素时，所有 CSS 变量会自动切换为暗色值。

```html
<html class="dark">
    <!-- Dark mode active -->
</html>
```

通过编程方式切换暗色模式：

```vue
<script setup>
import { ref } from 'vue'

const isDark = ref(false)

function toggleDark() {
    isDark.value = !isDark.value
    document.documentElement.classList.toggle('dark', isDark.value)
}
</script>

<template>
    <button @click="toggleDark">Toggle Dark Mode</button>
</template>
```

主题预设也通过 `.dark .theme-pastel` 或 `.theme-pastel.dark` 选择器支持暗色模式。

## useTheme 组合式函数

BrutxUI 提供了 `useTheme` 组合式函数，用于在运行时切换主题和暗色模式。

```ts
import { useTheme } from 'brutx-ui-vue'

const { theme, colorMode, setTheme, toggleColorMode, applyColorMode, initTheme } = useTheme()
```

### API

| 属性/方法 | 类型 | 说明 |
|-----------|------|------|
| `theme` | `Ref<'classic' \| 'pastel' \| 'mono'>` | 当前主题名称（响应式） |
| `colorMode` | `Ref<'light' \| 'dark'>` | 当前颜色模式（响应式） |
| `setTheme(name)` | `(name: ThemeName) => void` | 切换主题，同时更新 DOM class 和 localStorage |
| `toggleColorMode()` | `() => void` | 在亮色/暗色模式之间切换 |
| `applyColorMode(mode)` | `(mode: ColorMode) => void` | 设置指定的颜色模式 |
| `initTheme()` | `() => void` | 从 localStorage 恢复用户偏好，或跟随系统偏好 |

### 使用示例

在应用入口调用 `initTheme` 恢复用户上次的选择：

```ts
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
<script setup>
import { useTheme } from 'brutx-ui-vue'

const { theme, colorMode, setTheme, toggleColorMode } = useTheme()
</script>

<template>
    <select :value="theme" @change="setTheme(($event.target as HTMLSelectElement).value)">
        <option value="classic">Classic</option>
        <option value="pastel">Pastel</option>
        <option value="mono">Mono</option>
    </select>
    <button @click="toggleColorMode">
        {{ colorMode === 'dark' ? '☀️ 亮色模式' : '🌙 暗色模式' }}
    </button>
</template>
```
