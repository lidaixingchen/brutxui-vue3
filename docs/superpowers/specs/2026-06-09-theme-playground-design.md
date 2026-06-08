# BrutxUI Theme Playground Design

## 背景

BrutxUI 已经有 `classic`、`pastel`、`mono` 三套主题预设，核心样式通过 `--brutal-*` CSS 变量驱动，`useTheme()` 支持在运行时切换主题和亮暗模式。当前短板不是缺少 token，而是缺少一个能让用户直观看到、调整并复制主题变量的品牌化入口。

本设计将第一版 Theme Playground 定位为 docs 内嵌工具，用于强化 BrutxUI 的 Neo-Brutalist 品牌识别。它不进入 `packages/ui` 公共 API，也不作为 registry 组件发布。

## 目标

- 在文档站提供一个控制台式 Theme Playground。
- 支持基于现有主题预设调节颜色、边框、圆角和阴影 token。
- 在右侧实时预览真实 BrutxUI 组件效果。
- 生成可复制的 `.theme-custom` CSS 变量代码。
- 保持第一版实现限定在 `apps/docs`，不改变组件包公开 API。

## 非目标

- 不新增 `ThemeCustomizer`、`ThemeProvider`、`ThemePreview` 等可发布 UI 组件。
- 不修改 `packages/ui/src/styles.css` 现有主题 token。
- 不扩展 `ThemeName` 类型，`useTheme()` 仍只支持 `classic | pastel | mono`。
- 不提供保存 preset、导入/导出 JSON、随机主题或分享 URL。
- 不写入 localStorage，不影响全站文档主题。

## 页面位置

- 新增页面：`apps/docs/guide/theme-playground.md`
- 新增 docs 专用组件：`apps/docs/.vitepress/theme/components/ThemePlayground.vue`
- 在 VitePress sidebar 中将入口放在“主题与令牌”附近，命名为“主题实验室”。

## 页面结构

Theme Playground 采用控制台式布局。

左侧为 Token 控制面板：

- 基底主题：`classic`、`pastel`、`mono`
- 色彩 token：`primary`、`secondary`、`accent`、`destructive`、`success`、`info`
- 形状 token：`border-width`、`radius`
- 阴影 token：`shadow-offset-x`、`shadow-offset-y`
- 模式切换：`light`、`dark`
- 操作：重置当前基底主题、复制 CSS

右侧为实时预览区：

- 基础组件：Button、Input、Card、Badge、Alert
- 反馈样式：Toast 或 Dialog 的静态样式预览
- 真实区块小样：一个 mini dashboard 或 card section，用来展示主题在产品 UI 中的整体效果

底部或右侧为 CSS 输出区：

- 生成 `.theme-custom { ... }`
- 暗色模式下生成 `.theme-custom.dark` 或 `.dark .theme-custom`
- 提供一键复制

## 状态模型

`ThemePlayground.vue` 内部维护以下状态：

- `baseTheme`: `'classic' | 'pastel' | 'mono'`
- `colorMode`: `'light' | 'dark'`
- `tokens`: 当前可编辑的 CSS token 值
- `copyState`: `'idle' | 'success' | 'error'`

派生状态：

- `previewStyle`: 从 `tokens` 生成的 CSS 变量对象，用于绑定到预览容器。
- `generatedCss`: 从 `tokens` 和 `colorMode` 生成的 CSS 字符串。
- `validationErrors`: 记录无效 hex 或无效数值输入。

## 数据流

1. 用户选择基底主题。
2. 组件从本地 `themePresets` 读取对应 token 默认值。
3. 用户调节颜色、边框宽度、圆角或阴影偏移。
4. `previewStyle` 通过 `computed()` 生成 CSS 变量对象。
5. 预览容器绑定 `previewStyle`，并使用现有 BrutxUI class，例如 `bg-brutal-bg`、`border-3`、`shadow-brutal`。
6. 这些 class 已经依赖 `--brutal-*`，因此预览会随 token 变化实时更新。
7. CSS 输出区使用同一份 `tokens` 生成可复制的 `.theme-custom` CSS。

预览容器只做局部变量覆盖，不修改 `document.documentElement`，避免污染 docs 全站主题。

## 交互设计

- 主题基底使用 segmented control。
- light/dark 使用 toggle。
- 颜色使用 `input[type="color"]` 和文本输入同步，支持精确 hex。
- `border-width`、`radius`、`shadow-offset-x`、`shadow-offset-y` 使用 slider 和数字输入组合。
- “重置”恢复当前 `baseTheme` 的默认 token。
- “复制 CSS”复制 `generatedCss`。
- 复制成功后短暂显示成功状态，失败时显示手动复制提示。
- 预览区保持实时更新，不需要用户点击应用按钮。

## 错误处理

- 无效 hex 不覆盖当前有效 token。
- 数值输入限制在合理范围内，例如边框宽度、圆角和阴影偏移不能为负数。
- Clipboard API 不可用或复制失败时，选中 CSS 输出区域并提示用户手动复制。
- 预览不依赖 localStorage，刷新后回到 `classic` + `light` 默认状态。

## 文件边界

第一版只涉及 docs：

- `apps/docs/guide/theme-playground.md`
- `apps/docs/.vitepress/theme/components/ThemePlayground.vue`
- `apps/docs/.vitepress/config.ts`

不修改：

- `packages/ui/src/composables/useTheme.ts`
- `packages/ui/src/styles.css`
- `packages/ui/src/index.ts`
- `packages/registry/registry/*`

## 测试策略

为 `ThemePlayground.vue` 增加 focused 单测，覆盖：

- 切换基底主题会刷新 token。
- 修改 token 会更新预览容器 style。
- `generatedCss` 包含预期的 `--brutal-*` 变量。
- reset 会恢复当前基底主题默认值。
- copy 成功和失败状态可观测。

集成验证：

- 运行 `pnpm --filter docs build`，确认 VitePress 页面可构建。

后续增强可以加入视觉回归，覆盖 `classic`、`pastel`、`mono` 和自定义主题的截图。

## 验收标准

- 用户可以在文档站打开“主题实验室”页面。
- 用户可以切换 `classic`、`pastel`、`mono` 和 `light`、`dark`。
- 用户可以调节颜色、边框、圆角和阴影 token。
- 右侧预览区实时反映 token 变化。
- 用户可以复制 `.theme-custom` CSS。
- 复制出的 CSS 粘贴到使用 BrutxUI 的项目后能覆盖对应主题变量。
- Theme Playground 不影响文档站全局主题。
- UI 包公共 API 没有变化。

## 后续路线

如果第一版验证有效，可以继续演进：

- 将稳定的数据模型抽象为 `ThemePreset`。
- 增加导入/导出 JSON。
- 增加主题随机生成和分享 URL。
- 将 docs 工具中稳定的编辑器模块沉淀为可安装的 `ThemeCustomizer` registry 组件。
- 为 `brutx-vue` CLI 增加主题 preset 生成命令。
