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
| `--z-index-dropdown` | `1000` | `1000` | 下拉菜单、选择器浮层 |
| `--z-index-sticky` | `1100` | `1100` | 吸顶导航、吸底栏 |
| `--z-index-dialog` | `2000` | `2000` | 对话框、抽屉、MessageBox 遮罩与内容 |
| `--z-index-popover` | `5000` | `5000` | 浮动卡片、气泡弹窗 |
| `--z-index-tooltip` | `6000` | `6000` | 工具提示（浮于常规 Popover 之上） |
| `--z-index-toast` | `10010` | `10010` | 全局通知容器与消息提示 |
| `--z-index-loading` | `9200` | `9200` | 全屏与局部遮罩加载指示器 |

## 视觉规则 (R1 - R8)

> **单一权威声明**：本节 R1-R8 是全部视觉规则的唯一权威定义，[COMPONENT_GUIDE.md](COMPONENT_GUIDE.md) 与 [CVA.md](CVA.md) 只引用、不重复抄写；调整视觉规则只改本节，并同步抽查引用方。

### R1 边框体系 (Border)
- **主边框规则**：主边框必须使用 `border-3 border-brutal`，严禁细边框或浅色（如 `slate`/`gray`）边框。
- **圆角规则**：圆角一律使用 `rounded-brutal`（默认 0px，随主题联动）。
- **虚线边框**：虚线指示边框必须使用 `border-brutal-dashed`（`border-brutal` 强制 solid，不可与 `border-dashed` 混用）。`border-brutal-dashed` 仅设定 style 与 color，必须与宽度类配对（如 `border-t-4 border-brutal-dashed`）。
- **合法例外**：
  - *次级交互边框*：Transfer 选项行等状态指示器允许使用 1px 占位细边框 `border border-transparent`（选中态切换为 `border-brutal` 同宽换色，防止布局跳变）。

### R2 阴影体系 (Shadow)
- **核心规则**：仅使用 `shadow-brutal` 系工具类（`shadow-brutal`、`shadow-brutal-sm`、`shadow-brutal-lg`、`shadow-brutal-xl`、`shadow-brutal-primary`、`shadow-brutal-secondary`、`shadow-brutal-destructive`）。严禁模糊阴影（如 `shadow-md`、`shadow-lg`），严禁手写 `shadow-[Npx_Npx_0px_0px_rgba(...)]` 任意值字面量。
- **合法例外**：
  - *标度外偏移逃生口*：偏移不在 sm/base/lg/xl 档位时，使用 `shadow-brutal [--brutal-shadow-offset-x:Npx] [--brutal-shadow-offset-y:Npx]` 本地覆盖；若手写偏移数字，颜色必须走 `var(--brutal-shadow-color, #000000)` 以跟随主题。
  - *危险态半透明红阴影*：统一使用 `shadow-brutal-destructive`（引用 `--brutal-destructive` 30% 透明 `color-mix` 派生，随主题预设联动）。
- **防回潮守卫**：源码内新增 `shadow-[*rgba*]` 任意值由 CI 门禁 `check:deprecated:check` 拦截。

### R3 圆角体系 (Radius)
- **核心规则**：统一使用 `rounded-brutal`，严禁硬编码 `rounded-md`、`rounded-lg` 等。

### R4 按压反馈 (Press Feedback)
- **核心动作**：`active:translate-x-[var(--brutal-shadow-offset-x,4px)] active:translate-y-[var(--brutal-shadow-offset-y,4px)] active:shadow-none`。
- **盖影语义**：交互元素在按压激活时，必须沿斜向滑到阴影原本的位置（X/Y 偏移量各自等于阴影偏移），同时去除阴影（「落回右下角盖住自己的影子」），按压位移直接派生自 `--brutal-shadow-offset-x/y` 令牌。
- **代码复用**：完整类名串复用 `@/lib/brutal-interaction-variants` 的 `brutalPress`（遵循完整字面量契约）。
- **合法例外**：
  - *低强调变体*：`ghost` / `link` 变体豁免位移与阴影（`shadow-none` + 仅背景或下划线悬浮反馈）。
  - *私有与紧凑设计*：无阴影组件、分段控件、整宽单元格等小尺度私有设计允许使用轻量字面量（如 `active:translate-y-[2px]`）。
- **过渡协同**：本规则不规定 transition 具体属性，过渡属性统一遵循 [COMPONENT_GUIDE.md](COMPONENT_GUIDE.md)「视觉与交互行为」节。同一交互元素只应声明一份 transition（避免 twMerge 同组静默移除陷阱，机制见 [TAILWIND_V4_MECHANISMS.md](TAILWIND_V4_MECHANISMS.md) §2）。

### R5 悬停反馈 (Hover Feedback)
- **核心动作**：`hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5`（微上浮并放大硬阴影）。

