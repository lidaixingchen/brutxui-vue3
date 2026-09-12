---
title: 主题与令牌
description: 了解 BrutxUI 的 CSS 变量令牌、主题预设与纹理工具系统
---

# 主题与令牌

BrutxUI 使用 CSS 自定义属性（设计令牌）来控制新粗野主义系统的每个视觉方面。这让定制变得像覆盖一个变量一样简单。

如果你想先可视化调参，再复制完整 CSS 变量，可以使用[主题实验室](/guide/theme-playground)。它会展示产品预览、组件矩阵、对比度检查和 token 覆盖率。

> **对比度提示**：`--brutal-primary` 与 `--brutal-primary-foreground` 等背景/前景配对用于选中态、激活态等小字号加粗文本（如日历选中日期 10px 字号），需保证 ≥ 4.5:1（WCAG AA 正常字号）。自定义主题时请在[主题实验室](/guide/theme-playground)中运行对比度检查确认配对达标。

---

## CSS 变量（设计令牌）

所有基础设计令牌都以 `--brutal-` 为前缀，在 `:root` 和 `.dark` 级别统一定义：

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
| `--brutal-primary-foreground` | `#000000` | `#000000` | 主色前景文字（高对比黑字） |
| `--brutal-secondary` | `#4ECDC4` | `#4ECDC4` | 辅助色（薄荷青） |
| `--brutal-secondary-foreground` | `#000000` | `#000000` | 辅助色前景文字（高对比黑字） |
| `--brutal-accent` | `#FFE66D` | `#FFE66D` | 强调色（黄色） |
| `--brutal-accent-foreground` | `#000000` | `#000000` | 强调色前景文字（高对比黑字） |
| `--brutal-destructive` | `#EF476F` | `#EF476F` | 危险/错误颜色 |
| `--brutal-destructive-foreground` | `#000000` | `#000000` | 危险色前景文字（高对比黑字） |
| `--brutal-success` | `#7FB069` | `#7FB069` | 成功颜色 |
| `--brutal-success-foreground` | `#000000` | `#000000` | 成功色前景文字（高对比黑字） |
| `--brutal-muted` | `#f3f4f6` | `#1e1e1e` | 柔和背景 |
| `--brutal-muted-foreground` | `#4B5563` | `#9CA3AF` | 柔和文本颜色 |
| `--brutal-ring` | `#000000` | `#ffffff` | 焦点环颜色 |
| `--brutal-info` | `#4A90D9` | `#3B82F6` | 信息颜色 |
| `--brutal-info-foreground` | `#000000` | `#000000` | 信息色前景文字（高对比黑字） |
| `--brutal-status-success` | `#22c55e` | `#22c55e` | 状态指示器成功色 |
| `--brutal-status-success-foreground` | `#000000` | `#000000` | 状态成功色前景文字 |
| `--brutal-status-warning` | `#FFE66D` | `#FFE66D` | 状态指示器警告色 |
| `--brutal-status-warning-foreground` | `#000000` | `#000000` | 状态警告色前景文字 |
| `--brutal-status-info` | `#3b82f6` | `#3b82f6` | 状态指示器信息色 |
| `--brutal-status-info-foreground` | `#000000` | `#000000` | 状态信息色前景文字 |
| `--brutal-status-error` | `#EF476F` | `#EF476F` | 状态指示器错误色 |
| `--brutal-status-error-foreground` | `#000000` | `#000000` | 状态错误色前景文字 |
| `--brutal-overlay` | `rgba(0, 0, 0, 0.5)` | `rgba(0, 0, 0, 0.7)` | 遮罩背景 |
| `--brutal-overlay-subtle` | `rgba(0, 0, 0, 0.05)` | `rgba(255, 255, 255, 0.05)` | 微妙浅层遮罩背景 |
| `--brutal-placeholder` | `#6e7788` | `#767e8c` | 占位符文本颜色 |
| `--brutal-black` | `#000000` | `#000000` | 品牌标准黑色 |
| `--brutal-yellow` | `#FFE66D` | `#FFE66D` | 品牌标准黄色 |

---

## 主题预设

