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

### 可用组件

accordion, activity-log-page, alert, alert-dialog, auth-card, avatar, badge, before-after, blog-card, blog-list-page, breadcrumb, brutalist-hero, button, calendar, card, card-3d, carousel, chat-bubble, checkbox, code-block, combobox, command, cookie-consent, copy-to-clipboard, counter, dashboard-shell, dashboard-stats, data-table-section, dialog, dropdown-menu, empty-state, error-card, faq-section, feedback-form, file-card, footer-section, form, gallery-section, glitch-text, hardcore-input, header-section, input, kbd, kanban, loading-page, marquee, not-found-page, number-input, overview-page, pagination, popover, pricing-section, profile-page, progress, quick-actions, radio-group, saas-pricing, scratch-card, scroll-area, search-widget, select, separator, settings-page, sheet, skeleton, sketchy-chart, slider, spinner, stepper, stepper-section, submit-button, success-card, switch, table, tabs, tabs-nav, tags-input, testimonial-card, textarea, timeline, toast, toggle, toggle-group, tooltip, tree-view, upload-card, waitlist-page
