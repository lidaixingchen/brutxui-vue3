# Neo-Brutalist 视觉系统

## 设计令牌（`src/styles.css` → `:root` / `.dark`）

| 令牌 | 亮色 | 暗色 | 用途 |
|-------|-------|------|------|
| `--brutal-border-width` | `3px` | `3px` | 边框粗细 |
| `--brutal-border-color` | `#000000` | `#ffffff` | 边框颜色 |
| `--brutal-shadow-offset-x` | `4px` | `4px` | 阴影 X 偏移 |
| `--brutal-shadow-offset-y` | `4px` | `4px` | 阴影 Y 偏移 |
| `--brutal-shadow-color` | `#000000` | `#ffffff` | 阴影颜色 |
| `--shadow-brutal-destructive` | `4px 4px 0 0 color-mix(in srgb, var(--brutal-destructive, #EF476F) 30%, transparent)` | 同左 | 危险态半透明红阴影（派生令牌，随主题预设联动） |
| `--brutal-radius` | `0px` | `0px` | 边框圆角 |
| `--brutal-bg` | `#ffffff` | `#141414` | 背景 |
| `--brutal-fg` | `#000000` | `#ffffff` | 前景 |
| `--brutal-primary` | `#FF6B6B` | `#FF6B6B` | 主色（珊瑚红） |
| `--brutal-primary-foreground` | `#000000` | `#000000` | 主色前景（黑字对比度满足 WCAG AA） |
| `--brutal-secondary` | `#4ECDC4` | `#4ECDC4` | 辅助色（薄荷青） |
| `--brutal-secondary-foreground` | `#000000` | `#000000` | 辅助色前景 |
| `--brutal-accent` | `#FFE66D` | `#FFE66D` | 强调色（黄色） |
| `--brutal-accent-foreground` | `#000000` | `#000000` | 强调色前景 |
| `--brutal-destructive` | `#EF476F` | `#EF476F` | 危险色 |
| `--brutal-destructive-foreground` | `#ffffff` | `#ffffff` | 危险色前景（白字） |
| `--brutal-success` | `#7FB069` | `#7FB069` | 成功色 |
| `--brutal-success-foreground` | `#000000` | `#000000` | 成功色前景 |
| `--brutal-info` | `#4A90D9` | `#3B82F6` | 信息提示色 |
| `--brutal-info-foreground` | `#000000` | `#000000` | 信息提示前景 |
| `--brutal-status-success` | `#22c55e` | `#22c55e` | 状态成功色（恒定辨识信号，亮暗一致） |
| `--brutal-status-success-foreground` | `#000000` | `#000000` | 状态成功前景（黑字对比 8.6:1） |
| `--brutal-status-warning` | `#FFE66D` | `#FFE66D` | 状态警告色 |
| `--brutal-status-warning-foreground` | `#000000` | `#000000` | 状态警告前景 |
| `--brutal-status-info` | `#3b82f6` | `#3b82f6` | 状态信息色 |
| `--brutal-status-info-foreground` | `#000000` | `#000000` | 状态信息前景（黑字对比 5.8:1） |
| `--brutal-status-error` | `#EF476F` | `#EF476F` | 状态错误色 |
| `--brutal-status-error-foreground` | `#ffffff` | `#ffffff` | 状态错误前景 |
| `--brutal-muted` | `#f3f4f6` | `#1e1e1e` | 柔和背景 |
| `--brutal-muted-foreground` | `#4B5563` | `#9CA3AF` | 柔和文本前景 |
| `--brutal-ring` | `#000000` | `#ffffff` | 焦点环 |
| `--brutal-overlay` | `rgba(0, 0, 0, 0.5)` | `rgba(0, 0, 0, 0.7)` | 遮罩层背景 |
| `--brutal-overlay-subtle` | `rgba(0, 0, 0, 0.05)` | `rgba(255, 255, 255, 0.05)` | 微妙叠色（浅层覆盖/拖拽指示） |
| `--brutal-placeholder` | `#9CA3AF` | `#6B7280` | 输入框占位文本颜色 |
| `--brutal-black` | `#000000` | `#000000` | 基础黑色 |
| `--brutal-yellow` | `#FFE66D` | `#FFE66D` | 基础黄色 |

## 视觉规则

> **单一权威声明**：本节 R1-R7 是全部视觉规则的唯一权威定义，COMPONENT_GUIDE 与 CVA.md 只引用、不重复抄写；调整视觉规则只改本节，并同步抽查引用方。

