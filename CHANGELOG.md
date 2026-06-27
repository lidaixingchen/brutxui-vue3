# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.7.4] - 2026-06-27

### Added

- **TreeSelect 组件**: 树形下拉选择器，支持单选/多选/搜索过滤/任意深度树结构
- **TypewriterText 组件**: 打字机效果文本，支持循环播放/光标闪烁/尺寸粗细变体
- **NoiseBackground 组件**: 噪点纹理背景，基于 SVG feTurbulence 滤镜，支持动画效果
- 注册表新增 `tree-select.json`、`typewriter-text.json`、`noise-background.json` 项
- 新增 TreeSelect、TypewriterText、NoiseBackground 组件文档与路由
- 国际化支持：新增 `treeSelect` 命名空间（中英文）

### Fixed

- 修复 TreeSelect 递归组件支持任意深度树结构（原实现仅支持两层）
- 修复 TreeSelect 嵌套 button 无效 HTML 结构
- 修复 TreeSelect 多选模式下空数组样式判断逻辑
- 修复 TypewriterText 减少动画模式下缺少 start 事件
- 修复 NoiseBackground 动画不响应属性动态变化
- 修复 NoiseBackground 直接 DOM 操作改为 Vue ref
- 修复 NoiseBackground SSR 兼容性问题
- 修复 TreeSelect ARIA 属性不完整问题

## [0.7.2] - 2026-06-26

### Added

- **ColorPicker 组件**: 支持 HEX/RGB/HSL 色彩空间转换、预设色板与历史记录
- **DatePicker 组件**: 支持日期/日期范围/日期时间/周/月/年多种选择模式
- 注册表新增 `color-picker.json` 与 `date-picker.json` 项
- 新增 ColorPicker 与 DatePicker 组件文档与路由

### Changed

- 重构 Calendar 组件样式隔离，使用 `brutx-calendar` 类 + `:global()` 选择器解决 v-calendar `inheritAttrs: false` 导致的 scoped CSS 失效
- 优化注册表校验脚本，新增 `lib/*` 目录路径匹配与依赖提取
- 简化主题初始化逻辑

### Fixed

- 修复 DatePickerPanel/DatePickerRangePanel/DateTimePickerPanel/WeekPickerPanel 日期居中样式
- 修复 DialogEnhanced 弹窗拖拽 document 事件监听器泄漏
- 修复 DataTable 过滤后 `currentPage` 未重置导致空表问题，并补充测试用例
- 修复 KanbanBoard 同列内卡片无法重排序，重构拖拽排序逻辑并补充测试用例
- 修复 ScratchCard 画布初始化判断逻辑（误用 `canvas.width/height` 而非 `style.width/height`）
- 修复 Form 组件路径导入问题与 FormWizard 错误提示排版

## [0.7.1] - 2026-06-26

### Fixed

- 添加 color-mode-switcher 和 data-table 组件到 registry

## [0.7.0] - 2026-06-26

### Added

- **暖色主题系统**: 新增 Warm 主题配色方案
- **ColorModeSwitcher 组件**: 支持亮色/暗色/系统模式切换
- **CSS 动画预设**: 内置常用动画效果（淡入、滑入、缩放等）
- **DataTable 组件**: 功能丰富的数据表格，支持排序、筛选、分页
- **主题实验室 (Theme Playground)**: 交互式主题预览和调试工具
- **CLI doctor 命令**: 检查项目配置和依赖问题
- **CLI diff 命令**: 对比组件版本差异

### Changed

- 引入语义化前景色变量，优化 Mono 主题及暗色模式下的可读性
- 合并定价组件实现，统一代码结构
- 全面优化 ESLint 配置，消除项目警告

### Fixed

- 修复 40+ 组件的控制/非受控模式冲突
- 修复 Input 组件的 CJK 输入法组合事件处理
- 修复 CodeBlock 快速切换语言时的异步竞态问题
- 修复 ScratchCard 揭示后的画布交互阻塞
- 修复 CLI 安装包时的 Windows shell 兼容性
- 修复 Registry 安装流程问题

### Testing

- 添加视觉回归测试覆盖
- 添加 CLI 注册表安装修复回归测试
- 修复和优化多个组件的单元测试

## [0.6.3] - 2026-06-06 (Previous Release)

### Fixed

- Comprehensive bug fixes across 40+ components:
  - Fixed controlled/uncontrolled mode conflicts in Checkbox, Switch, Toggle
  - Added IME composition event handling in Input for CJK input methods
  - Fixed async race condition in CodeBlock when rapidly switching languages
  - Fixed canvas interaction blocking after reveal in ScratchCard
  - Fixed canvas progress reset on resize in useCanvasInteraction composable
  - Added missing event binding for AuthCard register button
  - Removed duplicate title/description rendering in FeedbackForm
  - Replaced fragile DOM traversal with component event in OverviewPage
  - Fixed Ref object boolean check in CopyToClipboard (`isSupported.value`)
  - Fixed drag-and-drop visual flickering in KanbanBoard
  - Added accessibility improvements: aria-label for Combobox/Slider, aria-busy for Skeleton/SubmitButton, keyboard navigation for TreeView
  - Exposed missing props: disabled for SelectTrigger, name/disabled/orientation for RadioGroup, ariaLabel for Slider
  - Added v-model visibility control and transition animation to CookieConsent
  - Converted Calendar styles to scoped with :deep() penetration
  - Added Pagination currentPage boundary validation
  - Fixed ChatBubble initials calculation for multi-word names
  - Fixed DataTableSection v-for key using row index
  - Added FooterSection href support (renders as <a> when href exists)
  - Added TabsNav modelValue prop for controlled mode
  - Fixed StepperSection slot conflict with built-in components
  - Added CardTitle dynamic tag support via `as` prop
  - Removed dead code `stepperItemVariants` from stepper
  - Added Marquee inert attribute to duplicate slot
  - Added BeforeAfter range input aria-label with i18n support
  - Fixed QuickActions v-for key using action label
  - Added Carousel scrollSnaps empty array guard
  - Removed GlitchText unnecessary onUpdated lifecycle hook
  - Added pointer capture to useCanvasInteraction for drag-out-of-bounds
  - Fixed SettingsPage TabsRoot v-model/default-value conflict
  - Fixed DashboardStats neutral trend icon and color
  - Fixed Form initialValues reactivity with watch
  - Removed Form double type assertion
  - Removed FormControl redundant optional chaining
  - Fixed Slider to render multiple thumbs matching modelValue length
  - Fixed HardcoreInput FormField value sync and duplicate dispose
  - Added Button asChild disabled pointer-events-none
  - Added dynamic Loader2 icon size based on Button size prop
  - Changed Badge root element from div to span
  - Added Checkbox indeterminate state support in emit type
  - Removed Input placeholder auto-fallback to i18n text

## [0.5.7] - 2026-06-03

### Previous release

See git history for changes prior to this version.