### R6 颜色体系 (Colors)
- **核心规则**：一律使用 `--brutal-*` CSS 变量（语义色及其 `*-foreground` 前景家族、`--brutal-status-*` 状态色家族）。
- **前景与翻转**：严禁硬编码任意颜色，包括 Tailwind 默认色板（如 `bg-[#22c55e]`、`text-gray-500`）与 `text-white`/`text-black` 字面量。文本前景色必须使用 `--brutal-*-foreground` 令牌以确保亮暗主题正确翻转。
- **状态色与叠色**：
  - 状态指示必须使用 `--brutal-status-*` 家族；
  - `bg-black/5` 5% 叠色为浅层覆盖显式豁免；
  - 状态型半透明阴影仅允许通过 `shadow-brutal-destructive` 实现（alpha 值仅允许在此类状态阴影中出现）。

### R7 焦点指示体系 (Focus Ring)
- **核心规则**：统一采用 Ring 表达——引用 `@/lib/utils` 的 `FOCUS_RING_CLASSES`（`focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2 focus-visible:ring-offset-brutal-bg focus-visible:outline-hidden`）。
- **机制与 forced-colors 兼容**：
  - 阴影组装化后，`box-shadow` 争用根因消除，Ring 与 brutal 阴影可同元素并存；
  - 配套的 `focus-visible:outline-hidden` 在普通模式下抑制 UA 默认焦点环（避免双环），在 `forced-colors` 高对比度模式下由其自带恢复块配合 UA 强制渲染系统焦点环（满足 WCAG 2.4.7）。
- **禁忌与陷阱**：
  - 严禁在承载焦点指示的元素上误加 `outline-none`（无 forced-colors 恢复块且存在变量抑制陷阱）；
  - `focus-within` 容器方案必须同配 `focus-within:outline-hidden`；
  - 容器包裹的内层 input/textarea 允许保留 `outline-none` 抑制自身 UA 焦点环。
- **Docs 作用域规范**：
  - `apps/docs` 属独立 Tailwind 作用域，不扫描跨包 TS 常量，须书写等值五件套字面量 `focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2 focus-visible:ring-offset-brutal-bg focus-visible:outline-hidden`。
- **防回潮守卫**：
  - `packages/ui/src` 与 `apps/docs` 内非标 `ring-*` 类由 CI 门禁 `check:deprecated:check`（白名单模式）拦截。

### R8 排版体系 (Typography)
- **核心规则**：各组件排版必须严格归属于以下 6 类排印语义层级，杜绝随意搭配字重与字间距：
  - **展示级大标题（Display）**：`font-black tracking-tight leading-none`（用于 Hero 标题、主 Section 大标题）；
  - **结构标题（Structural Heading）**：`font-bold tracking-tight leading-snug`（用于 CardTitle、AlertTitle、DialogTitle、Accordion 标题）；
  - **主控交互（Primary Interactive）**：`font-black tracking-wide`（用于 Button、Toggle、Pagination 激活按钮等核心操作）；
  - **次级标签（Secondary Interactive）**：`font-bold tracking-wide`（用于 Badge、TabsTrigger、Tag、Switch/Checkbox 旁附标签）；
  - **数据与代码（Technical/Data）**：`font-mono font-bold tracking-normal`（用于 Kbd、CodeBlock、Counter、Metric、PinInput）；
  - **正文与辅助描述（Body/Muted）**：`font-medium text-brutal-muted-foreground leading-relaxed`（用于 CardDescription、FormDescription、辅助提示）。

### R9 层级与浮层体系 (Z-Index)
- **核心规则**：全库浮层、弹窗、提示及遮罩必须严格使用语义 `z-*` 类名（`z-dropdown`, `z-sticky`, `z-dialog`, `z-popover`, `z-tooltip`, `z-toast`, `z-loading`, `z-tour-canvas`, `z-tour-popover`, `z-preview-overlay`, `z-preview-control` 等），杜绝硬编码 `z-50` 或任意值 `z-[9999]`。
- **阶梯标度契约**：
  - **Level 1 (下拉/吸顶)**：`z-dropdown` (1000) / `z-sticky` (1100) — Select、Dropdown、Cascader 下拉菜单及 Sticky 容器；
  - **Level 2 (模态对话框)**：`z-dialog` (2000) — Modal、Dialog、AlertDialog、Drawer/Sheet、MessageBox 遮罩与内容；
  - **Level 3 (气泡弹层)**：`z-popover` (5000) — Popover、ColorPicker、DatePicker 浮动卡片；
  - **Level 4 (工具提示)**：`z-tooltip` (6000) — Tooltip 浮层（确保悬停时可浮在 Dialog/Popover 选项之上）；
  - **Level 5 (顶层通知/引导/加载)**：`z-tour-canvas` (9000), `z-tour-popover` (9001), `z-preview-overlay` (9100), `z-preview-control` (9101), `z-loading` (9200), `z-toast` (10010) — 漫游引导、全屏图片预览、Loading 指示器与全局 Toast 容器。
