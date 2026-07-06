---
title: ColorModeSwitcher 颜色模式切换
description: 颜色模式切换组件，支持 icon、button、select 三种显示模式，可在 light / dark / system 之间切换。
---

# ColorModeSwitcher 颜色模式切换

新粗野主义风格的颜色模式切换组件，基于 `useTheme()` 组合式函数，提供三种显示模式。

## 预览

<ComponentPreview>
    <ColorModeSwitcherDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="color-mode-switcher" />

## 用法

### 图标模式（默认）

点击图标在 light / dark / system 之间循环切换。

```vue
<script setup>
import { ColorModeSwitcher } from 'brutx-ui-vue'
</script>

<template>
    <ColorModeSwitcher />
</template>
```

### 按钮模式

显示图标和文字标签的组合按钮，点击循环切换。

```vue
<template>
    <ColorModeSwitcher display="button" />
</template>
```

### 下拉选择模式

基于 `Select` 组件的下拉选择器，可直接选择目标模式。

```vue
<template>
    <ColorModeSwitcher display="select" />
</template>
```

### 隐藏 system 选项

通过 `showSystem` 属性控制是否显示 "system" 选项。当设为 `false` 时，循环切换将仅在 light / dark 之间进行。

```vue
<template>
    <ColorModeSwitcher :show-system="false" />
</template>
```

## 变体

| 变体 | 说明 |
|------|------|
| `icon` | 图标模式，仅显示当前模式对应的图标 |
| `button` | 按钮模式，显示图标和文字标签的组合按钮 |
| `select` | 下拉选择模式，基于 Select 组件的下拉选择器 |

## 组合式函数

`ColorModeSwitcher` 内部使用 `useTheme()` 组合式函数获取当前颜色模式并切换。生产应用推荐在上层通过 `provideTheme()` 提供主题上下文；内置共享单例仅作为兼容兜底。测试、多应用同页或热更新场景可调用 `destroyBrutxFallbacks()` 集中清理 theme/toast/message 的 fallback 状态。

颜色模式会持久化到 `localStorage`（键名 `brutx-color-mode`）。当选择 `system` 时，将跟随系统偏好设置，并监听 `prefers-color-scheme` 媒体查询的变化。

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `display` | `'icon' \| 'button' \| 'select'` | `'icon'` | 显示模式：图标、按钮或下拉选择 |
| `showSystem` | `boolean` | `true` | 是否显示 "system" 选项 |
| `class` | `string` | `undefined` | 自定义样式类 |

## 可访问性

- **键盘操作**：支持 `Enter` / `Space` 触发切换
- **ARIA 属性**：图标按钮包含当前模式的文本描述
