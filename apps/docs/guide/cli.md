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
| `--vscode` | 生成 VS Code 代码片段 | `false` |
| `--workspace-root <path>` | 指定 monorepo 工作区根目录 | — |

init 支持 monorepo 工作区检测（pnpm-workspace.yaml / lerna.json / turbo.json）。

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
| `--no-cache` | 跳过注册表缓存 | `false` |
| `--vscode` | 更新 VS Code 代码片段 | `false` |

### 版本锁定

```bash
npx brutx-vue@latest add button@1.2.0
```

使用 `@` 语法将组件锁定到指定版本（映射到注册表中对应的 GitHub tag）。

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
8. `$version` 配置版本检查

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
| `--fix-only <fixId>` | 仅执行指定的修复项 | — |
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
| `$version` 过期 | 更新为当前版本 |
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
| `--no-cache` | 跳过注册表缓存 | `false` |

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

## brutx-vue update

检查已安装组件是否有可用更新，并一键更新：

```bash
npx brutx-vue@latest update [components...]
```

update 命令内部复用 diff 逻辑检测过期组件，再执行覆盖安装。

### 示例

检查并更新所有已安装组件：

```bash
npx brutx-vue@latest update
```

更新指定组件：

```bash
npx brutx-vue@latest update button card
```

仅预览，不实际更新：

```bash
npx brutx-vue@latest update --dry-run
```

### 选项

| 标志 | 描述 | 默认值 |
|------|------|--------|
| `--all` / `-a` | 更新所有过期组件 | `false` |
| `--yes` / `-y` | 跳过确认提示 | `false` |
| `--cwd <path>` | 设置工作目录 | 当前目录 |
| `--dry-run` | 仅预览，不写入文件 | `false` |
| `--registry <registry>` / `-r` | 指定注册表 URL | — |
| `--no-cache` | 跳过注册表缓存 | `false` |
| `--silent` / `-s` | 静默输出 | `false` |

## brutx-vue list

列出项目中已安装的组件及其信息：

```bash
npx brutx-vue@latest list
```

### 选项

| 标志 | 描述 | 默认值 |
|------|------|--------|
| `--cwd <path>` | 设置工作目录 | 当前目录 |
| `--json` | 输出 JSON 格式 | `false` |
| `--silent` / `-s` | 静默输出 | `false` |

### 输出示例

```text
Installed Components

  Name      Files   Dependencies
  ─────────────────────────────────
  badge     2       vue
  button    3       vue, reka-ui, @lucide/vue
  card      2       vue

  3 component(s) installed
```

## brutx-vue info

查看指定组件的详细信息：

```bash
npx brutx-vue@latest info <component>
```

### 示例

```bash
npx brutx-vue@latest info button
```

### 选项

| 标志 | 描述 | 默认值 |
|------|------|--------|
| `--cwd <path>` | 设置工作目录 | 当前目录 |
| `--json` | 输出 JSON 格式 | `false` |
| `--registry <registry>` / `-r` | 指定注册表路径或 URL | — |
| `--silent` / `-s` | 静默输出 | `false` |

## brutx-vue remove

从项目中移除已安装的组件：

```bash
npx brutx-vue@latest remove <components...>
```

remove 命令会删除组件目录，并检测不再被其他组件引用的孤儿文件（composable / locale），提示是否一并清理。

### 示例

移除单个组件：

```bash
npx brutx-vue@latest remove button
```

移除多个组件：

```bash
npx brutx-vue@latest remove button card
```

仅预览，不实际删除：

```bash
npx brutx-vue@latest remove button --dry-run
```

### 选项

| 标志 | 描述 | 默认值 |
|------|------|--------|
| `--yes` / `-y` | 跳过确认提示 | `false` |
| `--cwd <path>` | 设置工作目录 | 当前目录 |
| `--dry-run` | 仅预览，不删除文件 | `false` |
| `--silent` / `-s` | 静默输出 | `false` |

## brutx-vue create

从零创建一个预配置 BrutxUI 的 Vue 3 项目：

```bash
npx brutx-vue@latest create <project-name>
```

create 命令会自动搭建项目脚手架、安装依赖并运行 `init`。

### 示例

```bash
npx brutx-vue@latest create my-app
```

使用 Nuxt 模板：

```bash
npx brutx-vue@latest create my-app --template nuxt
```

### 选项

| 标志 | 描述 | 默认值 |
|------|------|--------|
| `--template <template>` / `-t` | 项目模板（`default`、`nuxt`） | `default` |
| `--package-manager <pm>` | 包管理器（`pnpm`、`npm`、`yarn`、`bun`） | `pnpm` |
| `--cwd <path>` | 设置工作目录 | 当前目录 |
| `--yes` / `-y` | 跳过确认提示 | `false` |

## components.json 配置文件

运行 `init` 后，项目根目录会生成 `components.json`：

```json
{
  "$schema": "https://lidaixingchen.github.io/brutxui-vue3/schema.json",
  "$version": 1,
  "style": "brutalism",
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css"
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "composables": "@/composables"
  }
}
```

| 字段 | 描述 |
|------|------|
| `$schema` | JSON Schema URL，提供 IDE 校验 |
| `$version` | 配置文件版本号，CLI 读取时自动迁移旧版本 |
| `style` | 样式主题，当前仅支持 `brutalism` |
| `tailwind.config` | Tailwind 配置文件路径（v4 项目为空字符串） |
| `tailwind.css` | 全局 CSS 文件路径 |
| `aliases.components` | 组件导入别名 |
| `aliases.utils` | 工具函数导入别名 |
| `aliases.composables` | 组合式函数导入别名 |

### 可用组件

accordion, activity-log-page, alert, alert-dialog, auth-card, avatar, badge, before-after, blog-card, blog-list-page, breadcrumb, brutalist-hero, button, calendar, card, card-3d, carousel, chat-bubble, checkbox, code-block, combobox, command, cookie-consent, copy-to-clipboard, counter, dashboard-shell, dashboard-stats, data-table-section, dialog, dropdown-menu, empty-state, error-card, faq-section, feedback-form, file-card, footer-section, form, gallery-section, glitch-text, hardcore-input, header-section, input, kbd, kanban, loading-page, marquee, not-found-page, number-input, overview-page, pagination, popover, pricing-section, profile-page, progress, quick-actions, radio-group, scratch-card, scroll-area, search-widget, select, separator, settings-page, sheet, skeleton, sketchy-chart, slider, spinner, stepper, stepper-section, submit-button, success-card, switch, table, tabs, tags-input, testimonial-card, textarea, timeline, toast, toggle, toggle-group, tooltip, tree-view, upload-card, waitlist-page
