---
title: 主题与令牌
description: 了解 BrutxUI 的 CSS 变量令牌和主题预设系统
---

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
| `--brutal-primary-foreground` | `#FFFFFF` | — | 主色前景文字 |
| `--brutal-secondary-foreground` | `#FFFFFF` | — | 辅助色前景文字 |
| `--brutal-accent-foreground` | `#2D1810` | — | 强调色前景文字 |
| `--brutal-destructive-foreground` | `#FFFFFF` | — | 危险色前景文字 |
| `--brutal-success-foreground` | `#FFFFFF` | — | 成功色前景文字 |
| `--brutal-info-foreground` | `#FFFFFF` | — | 信息色前景文字 |

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

### Warm（暖色粗野主义）

暖色粗野主义融合原始感与温暖视觉体验。橙色、棕色、米色、奶油色为主色调，轻微圆角软化硬朗感。

```css
.theme-warm {
    --brutal-border-width: 3px;
    --brutal-border-color: #5C3D2E;
    --brutal-shadow-offset-x: 4px;
    --brutal-shadow-offset-y: 4px;
    --brutal-shadow-color: #5C3D2E;
    --brutal-radius: 4px;
    --brutal-bg: #FFF8F0;
    --brutal-fg: #2D1810;
    --brutal-primary: #E8722A;
    --brutal-primary-foreground: #FFFFFF;
    --brutal-secondary: #8B6F47;
    --brutal-secondary-foreground: #FFFFFF;
    --brutal-accent: #F2C078;
    --brutal-accent-foreground: #2D1810;
    --brutal-destructive: #C0392B;
    --brutal-destructive-foreground: #FFFFFF;
    --brutal-success: #7B8B3A;
    --brutal-success-foreground: #FFFFFF;
    --brutal-muted: #F5EDE3;
    --brutal-muted-foreground: #6B5B4F;
    --brutal-ring: #E8722A;
    --brutal-info: #D4956A;
    --brutal-info-foreground: #FFFFFF;
    --brutal-overlay: rgba(45, 24, 16, 0.5);
    --brutal-placeholder: #B8A898;
}
.dark .theme-warm, .theme-warm.dark {
    --brutal-border-color: #C4A882;
    --brutal-shadow-color: #C4A882;
    --brutal-bg: #1A1410;
    --brutal-fg: #F5E6D3;
    --brutal-primary: #F59E4C;
    --brutal-primary-foreground: #1A1410;
    --brutal-secondary: #B8956A;
    --brutal-secondary-foreground: #1A1410;
    --brutal-accent: #FFD89B;
    --brutal-accent-foreground: #1A1410;
    --brutal-destructive: #E74C3C;
    --brutal-destructive-foreground: #FFFFFF;
    --brutal-success: #A3B556;
    --brutal-success-foreground: #1A1410;
    --brutal-muted: #2A2018;
    --brutal-muted-foreground: #B8A898;
    --brutal-ring: #F59E4C;
    --brutal-info: #E8B88A;
    --brutal-info-foreground: #1A1410;
    --brutal-overlay: rgba(0, 0, 0, 0.7);
    --brutal-placeholder: #6B5B4F;
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

const {
    theme,
    colorMode,
    resolvedColorMode,
    isSystemDark,
    setTheme,
    setCustomVariable,
    removeCustomVariable,
    toggleColorMode,
    applyColorMode,
    initTheme,
} = useTheme()
```

### API

| 属性/方法 | 类型 | 说明 |
|-----------|------|------|
| `theme` | `Ref<'classic' \| 'pastel' \| 'mono' \| 'warm'>` | 当前主题名称（响应式） |
| `colorMode` | `Ref<'light' \| 'dark' \| 'system'>` | 当前颜色模式（响应式） |
| `resolvedColorMode` | `ComputedRef<'light' \| 'dark'>` | 实际应用的颜色模式（system 模式下解析后的值） |
| `isSystemDark` | `Ref<boolean>` | 系统当前是否为暗色模式 |
| `setTheme(name)` | `(name: ThemeName) => void` | 切换主题，同时更新 DOM class 和 localStorage |
| `setCustomVariable(name, value)` | `(name: \`--${string}\`, value: string) => void` | 通过 `document.documentElement.style.setProperty` 设置自定义 CSS 变量（Batch 8.3 新增） |
| `removeCustomVariable(name)` | `(name: \`--${string}\`) => void` | 移除自定义 CSS 变量（Batch 8.3 新增） |
| `toggleColorMode()` | `() => void` | 在 light → dark → system 之间循环切换 |
| `applyColorMode(mode)` | `(mode: ColorMode) => void` | 设置指定的颜色模式 |
| `initTheme()` | `() => void` | 从 localStorage 恢复用户偏好，或跟随系统偏好 |
| `destroy()` | `() => void` | 清理 matchMedia 监听器（组件卸载时自动调用） |

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
<script setup lang="ts">
import { SelectValue } from 'reka-ui'
import { useTheme, Select, SelectTrigger, SelectContent, SelectItem, Button } from 'brutx-ui-vue'
import type { AcceptableValue } from 'reka-ui'

