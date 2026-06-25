# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
