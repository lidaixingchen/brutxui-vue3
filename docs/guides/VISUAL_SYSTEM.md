# Neo-Brutalist 视觉系统

## 设计令牌（`src/styles.css` → `:root` / `.dark`）

| 令牌 | 亮色 | 暗色 | 用途 |
|-------|-------|------|------|
| `--brutal-border-width` | `3px` | `3px` | 边框粗细 |
| `--brutal-border-color` | `#000000` | `#ffffff` | 边框颜色 |
| `--brutal-shadow-offset-x` | `4px` | `4px` | 阴影 X 偏移 |
| `--brutal-shadow-offset-y` | `4px` | `4px` | 阴影 Y 偏移 |
| `--brutal-shadow-color` | `#000000` | `#ffffff` | 阴影颜色 |
| `--brutal-radius` | `0px` | `0px` | 边框圆角 |
| `--brutal-bg` | `#ffffff` | `#141414` | 背景 |
| `--brutal-fg` | `#000000` | `#ffffff` | 前景 |
| `--brutal-primary` | `#FF6B6B` | `#FF6B6B` | 主色（珊瑚红） |
| `--brutal-secondary` | `#4ECDC4` | `#4ECDC4` | 辅助色（薄荷青） |
| `--brutal-accent` | `#FFE66D` | `#FFE66D` | 强调色（黄色） |
| `--brutal-destructive` | `#EF476F` | `#EF476F` | 危险色 |
| `--brutal-success` | `#7FB069` | `#7FB069` | 成功色 |
| `--brutal-info` | `#4A90D9` | `#3B82F6` | 信息提示色 |
| `--brutal-muted` | `#f3f4f6` | `#1e1e1e` | 柔和背景 |
| `--brutal-ring` | `#000000` | `#ffffff` | 焦点环 |
| `--brutal-pressed-offset` | `2px` | `2px` | 激活按压偏移 |

## 视觉规则

1. **边框：** `border-3 border-brutal`——禁止细边框或浅色 slate/gray 边框
2. **阴影：** 仅使用 `shadow-brutal*`——禁止模糊/扩散阴影（`shadow-md`、`shadow-lg` 被禁止）
3. **圆角：** `rounded-brutal`——禁止硬编码 `rounded-md` 等
4. **按压：** `active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none transition-all`——交互元素必须在按压时产生位移，不能感觉迟钝
5. **悬停：** `hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5`
6. **颜色：** 使用 `--brutal-*` CSS 变量——禁止硬编码任意颜色

## CVA 变体文件

[CVA.md](CVA.md)

### Tailwind 工具类

- 边框：`border-3`、`border-brutal`、`rounded-brutal`
- 阴影：`shadow-brutal`、`shadow-brutal-sm`、`shadow-brutal-lg`、`shadow-brutal-xl`
- 颜色：`bg-brutal-bg`、`text-brutal-fg`、`bg-brutal-primary`、`bg-brutal-secondary`、`bg-brutal-accent`、`bg-brutal-destructive`、`bg-brutal-success`、`bg-brutal-info`、`bg-brutal-muted`

### 主题预设

`.theme-classic`（默认）· `.theme-pastel`（柔和，8px 圆角）· `.theme-mono`（灰度，4px 边框）

### 文档主题实验室

`apps/docs/guide/theme-playground.md` 和 `apps/docs/.vitepress/theme/components/ThemePlayground.vue` 是 docs-only 的主题调试工具，用于生成 `.theme-custom` CSS、预览 token 效果、检查对比度和 token 覆盖率。除非用户明确要求沉淀为可安装组件，否则不要把它加入 `packages/ui`、registry 或 `useTheme()` 的公开 API。

## 反模式（禁止）

1. **禁止软阴影：** 不要使用 Tailwind 默认的 `shadow-md` 或 `shadow-lg`。使用 `shadow-brutal` 或 `shadow-brutal-lg`。
2. **禁止圆角边框：** 不要将 `rounded-md` 或 `rounded-lg` 用作默认变体，除非通过主题自定义样式类明确柔化。使用 `rounded-none` 或 `rounded-brutal`。
3. **禁止暗淡边框：** 不要将 `border-slate-100` 或 `border-slate-200` 等浅色边框用于主边框。边框必须保持粗重（`border-3 border-brutal`）。
4. **禁止缺少按压反馈：** 交互式按钮必须在点击时产生位移。不要让激活状态感觉迟钝或无生气。