const { theme, colorMode, setTheme, toggleColorMode } = useTheme()

const themes = [
    { value: 'classic', label: 'Classic' },
    { value: 'pastel', label: 'Pastel' },
    { value: 'mono', label: 'Mono' },
    { value: 'warm', label: 'Warm' },
]

function handleThemeChange(value: AcceptableValue) {
    if (typeof value === 'string') setTheme(value)
}
</script>

<template>
    <Select :model-value="theme" @update:model-value="handleThemeChange">
        <SelectTrigger size="sm" class="w-auto min-w-[8rem]">
            <SelectValue />
        </SelectTrigger>
        <SelectContent>
            <SelectItem v-for="t in themes" :key="t.value" :value="t.value">
                {{ t.label }}
            </SelectItem>
        </SelectContent>
    </Select>
    <Button variant="default" size="sm" @click="toggleColorMode">
        {{ colorMode === 'light' ? '亮色' : colorMode === 'dark' ? '暗色' : '系统' }}
    </Button>
</template>
```

### 运行时主题定制

`setCustomVariable` 和 `removeCustomVariable` 用于在运行时动态写入或清除任意 CSS 变量（写入到 `document.documentElement` 的内联样式中）。适合"用户自定义主色"、"品牌色即时预览"、"运行时调整边框粗细"等场景，无需重新构建 CSS。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useTheme, Button, Input } from 'brutx-ui-vue'

const { setCustomVariable, removeCustomVariable } = useTheme()

const primaryColor = ref('#8B5CF6')
const borderWidth = ref('3px')

function applyPrimary() {
    setCustomVariable('--brutal-primary', primaryColor.value)
}

function applyBorderWidth() {
    setCustomVariable('--brutal-border-width', borderWidth.value)
}

function reset() {
    removeCustomVariable('--brutal-primary')
    removeCustomVariable('--brutal-border-width')
}
</script>

<template>
    <div class="flex flex-col gap-3">
        <div class="flex items-center gap-2">
            <Input v-model="primaryColor" size="sm" class="w-40" placeholder="主色（如 #8B5CF6）" />
            <Button variant="primary" size="sm" @click="applyPrimary">应用主色</Button>
        </div>
        <div class="flex items-center gap-2">
            <Input v-model="borderWidth" size="sm" class="w-40" placeholder="边框宽度（如 5px）" />
            <Button variant="default" size="sm" @click="applyBorderWidth">应用边框</Button>
        </div>
        <Button variant="default" size="sm" @click="reset">恢复默认</Button>
    </div>
</template>
```

> 说明：
>
> - `setCustomVariable` 直接调用 `document.documentElement.style.setProperty`，因此会覆盖预设主题与 `:root` 中定义的同名变量。在 SSR 环境（`typeof document === 'undefined'`）下函数会安全跳过。
> - `removeCustomVariable` 调用 `removeProperty`，仅移除通过内联样式设置的同名变量，不会影响样式表中通过 CSS 定义的同名变量，因此"恢复默认"后会回落到当前主题预设的取值。
> - 参数 `name` 必须以 `--` 开头（TypeScript 上以模板字面量类型 `\`--${string}\`` 约束），否则编译期会报错。

## ColorModeSwitcher 组件

BrutxUI 提供了开箱即用的 `ColorModeSwitcher` 组件，支持三种显示模式。

