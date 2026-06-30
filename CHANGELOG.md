# 更新日志

本项目所有重要变更均记录于此。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本控制](https://semver.org/lang/zh-CN/)。

## [Unreleased](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.8.2...HEAD)

## [0.8.2](https://github.com/lidaixingchen/brutxui-vue3/compare/v0.8.1...v0.8.2) - 2026-06-30

### ✨ Features

* **i18n:** 实施多语言支持 - 英文 locale 配置与主题组件国际化 ([0639f0e](https://github.com/lidaixingchen/brutxui-vue3/commit/0639f0ee4d4d7e77be19b73050e3d6efa7b655a0), [d6fd00a](https://github.com/lidaixingchen/brutxui-vue3/commit/d6fd00a850333e03b99c32f62bbc78e2d836255a))
  * 添加 VitePress 英文 locale 配置（nav、sidebar、search、footer）
  * 创建 i18n composable (useI18n) 支持 22 个翻译键
  * 国际化 InstallationTabs、HomeCodePreview、Layout 等主题组件
  * 完成全部 113 个英文文档翻译（12 guide + 67 组件 + 31 区块 + 3 索引页）

### 🐛 Bug Fixes

* **ui:** 修复代码审查发现的 8 个 bug ([9fc3a0a](https://github.com/lidaixingchen/brutxui-vue3/commit/9fc3a0ab9ecb6a9c1e8c3c7d99ea58abea1dfef3))
  * parseFormattedDate: 修复无分隔符格式 YYYYMMDD 解析时跳过字符
  * useToast: 修复 fallback 单例 onScopeDispose 绑定到错误作用域
  * useCarousel: 修复初始挂载时未应用 reduced-motion 偏好
  * GlitchText: 添加 trigger 属性监听器，防止定时器泄漏
  * DataTable: 移除 deep watch，避免不必要的状态重置
* **ui:** 修复类型安全与兼容性问题 ([2ed7cfe](https://github.com/lidaixingchen/brutxui-vue3/commit/2ed7cfe98dd68d5688f59615375a2fda31481787), [fa496bd](https://github.com/lidaixingchen/brutxui-vue3/commit/fa496bd5b39504edb6569f1224fcd5e89cb7e09b), [2d340e3](https://github.com/lidaixingchen/brutxui-vue3/commit/2d340e3457c381eb7506a282f4da92ef73b40c5e))
  * ESLint no-explicit-any 从 warn 提升为 error，消除 any 类型
  * 魔法数字提取为 defaults.ts 命名常量
  * 定时器声明风格统一为 shallowRef
  * 修复 VirtualScroll useVirtualizer 参数非响应式
  * 为多个组件添加 SSR 安全守卫
  * 为 DatePicker 系列添加 v-model:open 受控模式
* **ci:** 修复 vue-tsc 类型检查失败及 VitePress 死链 ([cb52c57](https://github.com/lidaixingchen/brutxui-vue3/commit/cb52c5777e342f4824390e3a32748937188bc328))
* **cli:** 兼容源码与构建产物的 styles 路径解析 ([1fdb15b](https://github.com/lidaixingchen/brutxui-vue3/commit/1fdb15b364b9a6c212b5ab29f223b3ba763c7d44))
* **docs:** 修复文档格式与国际化问题 ([479fb71](https://github.com/lidaixingchen/brutxui-vue3/commit/479fb71a2514f4589ff447a2c3dc50a66dec5eeb), [4d9c233](https://github.com/lidaixingchen/brutxui-vue3/commit/4d9c233f7afed417639b1086c0879c2cafca9748), [b45beb6](https://github.com/lidaixingchen/brutxui-vue3/commit/b45beb67c2c762b8c8a90170933a940d5b1022b2))
  * 修复 blocks 安装方式、Props 表格、可访问性章节缺失
  * 修复未汉化的表格列名（Slots→插槽、载荷→参数）
  * 修复 locales 配置位置

### 📝 Documentation

* **docs:** 全面翻新组件与区块文档 ([397f288](https://github.com/lidaixingchen/brutxui-vue3/commit/397f2888612dca71dc30ec2316090d53198cb465), [524bd88](https://github.com/lidaixingchen/brutxui-vue3/commit/524bd88491bb25cf66d72181754208521b4d84f5), [3a189bf](https://github.com/lidaixingchen/brutxui-vue3/commit/3a189bf01a5cf814d044f67c49fdbfecca785bf4))
  * 按模板统一翻新 101 个文档（68 组件 + 33 区块）
  * 统一章节顺序、名称中文化、表格格式标准化
  * 对照源码更新 64 个组件 API 描述，补充缺失的 Props/Events/Slots
* **docs:** 为 12 个复杂组件添加常见问题章节 ([90fc5af](https://github.com/lidaixingchen/brutxui-vue3/commit/90fc5af1db5d52baf5fd8aed2d89ab75c05ff4f3))
  添加：data-table, kanban-board, form, dialog, combobox, virtual-scroll, carousel, date-picker, color-picker, tags-input, tree-view, tree-select
* **docs:** 文档网站中文化改造及 VitePress 升级 ([14ddf22](https://github.com/lidaixingchen/brutxui-vue3/commit/14ddf225c863ca9887012ecebcbd3dffca84e8ca), [469f18b](https://github.com/lidaixingchen/brutxui-vue3/commit/469f18b93f38e979f687af1eafe002cdc3080625))
  * 消除文档网站中所有非必要的英文残留
  * 404 页面使用自定义 NotFoundPage 组件
  * VitePress 从 1.6.0 升级至 1.6.4
  * 新增 FAQ、CHANGELOG、贡献指南、最佳实践指南页面
* **docs:** 删除无用文档章节 ([c689651](https://github.com/lidaixingchen/brutxui-vue3/commit/c689651533a974156840fde958f2b475ea875cd4))
  * 删除 10 个组件无用的样式定制章节
  * 删除 kbd.md 常见问题、code-block.md 国际化、date-picker.md 样式定制、data-table.md 常见问题等冗余章节

### ♻️ Code Refactoring

* **ui:** 清理技术债 - 类型安全与依赖管理 ([bc490e6](https://github.com/lidaixingchen/brutxui-vue3/commit/bc490e6efb5a1f1ded27a51acf5eb38877109804), [d1fbb4b](https://github.com/lidaixingchen/brutxui-vue3/commit/d1fbb4b5e1c7d87401a4dc51423a53db1c29ed7c))
  * 统一 SSR 守卫为 lib/env.ts 工具函数
  * 移除过时的兼容性代码（structuredClone、webkitAudioContext、ResizeObserver）
  * 消除重复常量定义，提取共享常量到 defaults.ts
  * embla-carousel-vue 移至 peerDependencies
  * 移除未使用的 postcss、tailwindcss-animate、rimraf、jsdom
  * 添加 .browserslistrc 明确浏览器兼容目标
* **cli:** 清理兼容性债务，优化项目配置 ([ffe49eb](https://github.com/lidaixingchen/brutxui-vue3/commit/ffe49ebe30bfd4d7a6ca54d3999ae1694825bb85))
  * 统一错误处理：定义 CliError 类，移除所有 process.exit()
  * 替换 JSONC 解析器：使用 jsonc-parser 库
  * 重构 Logger：支持依赖注入

### 📦 Build

* **registry:** 重建全部组件注册表索引，同步源码变更
* **ui,docs:** 技术栈优化与子路径导出扩展 ([4fab9bf](https://github.com/lidaixingchen/brutxui-vue3/commit/4fab9bf9e1bf5c68f1d489c3049d842cde3d832a))
  * brutalism-plugin.js 从 CJS 转为 ESM 格式
  * Calendar/DatePicker 等 5 个组件改为 defineAsyncComponent 动态 import
  * 用 @tailwindcss/vite 替代 @tailwindcss/postcss
  * reka-ui、@tanstack/vue-virtual 移至可选 peerDependencies
  * 新增 10 个高频组件子路径导出（button, input, dialog, toast, form, select, dropdown-menu, table, card, tabs）
* **cli:** 修复 styles 路径解析兼容性问题 ([1fdb15b](https://github.com/lidaixingchen/brutxui-vue3/commit/1fdb15b364b9a6c212b5ab29f223b3ba763c7d44))

## [0.8.1] - 2026-06-30

### ♻️ Code Refactoring

* **ui:** 执行兼容性审查补充方案修复（5 大类约 30 处） ([af394d9](https://github.com/lidaixingchen/brutxui-vue3/commit/af394d921a68a6a1f0703d6ad77334577ac2f8b9))
  基于兼容性审查补充报告，对 96 个组件目录进行全量扫描修复，共涉及 182 个文件。
  * **defaultValue/defaultXxx 双模式修复（8 处）**：Slider/Tabs/TabsNav/ToggleGroup 删除冗余 default* prop，TreeView/BeforeAfter/PricingSection/SettingsPage 补齐 modelValue 受控 API
  * **命名不一致修复（6 处）**：HardcoreInput/FormWizard/ErrorCard/Pagination emit 统一为 kebab-case，CommandGroup/Alert slot 命名统一
  * **死代码清理（10 处）**：移除 DatePicker 系列未使用 prop、tree-view/virtual-scroll/date.ts 未使用导出
  * **类型与 TS 副作用修复（8 处）**：FormControl/FormLabel/FormMessage 移除冗余断言，DataTable 统一类型声明
  * **CVA 空变体值清理（3 处）**：chat-bubble/color-picker/tabs 变体文件清理空值键
* **date-picker:** 调整年月选择器网格布局为4列 ([05d7575](https://github.com/lidaixingchen/brutxui-vue3/commit/05d75756443187006cf5d118285634400a5ee9b0))
  同时新增 TooltipProvider 组件并完善相关文档与测试：
  1. 封装 reka-ui 的 TooltipProvider 为本地组件
  2. 更新导出逻辑替换内置 Provider 为本地组件
  3. 修正文档中延迟默认值与示例代码
  4. 添加 TooltipProvider 单元测试
* **ui:** 清除全组件兼容性包袱（12 类约 96 处） ([087164a](https://github.com/lidaixingchen/brutxui-vue3/commit/087164a3a8205c37db4c9a7c72bd5cad03f791fb))
  基于兼容性审查报告执行全量清理，遵循「不保留向后兼容」原则。
  * **defaultValue 双模式（4 处）**：移除 Input/Textarea/Select/Combobox 的 dual-mode 兼容写法
  * **命名不一致 props（3 处）**：Input/Textarea 的 inputSize/textareaSize → size，Combobox 的 multiSelect → multiple
  * **emit 命名不一致（8 个）**：将 camelCase emit 统一为 kebab-case
  * **空变体值（11 处 / 25+ 条目）**：清除 CVA variants 中 `false: ''`/`undefined: ''` 等空字符串条目
  * **未使用 props/exports/死代码（7 处）**：移除未引用的 props、未使用的 export
  * **冗余类型断言（20+ 处）**：将 `as` 断言替换为 instanceof 类型守卫或合理类型收窄
  * **硬编码魔法值（13 处）**：提取为命名常量（邮箱正则、颜色映射、尺寸阈值等）
  * **eslint-disable 注释（12 处）**：全部移除，通过重构代码本身解决 lint 警告
  * **跨组件重复代码（6 组）**：新建 lib/modal-variants.ts、lib/validation.ts 等共享模块
  * **默认值不一致（6 处）**：Stepper/Marquee/Carousel 默认值统一为 'default'
  * **国际化修复（3 处）**：ColorModeSwitcher/WaitlistPage/PricingSection 硬编码文本改用 useLocale()
  * **其他零散问题（12 处）**：移除 cn('') 空字符串、console.warn、CVA computed 包装等
* **ui:** 执行组件深化拓展方案 8 批全量改动 ([1a0cd7d](https://github.com/lidaixingchen/brutxui-vue3/commit/1a0cd7d8ac9cfba89eade1f643cef451e9175d45))
  * **无障碍合规与动效降级**：Switch/Checkbox/Toggle/RadioGroup/TagsInput/Table 新增 ariaLabel prop，Marquee/Carousel/NoiseBackground/BeforeAfter 引入 useReducedMotion
  * **变体实现与 API 一致性**：Accordion content 变体填充视觉差异，Input/Textarea 的 inputSize/textareaSize 重命名为 size，新增 readonly prop
  * **组件功能增强**：Badge 新增 closable/dot/pulse/icon 插槽，Alert 新增 closable 与 action 插槽，Dialog 新增 size 变体，Tabs 新增 orientation 垂直布局，Toast 新增 pauseOnHover
  * **程序化控制暴露**：Carousel/DataTable/DatePicker/ColorPicker/Command 通过 defineExpose 暴露方法与状态
  * **Composable 抽取**：新增 useCarousel/useDatePicker/useColorPicker，重构对应组件使用 composable
  * **系统性基建**：新增 useAnimation 统一动效降级策略，新增 useFormFieldValidation 通用表单验证，useTheme 扩展运行时主题定制

### 📝 Documentation

* 更新全组件文档 ([165e85e](https://github.com/lidaixingchen/brutxui-vue3/commit/165e85eee2ce3ca6d9f3339450fc0aae1e0b1164))
  本次提交更新了多个组件的参考文档，补充完整 props、事件、插槽说明：
  1. 为 SearchWidget 新增 loading、最近搜索支持
  2. 完善 FeedbackForm 的加载、成功状态支持
  3. 为 Brutal 组件新增变体、可点击与点击事件
  4. 更新 CopyToClipboard、KanbanBoard 的新增参数
  5. 补充 Layout 组件系列的变体、尺寸、选择模式等属性
  6. 完善 Form 组件系列的 Label、Combobox、Slider 等组件文档

### 🐛 Bug Fixes

* **ui:** 修复 5 个组件的 CI 测试失败问题 ([93e0c6b](https://github.com/lidaixingchen/brutxui-vue3/commit/93e0c6bfa50d8f76c916412718febfcd497b2f55))
  修复 ChatBubble、Marquee、Stepper、VirtualScroll、KanbanBoard 共 8 个测试用例失败。
  * **ChatBubble**：system 消息 text-xs 被 size 覆盖，在 cn() 调用末尾追加 text-xs 提升优先级
  * **Marquee**：测试断言与 variant 定义不匹配，更新 accent variant 颜色为 text-brutal-accent-foreground
  * **Stepper**：默认 variant 从 "default" 改为 "primary" 以匹配设计意图
  * **VirtualScroll**：scrollToIndex 参数被钳制导致测试失败，扩展 mockItems 到 100 个
  * **KanbanBoard**：column-move 事件发射 adjustedIndex 而非 toIndex，修复为反映用户拖放意图
* **ui,docs:** 修复多个组件 demo 溢出及 BeforeAfter 容器比例问题 ([6f49c2b](https://github.com/lidaixingchen/brutxui-vue3/commit/6f49c2b122023838e6e5fd4d6990ee657144978c))
  * **Tabs**：垂直布局时 TabsList 的 size 变体无条件应用固定高度导致溢出，使用 compoundVariants 使高度仅在水平布局下生效
  * **Pagination / KanbanBoard**：demo 内容超出文档预览区域，在根容器添加 max-w-full 限制宽度
  * **BeforeAfter**：垂直方向使用固定 aspect-[9/16] 容器过长，改为根据图片实际尺寸动态计算 aspect-ratio，移除 beforeAfterRootVariants
* **ui:** 修复多个组件的具体问题 ([7b75730](https://github.com/lidaixingchen/brutxui-vue3/commit/7b75730e3181ad30f503da24dfe8d2bde7dd083b))
  * **Slider**：修复 marks 在 0% 和 100% 位置被 overflow-hidden 裁剪的问题，tooltip 通过 aria-describedby 与 thumb 关联
  * **KanbanBoard**：修复列拖拽 splice 索引偏移 bug，isDragging 重置改用 requestAnimationFrame
  * **ChatBubble**：修复 color="primary" 在 sent 气泡上是死选项的问题，添加 shadow-brutal-primary 视觉区分
  * **BeforeAfter**：垂直模式添加 orient="vertical" 属性修复 Firefox 兼容性，添加 orientation 变体
  * **Card3D**：修复 shadow 变体全为空字符串的问题，使用 CSS 变量 --card3d-offset 驱动阴影偏移
  * **Label**：required 指示器 * 添加 ml-0.5 间距
  * **Stepper**：区分 variant.default（中性色）与 variant.primary（主色调）
  * **Separator**：提取 DEFAULT_THICKNESS 常量替代三处硬编码 3px，修复文字分隔线模式下 props.class 应用位置，修复 hasLabel 响应性
  * **ScrollArea**：移除未使用的 scrollAreaViewportVariants 死代码
  * **Marquee**：variant.accent 颜色从 text-brutal-fg 改为 text-brutal-accent-foreground
  * **TreeView**：ariaChecked 返回字符串 "true"/"false"/"mixed" 替代布尔值，getCheckState 逻辑提取到共享函数，Enter 键在 checkbox 模式下触发 check，添加 Home/End 键支持
  * **VirtualScroll**：scrollToIndex 添加输入边界校验
  * **Avatar**：statusLabel computed 改用局部变量确保 TypeScript 类型精确收窄
  * **测试**：修复 feedback-form.test 中 data-slot="success-card" 无实际验证作用的断言
  * **注册表**：同步 card-3d.json、label.json、scroll-area.json 与源代码变更

## [0.8.0] - 2026-06-29

### Added

* **图标尺寸 CVA 系统**：新增 `iconSizeVariants` 共享配置（xs/h-2.5 → 2xl/h-8），统一全组件库图标尺寸，为 DataTable/Card/Form 等组件新增 `iconSize` 属性
* **Stepper 增强**：新增 `size`、`variant`、`clickable` 属性，支持方向键/Home/End 键盘导航
* **Marquee 增强**：新增 `variant`、`size` 属性
* **BeforeAfter 方向**：新增 `orientation` 属性（horizontal/vertical），支持纵向对比模式
* **Card3D 增强**：新增 `variant`、`clickable` 属性，支持点击交互
* **CodeBlock 行裁剪**：新增 `maxLines` 属性，超出内容可展开/收起
* **Timeline 交替布局**：新增 `timelineAlternateKey` 交替排列模式
* **ChatBubble 样式**：新增 `color`（default/primary/accent）和 `size`（sm/default/lg）变体
* **TreeView 多选**：新增 checkbox 选择模式，支持级联选择/半选状态/Space 键
* **KanbanBoard 列操作**：新增列拖拽排序（`column-move` 事件）和默认 `add-card` 按钮
* **VirtualScroll 滚动**：新增 `scrollToIndex` 暴露方法
* **FeedbackForm 状态**：新增 `loading`、`success` 状态及对应文案
* **SearchWidget 增强**：新增 `loading` 状态和 `recent` 搜索分组
* **Combobox 增强**：新增 `loading` 状态和 `creative` 创建模式（`create` 事件）
* **Avatar 增强**：新增注入键与状态标识，重构变体样式
* **Label/Kbd/Counter 增强**：新增 `variant` 和 `size` 属性支持
* **Separator 文本**：新增文本分隔器样式与布局支持
* **空状态支持**：为 Tabs、DashboardStats 等区块组件新增空状态提示
* **变体文件**：新增 `alert-dialog-variants.ts`、`scroll-area-variants.ts`、`combobox-variants.ts`、`form-wizard-variants.ts` 四个 CVA 变体文件

### Changed

* **视觉规范统一**：8 个变体文件补全 `rounded-brutal` 类，7 个变体文件统一悬停效果为 `hover:shadow-brutal-lg`，2 个变体文件补充 `active` 按压反馈
* **模板 cn() 重构**：DataTable、DatePicker 系列、Button 等 8 个组件将模板内 `cn()` 调用提取为 computed/函数
* **ScrollBar/ToggleGroup**：重构组件逻辑，优化样式与交互
* **NumberInput**：修复属性透传，新增属性过滤
* **Separator**：装饰性分隔符使用 `role="none"`（ARIA 1.2 标准）
* **Card3D**：`role="presentation"` 改为 `role="group"` 更准确的角色语义
* **DataTable**：定义稳定 `CellRenderer` 替代箭头函数避免组件重建，`export` 事件参数改为可选

### Fixed

* **CLI 安全**：`isSafePath` 添加符号链接解析，防止路径遍历绕过
* **CLI 安全**：`resolveAliasPath` 内置 `isSafePath` 路径遍历防护，自动保护所有调用方
* **CLI 安全**：`readConfig` 添加运行时类型验证，防止恶意 `components.json` 注入
* **CLI 安全**：`resolveComponentFilePath` 添加 `isSafePath` 自保护验证
* **CLI 安全**：`isSafePath` 添加磁盘根目录边界检查
* **注册表**：补充 `form-wizard-types.ts`、`panel-styles.css`、`types.ts`、`alert-dialog-variants.ts`、`scroll-area-variants.ts`、`form-wizard-variants.ts` 文件声明
* **注册表**：为 16 个组件补充 `useLocale` composable 声明
* **注册表**：重新构建全部 98 个组件 JSON
* **注册表**：修复 `build-registry.ts` 变量名遮蔽，移除 `FILE_TO_COMPONENT` 死代码
* **可访问性**：UploadCard 拖放区域添加键盘支持（role="button"、tabindex、Enter/Space 键）
* **可访问性**：TreeSelectNode 实现 roving tabindex 规范，搜索过滤后自动重置焦点节点
* **可访问性**：DataTable 可排序列头添加键盘支持（tabindex、Enter 键）
* **可访问性**：TypewriterText 移除 `aria-live="polite"` 避免逐字播报
* **可访问性**：FeedbackForm label 与 input 正确关联
* **可访问性**：Stepper 添加方向键/Home/End 键盘导航和 `aria-orientation` 属性
* **可访问性**：Card3D 改为 `role="presentation"` 避免装饰性地标
* **可访问性**：ToastContainer 改为 `aria-live="off"` 避免频繁播报
* **TypeScript**：`mergeLocale` 消除 4 处 `as unknown as` 双重断言
* **TypeScript**：`useDataTableSort` 移除 `unknown` 类型 `<` 比较
* **TypeScript**：提取 `getCellValue` 为共享工具函数 `@/lib/data-table-utils`
* **TypeScript**：`DataTableFilterState.columns` 收窄为 `Record<string, string>`
* **TypeScript**：`registryIndex` 使用 `RegistryIndex` 接口替代 `Record<string, any>`
* **TypeScript**：多处隐式 `any` 添加显式类型注解，catch 块 `any` → `unknown`
* **Vue 组件**：DataTable `filter` 事件现在正确触发，filter watcher 从 deep 改为监听特定属性
* **Vue 组件**：DataTable `export` 事件现在携带选中行数据
* **Vue 组件**：DataTable `props.data` watch 添加 `{ deep: true }`
* **Vue 组件**：Form `validationSchema` 改为 computed 保持响应式
* **Vue 组件**：Counter `autoStart=false` 时 `from` 变化正确更新 `current`，修复竞态条件
* **Vue 组件**：FeedbackForm 添加必填验证和邮箱格式验证
* **Vue 组件**：Calendar 缓存键添加 null 合并避免碰撞
* **Vue 组件**：`useAudioEngine` 统一使用 `win.AudioContext`
* **性能**：Counter 模板中 `formatNumber` 提取为 computed
* **性能**：Stepper 预计算 `stepStates` 数组
* **性能**：Calendar 添加 `dayClassesCache` 缓存
* **性能**：DataTable `handleSort` 使用 `nextTick` 确保 emit 最新值，`CellRenderer` 使用 `markRaw`
* **测试**：新增 color-mode-switcher 测试文件（5 个用例）
* **测试**：重写 tooltip 测试，从测试工具函数改为挂载组件
* **测试**：合并 checkbox/slider/switch 重复用例
* **测试**：补充 14 个组件的功能测试（tabs、dialog、dropdown-menu、select、form、accordion 等）
* **测试**：总计 2058 个测试通过

## [0.7.8] - 2026-06-28

### Added

* **DataTable 组合式函数**：新增 `useDataTableSort`、`useDataTableFilter`、`useDataTableSelection`、`useDataTablePagination` 四个组合式函数，实现完整的排序、筛选、选择、分页能力
* **GlitchButton 方向控制**：新增 `direction` 属性，支持横向/纵向/双向撕裂效果
* **GlitchText 方向控制**：新增 `direction` 属性，支持横向/纵向/双向撕裂效果
* 新增大量单元测试与视觉合规性测试用例

### Changed

* 重构颜色模式切换器、博客卡片、认证卡片等组件，统一使用内置 Button/Badge 组件替换原生元素
* 重构 SubmitButton 组件，复用 Button 组件并简化实现逻辑
* 统一 Toast、日期选择器等组件的按钮样式，替换原生按钮为内置组件
* 更新文档与指南示例，替换原生 select 为 Select 组件
* 更新全局组件注册与依赖配置，补全数据表格相关导出

## [0.7.7] - 2026-06-28

### Added

* 为多个组件文档添加预览区块
* 新增打字机、噪点背景、树形选择器组件文档与示例

### Changed

* 重构颜色模式切换器，替换 emoji 为 lucide 图标
* 优化数据表格组件实现，替换原生 checkbox 为组件
* 完善颜色选择器的格式处理与交互逻辑
* 调整 Select 组件支持自定义图标与样式类

### Fixed

* 修复 Checkbox、Spinner、DatePicker 等组件样式与逻辑问题
* 更新组件注册信息与测试用例

## [0.7.6] - 2026-06-28

### Added

* 新增表单上下文 `setError` 方法并完善表单校验逻辑
* 为 AuthCard 添加密码可见性切换、表单校验和测试用例
* 为 DialogEnhanced 添加宽高限制逻辑
* 为 TreeSelectNode 添加完整的键盘交互支持
* 为 TreeSelect 添加搜索框 aria-label
* 为 FormWizard 添加导航拦截事件
* 为 UploadCard 添加文件大小过滤
* 为 HardcoreInput 添加 error-change 事件
* 为 PricingSection 添加键盘导航和 watch 监听默认计费周期
* 为 WaitlistPage 添加邮箱格式校验提示
* 新增日期选择器样式抽离文件 `panel-styles.css`
* 新增 ScratchCard 重置逻辑、Stepper v-model 支持

### Changed

* 重构颜色选择器清空逻辑，移除多余的 modelValue 和 confirm 事件
* 重构 SettingsPage 插槽结构
* 重构 DataTable 单元格渲染逻辑并添加深度监听
* 优化 CommandInput 无障碍属性
* 优化 BlogListPage 分页重置逻辑
* 简化手绘图表计算逻辑，重构骨架屏类型定义
* 优化滑块组件空值判断、虚拟滚动空状态格式
* 优化头像首字母生成、文件卡片无障碍标签、输入框类型提示
* 优化 NoiseBackground 的 ID 生成和动画判断
* 移除 KanbanBoard 的双向绑定，改为只读 computed

### Fixed

* 修复 Toast 重复触发动画、ColorPicker 清空逻辑
* 修复多个日期选择器组件的变更事件触发逻辑
* 修复滑块组件空值判断
* 修复计数器时长变化时的进度计算、故障文本动画间隔限制
* 修复 GallerySection 空状态显示逻辑
* 修复 ActivityLogPage 的空状态和交互

## [0.7.5] - 2026-06-27

### Added

* **GlitchButton 组件**：故障效果按钮，支持多种触发模式（hover/click/autoplay/none）和动画速度控制（slow/medium/fast），继承 Button 的所有变体和尺寸
* **VirtualScroll 组件**：虚拟滚动组件，封装 @tanstack/vue-virtual，支持多种尺寸变体和列表项样式变体
* Input 组件添加 ARIA 无障碍属性（ariaLabel、ariaLabelledby、ariaDescribedby、ariaInvalid、ariaRequired）
* Textarea 组件添加 ARIA 无障碍属性（ariaLabel、ariaLabelledby、ariaDescribedby、ariaInvalid、ariaRequired）
* VirtualScroll 组件国际化支持

## [0.7.4] - 2026-06-27

### Added

* **TreeSelect 组件**：树形下拉选择器，支持单选/多选/搜索过滤/任意深度树结构，基于 reka-ui Popover + 递归节点组件
* **TypewriterText 组件**：打字机效果文本，支持循环播放/光标闪烁/尺寸粗细变体，兼容 prefers-reduced-motion
* **NoiseBackground 组件**：噪点纹理背景，基于 SVG feTurbulence 滤镜，支持动画效果和 SSR
* 注册表新增 `tree-select.json`、`typewriter-text.json`、`noise-background.json` 项
* 新增 TreeSelect、TypewriterText、NoiseBackground 组件文档与路由
* 国际化支持：新增 `treeSelect` 命名空间（中英文）
* CLI 支持安装新组件：`npx brutx-vue@latest add tree-select typewriter-text noise-background`

## [0.7.3] - 2026-06-27

### Changed

* 重构注册表实现，统一组件配置管理
* 新增 `component-files.ts` 集中声明组件文件映射
* 新增 `validate-registry.ts` 注册表一致性校验脚本
* 简化 `build-registry.ts` 构建逻辑

## [0.7.2] - 2026-06-26

### Added

* **ColorPicker 组件**：支持 HEX/RGB/HSL 色彩空间转换、预设色板与历史记录
* **DatePicker 组件**：支持日期/日期范围/日期时间/周/月/年多种选择模式
* 注册表新增 `color-picker.json` 与 `date-picker.json` 项
* 新增 ColorPicker 与 DatePicker 组件文档与路由

### Changed

* 重构 Calendar 组件样式隔离，使用 `brutx-calendar` 类 + `:global()` 选择器解决 v-calendar `inheritAttrs: false` 导致的 scoped CSS 失效
* 优化注册表校验脚本，新增 `lib/*` 目录路径匹配与依赖提取
* 简化主题初始化逻辑

### Fixed

* 修复 DatePickerPanel/DatePickerRangePanel/DateTimePickerPanel/WeekPickerPanel 日期居中样式
* 修复 DialogEnhanced 弹窗拖拽 document 事件监听器泄漏
* 修复 DataTable 过滤后 `currentPage` 未重置导致空表问题，并补充测试用例
* 修复 KanbanBoard 同列内卡片无法重排序，重构拖拽排序逻辑并补充测试用例
* 修复 ScratchCard 画布初始化判断逻辑（误用 `canvas.width/height` 而非 `style.width/height`）
* 修复 Form 组件路径导入问题与 FormWizard 错误提示排版

## [0.7.1] - 2026-06-26

### Fixed

* 添加 color-mode-switcher 和 data-table 组件到 registry

## [0.7.0] - 2026-06-26

### Added

* **暖色主题系统**：新增 Warm 主题配色方案
* **ColorModeSwitcher 组件**：支持亮色/暗色/系统模式切换
* **CSS 动画预设**：内置常用动画效果（淡入、滑入、缩放等）
* **DataTable 组件**：功能丰富的数据表格，支持排序、筛选、分页
* **主题实验室 (Theme Playground)**：交互式主题预览和调试工具
* **CLI doctor 命令**：检查项目配置和依赖问题
* **CLI diff 命令**：对比组件版本差异

### Changed

* 引入语义化前景色变量，优化 Mono 主题及暗色模式下的可读性
* 合并定价组件实现，统一代码结构
* 全面优化 ESLint 配置，消除项目警告

### Fixed

* 修复 40+ 组件的控制/非受控模式冲突
* 修复 Input 组件的 CJK 输入法组合事件处理
* 修复 CodeBlock 快速切换语言时的异步竞态问题
* 修复 ScratchCard 揭示后的画布交互阻塞
* 修复 CLI 安装包时的 Windows shell 兼容性
* 修复 Registry 安装流程问题

### Testing

* 添加视觉回归测试覆盖
* 添加 CLI 注册表安装修复回归测试
* 修复和优化多个组件的单元测试

## [0.6.3] - 2026-06-06

### Fixed

* 修复 40+ 个组件的综合问题：
  * 修复 Checkbox、Switch、Toggle 受控/非受控模式冲突
  * Input 新增 IME 组合事件处理，支持中日韩输入法
  * 修复 CodeBlock 快速切换语言时的异步竞态条件
  * 修复 ScratchCard 揭示后 Canvas 交互阻塞
  * 修复 useCanvasInteraction 窗口调整大小时进度重置
  * 修复 AuthCard 注册按钮缺失事件绑定
  * 移除 FeedbackForm 重复的标题/描述渲染
  * OverviewPage 用组件事件替代脆弱的 DOM 遍历
  * 修复 CopyToClipboard Ref 对象布尔检查（`isSupported.value`）
  * 修复 KanbanBoard 拖拽视觉闪烁
  * 无障碍改进：Combobox/Slider 添加 aria-label，Skeleton/SubmitButton 添加 aria-busy，TreeView 键盘导航
  * 暴露缺失属性：SelectTrigger 的 disabled，RadioGroup 的 name/disabled/orientation，Slider 的 ariaLabel
  * CookieConsent 新增 v-model 可见性控制和过渡动画
  * Calendar 样式转为 scoped 并使用 :deep() 穿透
  * Pagination 新增 currentPage 边界验证
  * 修复 ChatBubble 多单词姓名首字母计算
  * 修复 DataTableSection v-for 使用行索引作为 key
  * FooterSection 新增 href 支持（存在时渲染为 `<a>`）
  * TabsNav 新增 modelValue 属性支持受控模式
  * 修复 StepperSection 与内置组件的插槽冲突
  * CardTitle 新增 `as` 属性支持动态标签
  * 移除 stepper 死代码 `stepperItemVariants`
  * Marquee 重复插槽添加 inert 属性
  * BeforeAfter 范围输入添加 aria-label 并支持国际化
  * 修复 QuickActions v-for 使用 action label 作为 key
  * Carousel 添加 scrollSnaps 空数组防护
  * 移除 GlitchText 不必要的 onUpdated 生命周期钩子
  * useCanvasInteraction 添加指针捕获防止拖拽越界
  * 修复 SettingsPage TabsRoot v-model/default-value 冲突
  * 修复 DashboardStats 中性趋势图标和颜色
  * 修复 Form initialValues 响应性（使用 watch）
  * 移除 Form 双重类型断言
  * 移除 FormControl 冗余可选链
  * 修复 Slider 根据 modelValue 长度渲染多个滑块
  * 修复 HardcoreInput FormField 值同步和重复 dispose
  * Button asChild 禁用时添加 pointer-events-none
  * Button Loader2 图标大小根据 size 属性动态调整
  * Badge 根元素从 div 改为 span
  * Checkbox emit 类型添加 indeterminate 状态支持
  * 移除 Input placeholder 自动回退到国际化文本

## [0.5.7] - 2026-06-03

### 早期版本

详见 git 历史记录。
