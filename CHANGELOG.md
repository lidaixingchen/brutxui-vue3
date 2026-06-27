# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **DataTable 组合式函数**: 新增 `useDataTableSort`、`useDataTableFilter`、`useDataTableSelection`、`useDataTablePagination` 四个组合式函数，实现完整的排序、筛选、选择、分页能力
- **GlitchButton 方向控制**: 新增 `direction` 属性，支持横向/纵向/双向撕裂效果
- **GlitchText 方向控制**: 新增 `direction` 属性，支持横向/纵向/双向撕裂效果
- 新增大量单元测试与视觉合规性测试用例

### Changed

- 重构颜色模式切换器、博客卡片、认证卡片等组件，统一使用内置 Button/Badge 组件替换原生元素
- 重构 SubmitButton 组件，复用 Button 组件并简化实现逻辑
- 统一 Toast、日期选择器等组件的按钮样式，替换原生按钮为内置组件
- 更新文档与指南示例，替换原生 select 为 Select 组件
- 更新全局组件注册与依赖配置，补全数据表格相关导出

## [0.7.7] - 2026-06-28

### Added

- 为多个组件文档添加预览区块
- 新增打字机、噪点背景、树形选择器组件文档与示例

### Changed

- 重构颜色模式切换器，替换 emoji 为 lucide 图标
- 优化数据表格组件实现，替换原生 checkbox 为组件
- 完善颜色选择器的格式处理与交互逻辑
- 调整 Select 组件支持自定义图标与样式类

### Fixed

- 修复 Checkbox、Spinner、DatePicker 等组件样式与逻辑问题
- 更新组件注册信息与测试用例

## [0.7.6] - 2026-06-28

### Added

- 新增表单上下文 `setError` 方法并完善表单校验逻辑
- 为 AuthCard 添加密码可见性切换、表单校验和测试用例
- 为 DialogEnhanced 添加宽高限制逻辑
- 为 TreeSelectNode 添加完整的键盘交互支持
- 为 TreeSelect 添加搜索框 aria-label
- 为 FormWizard 添加导航拦截事件
- 为 UploadCard 添加文件大小过滤
- 为 HardcoreInput 添加 error-change 事件
- 为 PricingSection 添加键盘导航和 watch 监听默认计费周期
- 为 WaitlistPage 添加邮箱格式校验提示
- 新增日期选择器样式抽离文件 `panel-styles.css`
- 新增 ScratchCard 重置逻辑、Stepper v-model 支持

### Changed

- 重构颜色选择器清空逻辑，移除多余的 modelValue 和 confirm 事件
- 重构 SettingsPage 插槽结构
- 重构 DataTable 单元格渲染逻辑并添加深度监听
- 优化 CommandInput 无障碍属性
- 优化 BlogListPage 分页重置逻辑
- 简化手绘图表计算逻辑，重构骨架屏类型定义
- 优化滑块组件空值判断、虚拟滚动空状态格式
- 优化头像首字母生成、文件卡片无障碍标签、输入框类型提示
- 优化 NoiseBackground 的 ID 生成和动画判断
- 移除 KanbanBoard 的双向绑定，改为只读 computed

### Fixed

- 修复 Toast 重复触发动画、ColorPicker 清空逻辑
- 修复多个日期选择器组件的变更事件触发逻辑
- 修复滑块组件空值判断
- 修复计数器时长变化时的进度计算、故障文本动画间隔限制
- 修复 GallerySection 空状态显示逻辑
- 修复 ActivityLogPage 的空状态和交互

## [0.7.5] - 2026-06-27

### Added

- **GlitchButton 组件**: 故障效果按钮，支持多种触发模式（hover/click/autoplay/none）和动画速度控制（slow/medium/fast），继承 Button 的所有变体和尺寸
- **VirtualScroll 组件**: 虚拟滚动组件，封装 @tanstack/vue-virtual，支持多种尺寸变体和列表项样式变体
- Input 组件添加 ARIA 无障碍属性（ariaLabel、ariaLabelledby、ariaDescribedby、ariaInvalid、ariaRequired）
- Textarea 组件添加 ARIA 无障碍属性（ariaLabel、ariaLabelledby、ariaDescribedby、ariaInvalid、ariaRequired）
- VirtualScroll 组件国际化支持

