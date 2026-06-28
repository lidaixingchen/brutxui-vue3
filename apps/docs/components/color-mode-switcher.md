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

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `display` | `'icon' \| 'button' \| 'select'` | `'icon'` | 显示模式：图标、按钮或下拉选择 |
| `showSystem` | `boolean` | `true` | 是否显示 "system" 选项 |

## 工作原理

`ColorModeSwitcher` 内部使用 `useTheme()` 组合式函数获取当前颜色模式并切换。组件需要在上层通过 `provideTheme()` 提供主题上下文，或使用内置的共享单例回退。

颜色模式会持久化到 `localStorage`（键名 `brutx-color-mode`）。当选择 `system` 时，将跟随系统偏好设置，并监听 `prefers-color-scheme` 媒体查询的变化。

## 样式

- **图标模式**：带 nb-border / nb-shadow / nb-press 的图标按钮，显示当前模式对应的 `@lucide/vue` 图标（Sun / Moon / Monitor）
- **按钮模式**：图标 + 文字标签的组合按钮，hover 时背景色变化
- **下拉选择模式**：基于项目 `Select` 组件（reka-ui 无头原语封装），带 nb-border / nb-shadow 新粗野主义样式