BrutxUI 提供 4 套开箱即用的预设主题。通过在根节点或局部容器挂载对应的 class 即可切换：

### Classic（默认基底）

标志性的 BrutxUI 经典风格。粗边框、硬阴影、零圆角、高饱和撞色。Classic 是库的默认全局基底，直接在 `:root` 和 `.dark` 上生效，无需额外添加类名。

```html
<!-- 默认即为 Classic 风格，通过 .dark 切换暗色模式 -->
<html class="dark">
    ...
</html>
```

### Pastel

柔和粉彩风格。2px 边框、3px 微阴影、8px 圆角与淡雅粉彩色调。

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
    --brutal-primary-foreground: #1e1e24;
    --brutal-secondary: #c5ded9;
    --brutal-secondary-foreground: #1e1e24;
    --brutal-accent: #fbe3b5;
    --brutal-accent-foreground: #1e1e24;
    --brutal-destructive: #f3b0b0;
    --brutal-destructive-foreground: #1e1e24;
    --brutal-success: #cce2cb;
    --brutal-success-foreground: #1e1e24;
    --brutal-muted: #eae8e1;
    --brutal-muted-foreground: #5e5e6b;
    --brutal-ring: #1e1e24;
    --brutal-info: #a8c8e8;
    --brutal-info-foreground: #1e1e24;
    --brutal-overlay: rgba(0, 0, 0, 0.4);
    --brutal-placeholder: #74717c;
}
.dark .theme-pastel, .theme-pastel.dark {
    --brutal-border-width: 2px;
    --brutal-border-color: #66667c;
    --brutal-shadow-offset-x: 3px;
    --brutal-shadow-offset-y: 3px;
    --brutal-shadow-color: #66667c;
    --brutal-radius: 8px;
    --brutal-bg: #16161e;
    --brutal-fg: #f0f0f5;
    --brutal-primary: #e8988a;
    --brutal-primary-foreground: #16161e;
    --brutal-secondary: #e0b8b0;
    --brutal-secondary-foreground: #16161e;
    --brutal-accent: #9ac4b6;
    --brutal-accent-foreground: #16161e;
    --brutal-destructive: #db6e60;
    --brutal-destructive-foreground: #16161e;
    --brutal-success: #7cbfa0;
    --brutal-success-foreground: #16161e;
    --brutal-muted: #20202c;
    --brutal-muted-foreground: #9898b0;
    --brutal-ring: #9ac4b6;
    --brutal-info: #88b8e6;
    --brutal-info-foreground: #16161e;
    --brutal-overlay: rgba(0, 0, 0, 0.6);
    --brutal-placeholder: #7e7e90;
}
```

### Mono

极致黑白对比。4px 超粗边框、5px 大阴影、纯黑白灰度调色板。

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
    --brutal-primary-foreground: #ffffff;
    --brutal-secondary: #ffffff;
    --brutal-secondary-foreground: #000000;
    --brutal-accent: #707070;
    --brutal-accent-foreground: #ffffff;
    --brutal-destructive: #333333;
    --brutal-destructive-foreground: #ffffff;
    --brutal-success: #dddddd;
    --brutal-success-foreground: #000000;
    --brutal-muted: #f0f0f0;
    --brutal-muted-foreground: #555555;
    --brutal-ring: #000000;
    --brutal-info: #666666;
    --brutal-info-foreground: #ffffff;
    --brutal-overlay: rgba(0, 0, 0, 0.5);
    --brutal-placeholder: #767676;
}
.dark .theme-mono, .theme-mono.dark {
    --brutal-border-width: 4px;
    --brutal-border-color: #ffffff;
    --brutal-shadow-offset-x: 5px;
    --brutal-shadow-offset-y: 5px;
    --brutal-shadow-color: #ffffff;
    --brutal-radius: 0px;
    --brutal-bg: #000000;
    --brutal-fg: #ffffff;
    --brutal-primary: #ffffff;
    --brutal-primary-foreground: #000000;
    --brutal-secondary: #000000;
    --brutal-secondary-foreground: #ffffff;
    --brutal-accent: #888888;
    --brutal-accent-foreground: #000000;
    --brutal-destructive: #cccccc;
    --brutal-destructive-foreground: #000000;
    --brutal-success: #222222;
    --brutal-success-foreground: #ffffff;
    --brutal-muted: #1a1a1a;
    --brutal-muted-foreground: #aaaaaa;
    --brutal-ring: #ffffff;
    --brutal-info: #999999;
    --brutal-info-foreground: #000000;
    --brutal-overlay: rgba(0, 0, 0, 0.7);
    --brutal-placeholder: #777777;
}
```