- **tailwind-merge 去重保障**：全库 `cn()` 已通过 `classGroups.z` 注册全部语义类名，外部传入 `z-50` 或其他层级类名时可实现确定性覆盖去重（机制见 [TAILWIND_V4_MECHANISMS.md](TAILWIND_V4_MECHANISMS.md) §6）。

## CVA 变体文件

[CVA.md](CVA.md)

### Tailwind 工具类

- **边框与圆角**：`border-3`、`border-brutal`、`border-brutal-dashed`、`rounded-brutal`
- **阴影**：`shadow-brutal`、`shadow-brutal-sm`、`shadow-brutal-lg`、`shadow-brutal-xl`、`shadow-brutal-primary`、`shadow-brutal-secondary`、`shadow-brutal-destructive`
- **层级派生类（`@theme --z-index-*` 自动生成 `z-*`）**：`z-dropdown`、`z-sticky`、`z-dialog`、`z-popover`、`z-tooltip`、`z-loading`、`z-toast`、`z-message`、`z-tour-canvas`、`z-tour-popover`、`z-preview-overlay`、`z-preview-control`
- **颜色派生类（`@theme --color-brutal-*` 自动生成 `bg-` / `text-` / `border-`）**：
  - *品牌与基础*：`bg-brutal-bg`、`text-brutal-fg`、`bg-brutal-primary`、`bg-brutal-secondary`、`bg-brutal-accent`、`bg-brutal-destructive`、`bg-brutal-success`、`bg-brutal-info`、`bg-brutal-muted`、`bg-brutal-yellow`、`bg-brutal-black`
  - *前景家族*：`text-brutal-primary-foreground`、`text-brutal-secondary-foreground`、`text-brutal-accent-foreground`、`text-brutal-destructive-foreground`、`text-brutal-success-foreground`、`text-brutal-info-foreground`、`text-brutal-muted-foreground`
  - *状态色家族*：`bg-brutal-status-success`、`bg-brutal-status-success-foreground`、`bg-brutal-status-warning`、`bg-brutal-status-warning-foreground`、`bg-brutal-status-info`、`bg-brutal-status-info-foreground`、`bg-brutal-status-error`、`bg-brutal-status-error-foreground`
- **变体支持差异**：
  - `shadow-brutal*`、`z-*` 与 `bg/text/border-brutal-*` 均经 `@theme` 派生，原生支持 `hover:`、`focus:`、`data-[...]:` 等变体；
  - 手写 `@layer utilities` 类（`border-3`、`border-brutal`、`border-brutal-dashed`）**不带变体支持**（如 `hover:border-brutal` 会被静默丢弃，机制见 [TAILWIND_V4_MECHANISMS.md](TAILWIND_V4_MECHANISMS.md) §3）。

### 主题预设

- `.theme-classic`（默认风格）
- `.theme-pastel`（柔和风格，8px 圆角）
- `.theme-mono`（黑白灰度风格，4px 边框）

### 文档主题实验室

`apps/docs/guide/theme-playground.md` 和 `apps/docs/.vitepress/theme/components/ThemePlayground.vue` 是 docs-only 的主题调试工具，用于生成 `.theme-custom` CSS、预览 token 效果、检查对比度和 token 覆盖率。除非用户明确要求沉淀为可安装组件，否则不要把它加入 `packages/ui`、registry 或 `useTheme()` 的公开 API。

## 反模式（Anti-Patterns）

| 规则 | ❌ 禁止写法 | ✅ 正确做法 | 治理原因 |
|---|---|---|---|
| **阴影** | `shadow-md`、`shadow-lg`、`shadow-[4px_4px_0_0_#000]` | `shadow-brutal` 系工具类 | 软模糊阴影违背新粗野主义风格；任意值字面量破坏主题响应 |
| **圆角** | 默认写死 `rounded-md`、`rounded-lg` | `rounded-brutal` 或 `rounded-none` | 圆角应通过主题令牌控制，不应内联硬编码 |
| **边框** | 浅灰细边框（如 `border-slate-200`、`border`） | `border-3 border-brutal` | 主边框必须保持粗重鲜明（Transfer 等占位指示除外） |
| **按压** | 点击无位移或缺少去影 | 复用 `brutalPress`（位移 + 去影） | 缺少按压反馈会导致交互迟钝无生气 |
| **前景** | `text-white`、`text-black` 硬编码 | `text-brutal-*-foreground` | 破坏暗色模式与自定义主题下的文本对比度 |
| **焦点** | 在承载焦点元素上使用 `outline-none` | `FOCUS_RING_CLASSES` | 缺少 forced-colors 恢复块且抑制焦点环渲染 |
| **层级** | `z-50`、`z-[9999]` 等非标硬编码层级 | `z-dialog`、`z-popover` 等语义工具类 | 破坏 5 级全局层级秩序，引发不同浮层遮挡错乱与去重失效 |