```vue
<script setup>
import { ColorModeSwitcher } from 'brutx-ui-vue'
</script>

<template>
    <!-- 图标模式（默认） -->
    <ColorModeSwitcher />

    <!-- 按钮模式 -->
    <ColorModeSwitcher display="button" />

    <!-- 下拉选择模式 -->
    <ColorModeSwitcher display="select" />

    <!-- 不显示 system 选项 -->
    <ColorModeSwitcher :show-system="false" />
</template>
```

### Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `display` | `'icon' \| 'button' \| 'select'` | `'icon'` | 显示模式 |
| `showSystem` | `boolean` | `true` | 是否显示 "system" 选项 |

## CSS 动画预设

BrutxUI 提供了 13 个粗野主义风格的动画工具类，支持 `prefers-reduced-motion` 无障碍设置。

| 类名 | 效果 | 时长 |
| --- | --- | --- |
| `animate-brutal-shake` | 左右抖动 | 0.3s |
| `animate-brutal-bounce` | 弹跳 | 0.5s |
| `animate-brutal-pulse` | 脉冲缩放 | 0.8s |
| `animate-brutal-flip` | 水平翻转 | 0.4s |
| `animate-brutal-slide-up` | 从下方滑入 | 0.3s |
| `animate-brutal-slide-down` | 从上方滑入 | 0.3s |
| `animate-brutal-slide-left` | 从右侧滑入 | 0.3s |
| `animate-brutal-slide-right` | 从左侧滑入 | 0.3s |
| `animate-brutal-pop` | 弹出放大 | 0.2s |
| `animate-brutal-rotate` | 旋转 360° | 0.6s |
| `animate-brutal-swing` | 钟摆摆动 | 0.5s |
| `animate-brutal-jello` | 果冻抖动 | 0.5s |
| `animate-brutal-heartbeat` | 心跳 | 1s |

### 延迟和重复

```html
<div class="animate-brutal-bounce animation-delay-200 animation-infinite">
    延迟 200ms 后无限弹跳
</div>
```

| 类名 | 说明 |
| --- | --- |
| `animation-delay-100` | 延迟 100ms |
| `animation-delay-200` | 延迟 200ms |
| `animation-delay-300` | 延迟 300ms |
| `animation-delay-500` | 延迟 500ms |
| `animation-once` | 只播放一次 |
| `animation-infinite` | 无限循环 |

## useAnimation 组合式函数

CSS 动画预设类在 `<template>` 中可以直接写死，但当动画类名需要根据状态动态切换、或希望统一遵守系统级 `prefers-reduced-motion` 偏好时，可使用 `useAnimation` 组合式函数在 JS 中统一处理动画降级。

`useAnimation` 接收一个动画类名（支持 `ref` / `getter` / 静态字符串），返回解析后的动画类与减少动效偏好。当用户系统启用了 `prefers-reduced-motion: reduce` 时，`animationClass` 会自动变为空字符串，从而禁用动画。

```ts
import { useAnimation } from 'brutx-ui-vue'

const { animationClass, prefersReduced } = useAnimation('animate-brutal-bounce')
// prefersReduced=true 时 animationClass 为空字符串
```

### API

| 属性 | 类型 | 说明 |
|------|------|------|
| `animationClass` | `ComputedRef<string>` | 解析后的动画类名；启用减少动效时为空字符串 |
| `prefersReduced` | `Ref<boolean>` | 系统是否启用了 `prefers-reduced-motion: reduce` |

### 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `animationClass` | `MaybeRefOrGetter<string>` | `''` | 想要应用的动画类名，支持 `ref` / `getter` / 静态字符串 |

### 使用示例

根据组件状态动态切换动画类，并自动尊重减少动效偏好：

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAnimation } from 'brutx-ui-vue'

const shake = ref(false)
const animationName = computed(() => shake.value ? 'animate-brutal-shake' : 'animate-brutal-pulse')
const { animationClass } = useAnimation(animationName)

function trigger() {
    shake.value = !shake.value
}
</script>

<template>
    <div :class="animationClass">
        动画区域
    </div>
    <button @click="trigger">切换动画</button>
</template>
```

> 提示：`useAnimation` 内部基于 `useReducedMotion`，会在 `onMounted` 时订阅 `matchMedia('(prefers-reduced-motion: reduce)')`，并在 `onUnmounted` 时自动清理监听器。必须在 `setup` 顶层调用，不能在异步回调或事件处理器中调用。