### Warm（暖色粗野主义）

大地暖色调与原始复古感。深褐边框、焦糖橙与米色背景，4px 圆角平滑硬朗感。

```css
.theme-warm {
    --brutal-border-width: 3px;
    --brutal-border-color: #5c3d2e;
    --brutal-shadow-offset-x: 4px;
    --brutal-shadow-offset-y: 4px;
    --brutal-shadow-color: #5c3d2e;
    --brutal-radius: 4px;
    --brutal-bg: #fff8f0;
    --brutal-fg: #2d1810;
    --brutal-primary: #e8722a;
    --brutal-primary-foreground: #2d1810;
    --brutal-secondary: #856a44;
    --brutal-secondary-foreground: #fff8f0;
    --brutal-accent: #f2c078;
    --brutal-accent-foreground: #2d1810;
    --brutal-destructive: #c0392b;
    --brutal-destructive-foreground: #fff8f0;
    --brutal-success: #82943e;
    --brutal-success-foreground: #2d1810;
    --brutal-muted: #f5ede3;
    --brutal-muted-foreground: #6b5b4f;
    --brutal-ring: #e8722a;
    --brutal-info: #d4956a;
    --brutal-info-foreground: #2d1810;
    --brutal-overlay: rgba(45, 24, 16, 0.5);
    --brutal-placeholder: #846f5b;
}
.dark .theme-warm, .theme-warm.dark {
    --brutal-border-width: 3px;
    --brutal-border-color: #c4a882;
    --brutal-shadow-offset-x: 4px;
    --brutal-shadow-offset-y: 4px;
    --brutal-shadow-color: #c4a882;
    --brutal-radius: 4px;
    --brutal-bg: #1a1410;
    --brutal-fg: #f5e6d3;
    --brutal-primary: #f59e4c;
    --brutal-primary-foreground: #1a1410;
    --brutal-secondary: #b8956a;
    --brutal-secondary-foreground: #1a1410;
    --brutal-accent: #ffd89b;
    --brutal-accent-foreground: #1a1410;
    --brutal-destructive: #e74c3c;
    --brutal-destructive-foreground: #1a1410;
    --brutal-success: #a3b556;
    --brutal-success-foreground: #1a1410;
    --brutal-muted: #2a2018;
    --brutal-muted-foreground: #b8a898;
    --brutal-ring: #f59e4c;
    --brutal-info: #e0a97e;
    --brutal-info-foreground: #1a1410;
    --brutal-overlay: rgba(0, 0, 0, 0.7);
    --brutal-placeholder: #8e7c6d;
}
```

---

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

也可以在[主题实验室](/guide/theme-playground)中选择基底主题并调节 token，然后复制生成的 CSS 到项目中。

---

## Tailwind 工具类

BrutxUI 注册了以下引用 CSS 变量的 Tailwind 工具类：

### 边框与圆角

| 工具类 | 映射到 | 说明 |
| :--- | :--- | :--- |
| `border-3` | `border-width: var(--brutal-border-width)` | 粗野标准边框粗细 |
| `border-brutal` | `border-color: var(--brutal-border-color)` | 边框主颜色 |
| `rounded-brutal` | `border-radius: var(--brutal-radius)` | 实体圆角半径 |

### 阴影