## [0.7.4] - 2026-06-27

### Added

- **TreeSelect 组件**: 树形下拉选择器，支持单选/多选/搜索过滤/任意深度树结构，基于 reka-ui Popover + 递归节点组件
- **TypewriterText 组件**: 打字机效果文本，支持循环播放/光标闪烁/尺寸粗细变体，兼容 prefers-reduced-motion
- **NoiseBackground 组件**: 噪点纹理背景，基于 SVG feTurbulence 滤镜，支持动画效果和 SSR
- 注册表新增 `tree-select.json`、`typewriter-text.json`、`noise-background.json` 项
- 新增 TreeSelect、TypewriterText、NoiseBackground 组件文档与路由
- 国际化支持：新增 `treeSelect` 命名空间（中英文）
- CLI 支持安装新组件：`npx brutx-vue@latest add tree-select typewriter-text noise-background`

## [0.7.3] - 2026-06-27

### Changed

- 重构注册表实现，统一组件配置管理
- 新增 `component-files.ts` 集中声明组件文件映射
- 新增 `validate-registry.ts` 注册表一致性校验脚本
- 简化 `build-registry.ts` 构建逻辑

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

## [0.6.3] - 2026-06-06

### Fixed

- 修复 40+ 个组件的综合问题：
  - 修复 Checkbox、Switch、Toggle 受控/非受控模式冲突
  - Input 新增 IME 组合事件处理，支持中日韩输入法
  - 修复 CodeBlock 快速切换语言时的异步竞态条件
  - 修复 ScratchCard 揭示后 Canvas 交互阻塞
  - 修复 useCanvasInteraction 窗口调整大小时进度重置
  - 修复 AuthCard 注册按钮缺失事件绑定
  - 移除 FeedbackForm 重复的标题/描述渲染
  - OverviewPage 用组件事件替代脆弱的 DOM 遍历
  - 修复 CopyToClipboard Ref 对象布尔检查（`isSupported.value`）
  - 修复 KanbanBoard 拖拽视觉闪烁
  - 无障碍改进：Combobox/Slider 添加 aria-label，Skeleton/SubmitButton 添加 aria-busy，TreeView 键盘导航
  - 暴露缺失属性：SelectTrigger 的 disabled，RadioGroup 的 name/disabled/orientation，Slider 的 ariaLabel
  - CookieConsent 新增 v-model 可见性控制和过渡动画
  - Calendar 样式转为 scoped 并使用 :deep() 穿透
  - Pagination 新增 currentPage 边界验证
  - 修复 ChatBubble 多单词姓名首字母计算
  - 修复 DataTableSection v-for 使用行索引作为 key
  - FooterSection 新增 href 支持（存在时渲染为 `<a>`）
  - TabsNav 新增 modelValue 属性支持受控模式
  - 修复 StepperSection 与内置组件的插槽冲突
  - CardTitle 新增 `as` 属性支持动态标签
  - 移除 stepper 死代码 `stepperItemVariants`
  - Marquee 重复插槽添加 inert 属性
  - BeforeAfter 范围输入添加 aria-label 并支持国际化
  - 修复 QuickActions v-for 使用 action label 作为 key
  - Carousel 添加 scrollSnaps 空数组防护
  - 移除 GlitchText 不必要的 onUpdated 生命周期钩子
  - useCanvasInteraction 添加指针捕获防止拖拽越界
  - 修复 SettingsPage TabsRoot v-model/default-value 冲突
  - 修复 DashboardStats 中性趋势图标和颜色
  - 修复 Form initialValues 响应性（使用 watch）
  - 移除 Form 双重类型断言
  - 移除 FormControl 冗余可选链
  - 修复 Slider 根据 modelValue 长度渲染多个滑块
  - 修复 HardcoreInput FormField 值同步和重复 dispose
  - Button asChild 禁用时添加 pointer-events-none
  - Button Loader2 图标大小根据 size 属性动态调整
  - Badge 根元素从 div 改为 span
  - Checkbox emit 类型添加 indeterminate 状态支持
  - 移除 Input placeholder 自动回退到国际化文本

## [0.5.7] - 2026-06-03

### 早期版本

详见 git 历史记录。