1. **边框：** 主边框 `border-3 border-brutal`——禁止细边框或浅色 slate/gray 边框。例外（次级交互边框）：Transfer 选项行等状态指示器可用 1px 占位细边框 `border border-transparent`（选中切 `border-brutal` 同宽换色、防布局跳变，见 Transfer.vue:203-205）；圆角一律 `rounded-brutal`；虚线指示边框必须用 `border-brutal-dashed`（`border-brutal` 强制 solid，不可与 `border-dashed` 混用）——`border-brutal-dashed` 只设 style/color，须与宽度类配对（如 `border-t-4 border-brutal-dashed`）
2. **阴影：** 仅使用 `shadow-brutal` 系工具类（`shadow-brutal`/`shadow-brutal-sm`/`shadow-brutal-lg`/`shadow-brutal-xl`/`shadow-brutal-primary`/`shadow-brutal-secondary`/`shadow-brutal-destructive`）——禁止模糊阴影（`shadow-md`、`shadow-lg` 被禁止），禁止手写 `shadow-[Npx_Npx_0px_0px_rgba(...)]` 任意值字面量。例外一（标度外偏移逃生口）：偏移不在 sm/base/lg/xl 档位时，用 `shadow-brutal [--brutal-shadow-offset-x:Npx] [--brutal-shadow-offset-y:Npx]` 本地覆盖，或偏移写数字但颜色必须走 `var(--brutal-shadow-color, #000000)`（随主题）。例外二（危险态半透明红阴影）：用 `shadow-brutal-destructive`（引用 `--brutal-destructive` 30% 透明 color-mix 派生，随主题预设联动）。src 内新增 `shadow-[*rgba*]` 类由 CI 门禁 `check:deprecated:check` 拦截
3. **圆角：** `rounded-brutal`——禁止硬编码 `rounded-md` 等
4. **按压：** `active:translate-x-[var(--brutal-shadow-offset-x,4px)] active:translate-y-[var(--brutal-shadow-offset-y,4px)] active:shadow-none`——交互元素必须在按压时斜向滑到阴影原本的位置（X/Y 各等于阴影偏移）并去除阴影，「落回右下角盖住自己的影子」，不能感觉迟钝。位移直接派生自 `--brutal-shadow-offset-x/y` 令牌（单一事实来源，主题自定义阴影偏移时按压自动同步）；完整类名串复用 `@/lib/brutal-interaction-variants` 的 `brutalPress`（含「完整字面量」约定）。例外一：ghost/link 低强调变体豁免位移+阴影（`shadow-none` + 仅背景/下划线悬浮反馈，见 shared-button-variants.ts:66-77）。例外二：无阴影/分段控件/整宽单元格/小尺度私有设计用 B 类字面量（如 `active:translate-y-[2px]`，见各组件变体）。**本规则不规定 transition 值**——过渡属性统一遵循 COMPONENT_GUIDE r13；⚠️ **同一交互元素只声明一份 transition**：若经 `cn()` 拼接共享交互变体，tailwind-merge 会把同组（transition-*）先写类**静默移除**、以后写者为准（机制见 [TAILWIND_V4_MECHANISMS.md](TAILWIND_V4_MECHANISMS.md) §2）
5. **悬停：** `hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5`
6. **颜色：** 使用 `--brutal-*` CSS 变量（语义色及其 `*-foreground` 前景家族、`--brutal-status-*` 状态色）——禁止硬编码任意颜色，含 Tailwind 默认色板（如 `bg-[#22c55e]`、`text-gray-500`）与 `text-white`/`text-black` 字面量（前景一律随 `--brutal-*-foreground` 令牌随主题/暗色翻转）。状态色必须用 `--brutal-status-*` 家族。虚线指示边框必须用 `border-brutal-dashed`。`bg-black/5` 类 5% 叠色为显式豁免。例外：状态型半透明阴影（如加载失败徽标 30% 红影）经 `shadow-brutal-destructive` 实现，α 值仅允许在此类状态阴影中出现
7. **焦点态：** 统一用 ring——引用 `FOCUS_RING_CLASSES`（`focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2 focus-visible:ring-offset-brutal-bg focus-visible:outline-hidden`），经阴影组装化后 box-shadow 争用根因消除，ring 与 brutal 阴影可同元素共存；配套 `outline-hidden` 在普通模式下抑制 UA 焦点 outline（无双环），在 forced-colors 模式下自带恢复块配合 UA 强制渲染系统焦点环（WCAG 2.4.7）；**禁止在承载焦点指示的元素上误加 `outline-none`**（无 forced-colors 恢复块）；容器 focus-within 方案必须同配 `focus-within:outline-hidden`；内层 input/textarea 可保留 `outline-none` 抑制自身 UA 焦点环；`FOCUS_RING_CLASSES` 是焦点类唯一常量入口，CVA.md 范例与 COMPONENT_GUIDE r12 均引用本节；`apps/docs` 是独立 Tailwind 作用域，不扫描跨包 TS 常量，须写等值五件套字面量 `focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2 focus-visible:ring-offset-brutal-bg focus-visible:outline-hidden`；`packages/ui/src` 与 `apps/docs` 内非标 `ring-*` 类由 CI 门禁 `check:deprecated:check`（白名单模式）拦截