| 工具类 | 说明 |
| :--- | :--- |
| `shadow-brutal` | 标准 1 倍完整硬投影 |
| `shadow-brutal-sm` | 0.5 倍微型硬投影 |
| `shadow-brutal-lg` | 1.5 倍加深硬投影 |
| `shadow-brutal-xl` | 2 倍特大硬投影 |
| `shadow-brutal-primary` | 主色硬投影 |
| `shadow-brutal-secondary` | 辅助色硬投影 |
| `shadow-brutal-destructive` | 危险色硬投影 |
| `shadow-brutal-stacked` | 多层三明治立体彩虹投影 |
| `shadow-brutal-inset` | 冲压内嵌凹槽投影 |

### 颜色与浅色衍生背景

| 工具类 | 映射变量 / 机制 |
| :--- | :--- |
| `bg-brutal-bg` / `text-brutal-fg` | 画布背景与正文主前景色 |
| `bg-brutal-primary` / `text-brutal-primary-foreground` | 核心品牌主色及文字色 |
| `bg-brutal-secondary` / `text-brutal-secondary-foreground` | 辅助强调色及文字色 |
| `bg-brutal-accent` / `text-brutal-accent-foreground` | 亮眼强调色及文字色 |
| `bg-brutal-destructive` / `text-brutal-destructive-foreground` | 危险/警示色及文字色 |
| `bg-brutal-success` / `text-brutal-success-foreground` | 成功色及文字色 |
| `bg-brutal-info` / `text-brutal-info-foreground` | 信息色及文字色 |
| `bg-brutal-muted` / `text-brutal-muted-foreground` | 次级灰色背景与文本 |
| `text-brutal-placeholder` | 占位符灰色文本 |
| `ring-brutal-ring` | 焦点指示环颜色 |
| `bg-brutal-*-subtle` | 衍生浅色背景（如 `bg-brutal-primary-subtle`，与当前主题底色自动融合） |

### 纹理工具类（Patterns）

为卡片、横幅或页面背景添加经典工业粗野风纹理：

| 工具类 | 说明 |
| :--- | :--- |
| `bg-pattern-dots` | 半色调点阵：报刊网点印花、胶印网屏 |
| `bg-pattern-grid` | 蓝图方格：毫米坐标纸、CAD 工程图 |
| `bg-pattern-hazard` | 警戒斜纹：工业警示柱、施工重型机械 |
| `bg-pattern-hatch` | 细斜线填充：工程制图剖面线、表头底纹 |
| `bg-pattern-scanlines` | 扫描线：CRT 终端扫描余辉 |

---

## 暗色模式

BrutxUI 通过 `.dark` 类支持暗色模式。当 `dark` 类被应用到 `<html>` 或容器元素时，所有 CSS 变量会自动切换为暗色值。

```html
<html class="dark">
    <!-- Dark mode active -->
</html>
```

---

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
| `setCustomVariable(name, value)` | `(name: \`--${string}\`, value: string) => void` | 通过 `document.documentElement.style.setProperty` 设置自定义 CSS 变量 |
| `removeCustomVariable(name)` | `(name: \`--${string}\`) => void` | 移除自定义 CSS 变量 |
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
    <div class="flex items-center gap-3">
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
    </div>
</template>
```

### 运行时主题定制

`setCustomVariable` 和 `removeCustomVariable` 用于在运行时动态写入或清除任意 CSS 变量（写入到 `document.documentElement` 的内联样式中）。适合“用户自定义主色”、“品牌色即时预览”、“运行时调整边框粗细”等场景，无需重新构建 CSS。

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
            <Button variant="default" size="sm" @click="applyPrimary">应用主色</Button>
        </div>
        <div class="flex items-center gap-2">
            <Input v-model="borderWidth" size="sm" class="w-40" placeholder="边框宽度（如 5px）" />
            <Button variant="default" size="sm" @click="applyBorderWidth">应用边框</Button>
        </div>
        <Button variant="outline" size="sm" @click="reset">恢复默认</Button>
    </div>
</template>
```

---

## ColorModeSwitcher 组件

BrutxUI 提供了开箱即用的 `ColorModeSwitcher` 组件，支持三种显示模式：

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
| :--- | :--- | :--- | :--- |
| `display` | `'icon' \| 'button' \| 'select'` | `'icon'` | 显示模式 |
| `showSystem` | `boolean` | `true` | 是否显示 "system" 选项 |
