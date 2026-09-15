---
title: 快速开始
description: 了解如何开始使用 BrutxUI 组件库
---

# 快速开始

BrutxUI 是面向 Vue 3 + Tailwind CSS 的新粗野主义（Neo-Brutalism）组件库。它提供大胆、无障碍且高度可定制的 UI 组件，支持 **npm 依赖分发** 与 **CLI 源码引入** 双轨模式。

## BrutxUI 的优势场景

- **落地页和营销网站** — 需要大胆的视觉识别来脱颖而出
- **SaaS 仪表盘** — 清晰自信的 UI 建立用户信任
- **创意作品集** — 拥抱原始、富有表现力的设计
- **开发者工具** — 功能优先的美学契合目标受众
- **初创团队** — 希望快速交付且拥有独特外观

## 适合柔和处理的场景

- **企业后台应用** — 用户期望传统的 UI 模式
- **表单密集型工作流** — 最少的视觉噪音有助于完成填写
- **数据密集型表格** — 粗野主义边框在大规模下可能显得沉重
- **无障碍关键场景** — 减少动画和高对比度模式是主要需求

## 双轨分发与安装选型

BrutxUI 提供两种引入方式，你可以根据团队对代码掌控度和维护成本的需求进行选择：

### 1. npm 包模式 (`brutx-ui-vue`)
- **适用场景**：标准化业务开发、偏好通过 `package.json` 集中升级、希望最小化维护成本的项目。
- **特点**：开箱即用、依赖版本由锁文件保证、天然享受语义化版本升级与 bugfix。

### 2. CLI 源码引入模式 (`brutx-vue`)
- **适用场景**：需要深度定制组件样式与结构、扩展自定义变体、消除第三方库锁定、或需要 AI 助手直接协同修改组件的项目。
- **特点**：组件代码直接落地到你的项目中（完全掌控源码）、无依赖锁定、按需引入。

## 系统可定制性

所有视觉属性都由 CSS 自定义属性驱动。你可以在 `:root` 级别或按组件覆盖它们：

```css
:root {
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
```

BrutxUI 还提供了 `useTheme` 组合式函数，用于在运行时切换主题和暗色模式：

```vue
<script setup>
import { useTheme } from 'brutx-ui-vue'

const { theme, colorMode, setTheme, toggleColorMode, initTheme } = useTheme()

// 在应用入口恢复用户偏好
initTheme()
</script>
```

详见[主题与令牌](/guide/theme)指南。也可以先打开[主题实验室](/guide/theme-playground)，通过实时预览、对比度检查和 token 覆盖率生成一份可复制的 `.theme-custom` CSS。

## 定制预设

BrutxUI 内置四套主题预设，你可以通过在根元素上添加类名来应用：

### Classic（默认）

标志性的 BrutxUI 风格 — 粗 3px 边框、硬 4px 阴影、零圆角、鲜艳色彩。

```html
<div class="theme-classic">
    <!-- Your app -->
</div>
```

### Pastel

更柔和的风格 — 2px 边框、3px 阴影、8px 圆角、柔和的粉彩色调。

```html
<div class="theme-pastel">
    <!-- Your app -->
</div>
```

### Mono

灰度极致 — 4px 边框、5px 阴影、零圆角、黑白调色板。

```html
<div class="theme-mono">
    <!-- Your app -->
</div>
```

### Warm

原始感与温暖的视觉体验 — 3px 边框、4px 阴影、4px 圆角、暖棕色调。

```html
<div class="theme-warm">
    <!-- Your app -->
</div>
```

## AI 优先集成

BrutxUI 旨在与 AI 编码助手无缝协作：

- **AGENTS.md** — 项目根目录的统一 AI 配置文件，为所有 AI 工具提供项目指令
- **结构化 Props** — AI 可以理解和生成的 TypeScript 接口

详见 [AI 集成](/guide/ai)指南。

## 无障碍优先

每个组件都基于 [reka-ui](https://reka-ui.com/) 无头原语构建，确保：

- 正确的 ARIA 属性和角色
- 键盘导航支持
- 焦点管理和可见的焦点环
- 屏幕阅读器兼容性
- 减少动画支持

## 下一步

- 在你的 Vite + Vue 3 项目中[安装 BrutxUI](/guide/installation-vite)
- 其他配置方式请参考[手动安装](/guide/installation-manual)
- [CLI 参考](/guide/cli)了解 `brutx-vue` 命令行工具
- [主题与令牌](/guide/theme)进行深度定制
- [主题实验室](/guide/theme-playground)可视化调试主题 CSS 变量
- [国际化](/guide/locale)配置多语言支持
- [浏览组件](/components/alert)查看可用组件
