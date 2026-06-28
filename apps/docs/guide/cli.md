---
title: CLI
description: 了解 brutx-vue 命令行工具的使用方法
---

# CLI

`brutx-vue` CLI 帮助你在项目中初始化 BrutxUI，并通过单条命令添加组件。

## 概览

```bash
npx brutx-vue@latest <command>
```

CLI 会自动处理依赖安装、文件创建和配置更新。

## brutx-vue init

在你的项目中初始化 BrutxUI。它会设置基础配置：

```bash
npx brutx-vue@latest init
```

init 命令将：

1. 检测你的项目框架（Vite、Nuxt 等）
2. 安装所需依赖（`reka-ui`、`class-variance-authority`、`clsx`、`tailwind-merge`、`@lucide/vue`）
3. 在 `src/lib/utils.ts` 创建 `cn()` 工具函数
4. 将 `--brutal-*` CSS 自定义属性注入到你的样式表中
5. 将 BrutxUI 样式（包括 Tailwind 工具类层）添加到你的 CSS 中
6. 设置组件目录结构

### 选项

| 标志 | 描述 | 默认值 |
|------|------|--------|
| `--yes` / `-y` | 跳过提示并使用默认值 | `false` |
| `--defaults` / `-d` | 使用默认配置 | `false` |
| `--cwd <path>` | 设置工作目录 | 当前目录 |
| `--force` / `-f` | 强制覆盖已有配置 | `false` |
| `--silent` / `-s` | 静默输出 | `false` |

## brutx-vue add

向项目中添加单个组件：

```bash
npx brutx-vue@latest add <component...>
```

### 示例

添加单个组件：

```bash
npx brutx-vue@latest add button
```

添加多个组件：

```bash
npx brutx-vue@latest add button card dialog input
```

添加所有可用组件：

```bash
npx brutx-vue@latest add --all
```

### 选项

| 标志 | 描述 | 默认值 |
|------|------|--------|
| `--all` | 添加所有可用组件 | `false` |
| `--yes` / `-y` | 跳过确认提示 | `false` |
| `--cwd <path>` | 设置工作目录 | 当前目录 |
| `--overwrite` | 覆盖已有的组件文件 | `false` |
| `--path <path>` / `-p` | 指定组件添加路径 | — |
| `--silent` / `-s` | 静默输出 | `false` |
| `--dry-run` | 模拟添加，不写入文件 | `false` |
| `--registry <registry>` / `-r` | 指定注册表路径或 URL | — |

## brutx-vue doctor

检查项目配置健康度，诊断常见问题：

```bash
npx brutx-vue@latest doctor
```

doctor 命令将检查：

1. `components.json` 是否存在且格式合法
2. 配置中的路径是否指向真实文件
3. Tailwind CSS 版本兼容性
4. 必要依赖是否已安装（`reka-ui`、`class-variance-authority`、`clsx`、`tailwind-merge`）
5. `cn()` 工具函数是否存在
6. CSS 文件中是否包含 BrutxUI 设计 token
7. 已安装组件的文件完整性

### 示例

基本诊断：

```bash
npx brutx-vue@latest doctor
```

自动修复可修复的问题：

```bash
npx brutx-vue@latest doctor --fix --yes
```

输出 JSON 格式报告：

```bash
npx brutx-vue@latest doctor --json
```

### 选项

| 标志 | 描述 | 默认值 |
|------|------|--------|
| `--cwd <path>` | 设置工作目录 | 当前目录 |
| `--fix` | 自动修复可修复的问题 | `false` |
| `--json` | 输出 JSON 格式报告 | `false` |
| `--yes` / `-y` | 跳过确认提示 | `false` |
| `--silent` / `-s` | 静默输出 | `false` |

### 输出示例

```text
🩺 Brutx-Vue Doctor

  ✅ components.json exists — components.json found.
  ✅ $schema field present — $schema field is present.
  ✅ style field present — style is "brutalism".
  ✅ tailwind.css contains BrutxUI tokens — CSS file contains BrutxUI tokens.
  ✅ aliases.components → @/components — Directory exists.
  ✅ aliases.utils → @/lib/utils — File exists.
  ✅ tailwindcss installed — ^4.3.0 installed.
  ✅ reka-ui installed — ^2.9.9 installed.
  ✅ cn() function exists — cn() function found.

  Summary: 9 passed, 0 warnings, 0 errors
```

### 可自动修复的问题

| 问题 | 修复操作 |
| --- | --- |
| `$schema` 缺失 | 写入 schema URL |
| `style` 缺失 | 设置为 `brutalism` |
| CSS 缺少 BrutxUI token | 注入 CSS 样式 |
| 组件目录不存在 | 创建目录 |
| utils 文件不存在 | 创建 utils 文件 |
| `cn()` 函数不存在 | 添加 cn() 函数 |

## brutx-vue diff

对比本地已安装组件与注册表最新版本的差异：

```bash
npx brutx-vue@latest diff [components...]
```

### 示例

对比单个组件：

```bash
npx brutx-vue@latest diff button
```

对比多个组件：

```bash
npx brutx-vue@latest diff button card dialog
```

对比所有已安装组件：

```bash
npx brutx-vue@latest diff --all
```

输出 JSON 格式：

```bash
npx brutx-vue@latest diff --all --json
```

### 选项

| 标志 | 描述 | 默认值 |
|------|------|--------|
| `--all` | 对比所有已安装组件 | `false` |
| `--cwd <path>` | 设置工作目录 | 当前目录 |
| `--registry <path>` / `-r` | 指定本地注册表路径 | — |
| `--json` | 输出 JSON 格式 | `false` |
| `--silent` / `-s` | 静默输出 | `false` |

### 输出示例

对比单个组件：

```text
📊 Component Diff: button

  Status: 🔄 MODIFIED (1 file changed)

  src/components/ui/button/Button.vue
    --- registry/src/components/ui/button/Button.vue
    +++ local/src/components/ui/button/Button.vue
    -  variant?: 'default' | 'destructive' | 'outline' | 'ghost';
    +  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link';
    +  loading?: boolean;

  Summary: 1 file modified, 0 files unchanged
```

对比所有组件：

```text
📊 Component Diff Report

  🔄 MODIFIED (2)
    — button    (1 file changed)
    — card      (2 files changed)

  ✅ UP-TO-DATE (5)
    — badge
    — dialog
    — input
    — select
    — toast

  Summary: 2 modified, 5 up-to-date, 0 local-only
```

### 可用组件

accordion, activity-log-page, alert, alert-dialog, auth-card, avatar, badge, before-after, blog-card, blog-list-page, breadcrumb, brutalist-hero, button, calendar, card, card-3d, carousel, chat-bubble, checkbox, code-block, combobox, command, cookie-consent, copy-to-clipboard, counter, dashboard-shell, dashboard-stats, data-table-section, dialog, dropdown-menu, empty-state, error-card, faq-section, feedback-form, file-card, footer-section, form, gallery-section, glitch-text, hardcore-input, header-section, input, kbd, kanban, loading-page, marquee, not-found-page, number-input, overview-page, pagination, popover, pricing-section, profile-page, progress, quick-actions, radio-group, saas-pricing, scratch-card, scroll-area, search-widget, select, separator, settings-page, sheet, skeleton, sketchy-chart, slider, spinner, stepper, stepper-section, submit-button, success-card, switch, table, tabs, tabs-nav, tags-input, testimonial-card, textarea, timeline, toast, toggle, toggle-group, tooltip, tree-view, upload-card, waitlist-page
