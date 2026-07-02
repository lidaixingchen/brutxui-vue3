# Brutx UI

新粗野主义 Vue 3 组件库，支持 CLI 工具。将组件复制到你的代码库中，获得完全的自定义控制权。

**[English](/packages/ui/README-en.md)**

[![npm version](https://img.shields.io/npm/v/brutx-ui-vue.svg?style=flat-square&color=FF6B6B)](https://www.npmjs.com/package/brutx-ui-vue)
[![npm downloads](https://img.shields.io/npm/dm/brutx-ui-vue.svg?style=flat-square)](https://www.npmjs.com/package/brutx-ui-vue)
[![License: MIT](https://img.shields.io/badge/License-MIT-4ECDC4.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-FFE66D.svg?style=flat-square)](https://www.typescriptlang.org/)

## 特性

- **CLI 工具**：通过 `npx brutx-vue@latest` 将组件复制到你的代码库
- **完全控制**：拥有并自定义每一个组件
- **粗野主义风格**：粗边框、偏移阴影、鲜艳色彩
- **Tailwind 就绪令牌**：background/foreground/primary/secondary/destructive、ring、input、card 等。通过 `.dark` 支持暗色模式
- **基于 reka-ui 的无头原语**、CVA 变体、tailwind-merge `cn()`
- **国际化支持**：内置 `useLocale()` 组合式函数，支持多语言
- **主题预设**：经典（默认）、柔和、单色三种主题

## 安装

使用 CLI 将组件添加到你的项目：

```bash
# 初始化你的项目
npx brutx-vue@latest init

# 添加组件
npx brutx-vue@latest add button card badge

# 或添加全部组件
npx brutx-vue@latest add --all
```

## 升级

当 BrutxUI 发布新版本时，重新运行 init 命令即可升级：

```bash
npx brutx-vue@latest init
```

你也可以单独更新已有组件：

```bash
npx brutx-vue@latest add button --overwrite
```

## 用法

添加组件后，从你的项目中导入它们：

```vue
<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>欢迎使用 Brutx</CardTitle>
    </CardHeader>
    <CardContent class="space-y-3">
      <Input placeholder="邮箱" />
      <Button variant="primary">开始使用</Button>
      <Button variant="outline" size="sm">
        了解更多
      </Button>
    </CardContent>
  </Card>
</template>
```

## CLI 命令

| 命令                               | 说明                           |
| ---------------------------------- | ------------------------------ |
| `npx brutx-vue@latest init`            | 使用 components.json 初始化项目 |
| `npx brutx-vue@latest add <component>` | 添加指定组件                   |
| `npx brutx-vue@latest add --all`       | 添加全部组件                   |

## 组件列表

### 基础组件

Accordion · Alert · AlertDialog · Avatar · Badge · Button · Card · Card3D · Checkbox · Combobox · Command · Dialog · DropdownMenu · Input · Label · NumberInput · Popover · Progress · RadioGroup · ScrollArea · Select · Separator · Sheet · Skeleton · Slider · Switch · Table · Tabs · TagsInput · Textarea · Toast · Toggle · ToggleGroup · Tooltip

### 页面与区块

ActivityLogPage · AuthCard · BlogCard · BlogListPage · BrutalistHero · CookieConsent · DashboardShell · DashboardStats · EmptyState · ErrorCard · FaqSection · FeedbackForm · FileCard · FooterSection · GallerySection · HeaderSection · LoadingPage · NotFoundPage · OverviewPage · PricingSection · ProfilePage · QuickActions · SettingsPage · StepperSection · SuccessCard · TestimonialCard · UploadCard · WaitlistPage

### 特色组件

BeforeAfter · BlogCard · Calendar · Carousel · ChatBubble · CodeBlock · CopyToClipboard · Counter · DataTableSection · GlitchText · HardcoreInput · Kanban · Kbd · Marquee · Pagination · ScratchCard · SearchWidget · SketchyChart · Spinner · Stepper · Timeline · TreeView

## Claude Code Skill

BrutxUI 提供了 Claude Code Skill，让 AI 助手能够根据 BrutxUI 设计规范生成组件代码。

### 安装方式

将 `skills/brutxui/` 目录复制到你的全局 Claude Code 配置目录：

```bash
# Windows
xcopy /E /I skills\brutxui %USERPROFILE%\.claude\skills\brutxui

# macOS / Linux
cp -r skills/brutxui ~/.claude/skills/brutxui
```

### 使用方式

安装后，在 Claude Code 中直接描述你的需求即可：

- "用 BrutxUI 创建一个登录表单"
- "帮我做一个新粗野主义风格的定价页面"
- "BrutxUI 的 Button 组件怎么用？"

Claude 会自动参考组件文档、样式规范和代码模板，生成符合 BrutxUI 设计规范的代码。

## 备注

- **暗色模式**：在 `html` 或 `body` 上添加/移除 `.dark` 以切换主题
- **组件所有权**：组件会复制到你的项目中，让你拥有完全的所有权和自定义控制权
- **令牌覆盖**：可通过设置 CSS 变量（`--brutal-*`）进行覆盖
- **主题预设**：`.theme-classic`（默认）· `.theme-pastel`（柔和）· `.theme-mono`（单色）

## 许可证

[MIT](https://opensource.org/licenses/MIT)