## CVA 变体文件

[CVA.md](CVA.md)

### Tailwind 工具类

- 边框：`border-3`、`border-brutal`、`border-brutal-dashed`、`rounded-brutal`
- 阴影：`shadow-brutal`、`shadow-brutal-sm`、`shadow-brutal-lg`、`shadow-brutal-xl`、`shadow-brutal-primary`、`shadow-brutal-secondary`、`shadow-brutal-destructive`
- 颜色：`@theme --color-brutal-*` 自动生成 `bg-`/`text-`/`border-` 类——全量清单：`bg-brutal-bg`、`text-brutal-fg`、`text-brutal-muted-foreground`、`bg-brutal-primary`、`bg-brutal-primary-foreground`、`bg-brutal-secondary`、`bg-brutal-secondary-foreground`、`bg-brutal-accent`、`bg-brutal-accent-foreground`、`bg-brutal-destructive`、`bg-brutal-destructive-foreground`、`bg-brutal-success`、`bg-brutal-success-foreground`、`bg-brutal-info`、`bg-brutal-info-foreground`、`bg-brutal-muted`、`bg-brutal-yellow`、`bg-brutal-black`、`text-brutal-black`、`bg-brutal-status-success`、`bg-brutal-status-success-foreground`、`bg-brutal-status-warning`、`bg-brutal-status-warning-foreground`、`bg-brutal-status-info`、`bg-brutal-status-info-foreground`、`bg-brutal-status-error`、`bg-brutal-status-error-foreground`
- 变体支持差异：`shadow-brutal*` 与 `bg/text/border-brutal-*` 均经 `@theme` 派生，支持 `hover:`/`data-[...]:` 等变体；`border-3`/`border-brutal`/`border-brutal-dashed` 为手写 `@layer utilities` 类**不带变体支持**（`hover:border-brutal` 会被静默丢弃）——机制见 [TAILWIND_V4_MECHANISMS.md](TAILWIND_V4_MECHANISMS.md) §3

### 主题预设

`.theme-classic`（默认）· `.theme-pastel`（柔和，8px 圆角）· `.theme-mono`（灰度，4px 边框）

### 文档主题实验室

`apps/docs/guide/theme-playground.md` 和 `apps/docs/.vitepress/theme/components/ThemePlayground.vue` 是 docs-only 的主题调试工具，用于生成 `.theme-custom` CSS、预览 token 效果、检查对比度和 token 覆盖率。除非用户明确要求沉淀为可安装组件，否则不要把它加入 `packages/ui`、registry 或 `useTheme()` 的公开 API。

## 反模式（禁止）

1. **禁止软阴影：** 不要使用 Tailwind 默认的 `shadow-md` 或 `shadow-lg`，不要手写 `shadow-[Npx_Npx_0px_0px_rgba(...)]` 任意值字面量。使用 `shadow-brutal` 系（含 `shadow-brutal-destructive` 危险态半透明红阴影，见视觉规则 2）。
2. **禁止圆角边框：** 不要将 `rounded-md` 或 `rounded-lg` 用作默认变体，除非通过主题自定义样式类明确柔化。使用 `rounded-none` 或 `rounded-brutal`。
3. **禁止暗淡边框：** 不要将 `border-slate-100` 或 `border-slate-200` 等浅色边框用于主边框。主边框必须保持粗重（`border-3 border-brutal`）。例外（次级交互边框）：Transfer 选项行等状态指示器可用 1px 占位细边框 `border border-transparent`（见视觉规则 1）。
4. **禁止缺少按压反馈：** 交互式按钮必须在点击时产生位移并去影。不要让激活状态感觉迟钝或无生气。例外：ghost/link 低强调变体豁免（见视觉规则 4）。
