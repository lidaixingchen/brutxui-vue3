# BrutxUI 组件大词典 (Component Dictionary)

本文件收录了 BrutxUI 所有 Vue 3 组件的完整清单及功能概览。如果需要查找特定组件的用途，请在此查阅。

---

## 1. 表单与输入 (Form & Inputs)

| 组件 | 中文名 | 说明 |
| --- | --- | --- |
| `Button` | 按钮 | 9 种变体、5 种尺寸、加载状态、`type="submit"` 时支持 `pendingText` 等待文本 |
| `Input` | 输入框 | 支持变体/尺寸/ARIA 无障碍属性、readonly 只读、errorMessage 错误消息、clearable 清除按钮、showPassword 密码切换、showWordLimit 字数统计、prefixIcon/suffixIcon 前后缀图标、prepend/append 插槽、defineExpose 暴露 ref/focus/blur/select 方法 |
| `Textarea` | 文本域 | 多行文本输入，支持 ARIA 无障碍属性、readonly 只读、errorMessage 错误消息、defineExpose 暴露 ref/focus/blur/select 方法 |
| `NumberInput` | 数字输入框 | 带 +/- 按钮，支持 split/stacked 布局、variant 边框样式变体、errorMessage 错误消息 |
| `HardcoreInput` | 硬核输入框 | 8-bit 音效 + 表情反馈 + 物理震动 |
| `Checkbox` | 复选框 | 通过 v-model:checked 绑定、ariaLabel 无障碍标签、indeterminate 状态使用 Minus 图标 |
| `Switch` | 开关 | 通过 v-model:checked 绑定、ariaLabel 无障碍标签 |
| `RadioGroup` | 单选组 | 支持 v-model、ariaLabel 无障碍标签 |
| `Select` | 选择器 | 支持子组件组合，SelectTrigger 支持 variant 边框样式变体、errorMessage 错误消息、clearable 清除按钮 |
| `Combobox` | 搜索选择器 | 可搜索的单选/多选，支持加载状态与创建选项，defineExpose 暴露 open/searchQuery/selectedValue/focus |
| `TreeSelect` | 树形选择器 | 支持单选/多选/搜索/任意深度树结构，defineExpose 暴露 open/searchQuery/selectedNodes/expandedIds/focus |
| `Slider` | 滑块 | 支持 v-model，支持 variant/size/范围模式/方向/刻度/提示，通过 v-model 进行受控，defineExpose 暴露 currentVal/setValue |
| `Toggle` | 切换按钮 | 支持 v-model:pressed、loading 加载状态、ariaLabel 无障碍标签 |
| `ToggleGroup` | 切换按钮组 | 支持单选/多选/方向，通过 v-model进行受控 |
| `TagsInput` | 标签输入 | 支持子组件组合、ariaLabel 无障碍标签 |
| `Calendar` | 日历 | 日期选择器，支持范围模式、事件标记（events/CalendarEvent 类型）、自定义渲染（eventRenderer）、显示模式（mode: default 圆点 + Tooltip / card 胶囊徽章） |
| `ColorPicker` | 颜色选择器 | 支持 HEX/RGB/HSL、透明度、预设与历史记录、defineExpose({ open }) 程序化控制面板 |
| `DatePicker` | 日期选择器 | 单日期/范围/日期时间/周/月/年，支持 v-model、displayFormat 格式化、快捷选项、defineExpose({ open }) 程序化控制面板（从 `brutx-ui-vue/date-picker` 导入） |
| `Upload` | 上传 | 文件上传系统，支持拖拽、文件列表管理、进度追踪、错误处理、beforeUpload/beforeRemove 钩子、httpRequest 自定义上传、listType 列表类型 |
| `Form` | 表单 | 集成 vee-validate + Zod 校验，支持 inline 行内布局、labelPosition 标签位置、scrollToError 滚动到错误字段、defineExpose 暴露 validate/validateField/resetFields/clearValidate/scrollToField 方法 |
| `Label` | 标签 | 表单字段标签，支持尺寸/必填标记 |

> 💡 **参数与插槽参考**：表单组件的详细 API 声明参见 [form.md](./components/form.md)。

---

## 2. 布局与容器 (Layout & Containers)

| 组件 | 中文名 | 说明 |
|------|--------|------|
| `Card` | 卡片 | 6 种变体，支持 Header/Title/Description/Content/Footer，interactive 可点击模式支持 role="button" 和键盘事件 |
| `Card3D` | 3D 卡片 | 3D 物理悬浮，鼠标悬停偏转与反向阴影，支持变体/可点击 |
| `Separator` | 分隔线 | 支持水平/垂直方向/变体/尺寸/文字分隔线 |
| `ScrollArea` | 滚动区域 | 自定义滚动条，支持 ScrollBar 子组件/变体/尺寸 |
| `Sheet` | 侧边抽屉 | 4 个方向变体（top/right/bottom/left） |
| `Tabs` | 标签页 | 支持 list/trigger/content、orientation 垂直布局，通过 v-model 进行受控 |
| `Accordion` | 手风琴 | 支持单选/多选模式、content 变体（flat/ghost/interactive） |
| `Breadcrumb` | 面包屑 | 支持 Link/Page/Separator/Ellipsis |
| `Stepper` | 步骤条 | 支持水平/垂直方向，step-click 事件，垂直内容插槽，变体/尺寸/可点击，defineExpose 暴露 currentStep/goToStep/nextStep/previousStep 等方法 |
| `Timeline` | 时间线 | 支持垂直/水平布局，3 种节点形状，交替布局，role="list" 和 role="listitem" 无障碍语义 |
| `Carousel` | 轮播 | 支持循环/自动播放/箭头/圆点、缩略图导航、自动播放指示器（进度条/圆点/分数）、视差动画；defineExpose 暴露滚动方法、useCarousel composable、prefers-reduced-motion 动效降级 |
| `TreeView` | 树形视图 | 基于 `localNodes` 状态代理实现单向数据流以防止 watch 死循环。支持展开/选中/复选选择模式、拖拽排序（draggable/allowDrag/allowDrop/v-model:nodes/moveNode 工具函数）、懒加载（lazy/load/retryOnError）、节点过滤、reloadNode 重载节点、defineExpose 暴露 filter/reloadNode 方法 |
| `Watermark` | 水印 | 平铺水印层，支持防篡改与自适应防 Diff 缓存重绘 |
| `Backtop` | 回到顶部 | 带滚动节流与跨沙箱容器探测支持的回到顶部组件 |

> 💡 **参数与插槽参考**：布局组件的详细 API 声明参见 [layout.md](./components/layout.md)。

---

## 3. 数据展示 (Data Display)

| 组件 | 中文名 | 说明 |
| --- | --- | --- |
| `Table` | 表格 | 8 个子组件（Header/Body/Footer/Row/Head/Cell/Caption）、ariaLabel 无障碍标签 |
| `DataTable` | 数据表格 | 支持排序/筛选/分页/选择/虚拟滚动/固定列/展开行/合并单元格、defineExpose 暴露排序/筛选/选择/分页/展开方法 |
| `Descriptions` | 描述列表 | 以键值对形式展示只读信息，支持 column 列数、border 边框、direction 方向、span 跨列 |
| `VirtualScroll` | 虚拟滚动 | 基于 @tanstack/vue-virtual，支持大数据列表高性能滚动，暴露 scrollToIndex 方法 |
| `Badge` | 徽章 | 7 种变体、3 种尺寸（sm/default/lg）、closable/dot/pulse、icon 插槽 |
| `Avatar` | 头像 | 支持 image/fallback、尺寸、形状、变体、状态 |
| `Progress` | 进度条 | 支持 v-model、不确定状态、百分比标签 |
| `Pagination` | 分页 | 支持 v-model、total/pageSizes/layout/jumper、首尾页、可点击省略号 jump 事件 |
| `Counter` | 数字动画 | 支持前缀/后缀/分隔符/缓动函数，5 种变体，自动尊重 prefers-reduced-motion |
| `Kbd` | 键盘按键 | 3 种尺寸、4 种变体 |
| `CodeBlock` | 代码块 | 支持语言高亮、行号、折叠展开 |
| `Marquee` | 跑马灯 | 支持方向/速度/暂停/淡出、变体/尺寸、prefers-reduced-motion 动效降级 |
| `BeforeAfter` | 对比图 | 前后对比滑块，支持 v-model、水平/垂直方向、prefers-reduced-motion 动效降级 |
| `ChatBubble` | 聊天气泡 | 支持 sent/received/system 变体、颜色/尺寸 |
| `Skeleton` | 骨架屏 | 支持 Text/Avatar/Card/Table 子组件、尺寸/形状/宽度 |
| `Spinner` | 加载动画 | 4 种变体（Spinner/Block/Dots/Bars） |
| `Statistic` | 统计数值 | 粗野主义高对比度统计数值卡片，带数字递增动画缓动 |
| `Image` | 图片 | 支持 fit 填充模式、懒加载（IntersectionObserver）、fallback 备用图、大图预览（Teleport/FocusScope/键盘切换/缩放/旋转/翻转/拖拽）、斜线噪点占位背景、placeholder/error 插槽 |

> 💡 **参数与插槽参考**：数据展示组件的详细 API 声明参见 [data.md](./components/data.md)。

---

## 4. 反馈与浮层 (Feedback & Overlays)

| 组件 | 中文名 | 说明 |
| --- | --- | --- |
| `Dialog` | 对话框 | 支持 Header/Footer/Title/Description、size 变体（sm/default/lg/xl/full）、fullscreen 全屏、beforeClose 关闭前钩子（须返回 `boolean \| Promise<boolean>`，不支持 done 回调）、destroyOnClose 关闭后销毁；函数式 API：showDialog/showMessageBox 命令式调用，useDialog/useMessageBox composable 封装 |
| `AlertDialog` | 确认弹窗 | 支持 Action/Cancel |
| `Alert` | 提示 | 7 种变体、closable、actions 插槽 |
| `Toast` | 通知 | 搭配 useToast 组合式函数、pauseOnHover 悬停暂停 |
| `Popover` | 弹出框 | 支持对齐/偏移 |
| `Popconfirm` | 气泡确认框 | 轻量级确认操作，支持 title/confirmButtonType/icon/cancelable |
| `Tooltip` | 工具提示 | 支持偏移 |
| `DropdownMenu` | 下拉菜单 | 支持子菜单项/复选/单选/分隔符 |
| `Command` | 命令面板 | 支持搜索/分组/快捷键、defineExpose({ filterSearch }) 程序化搜索 |
| `InfiniteScroll` | 无限滚动 | 滚动到底部自动加载更多数据，支持 distance/delay/disabled、useInfiniteScroll composable |
| `Loading` | 加载蒙版 | 包裹式加载蒙版与 v-loading 客户端指令支持（附带 getSSRProps SSR 安全机制） |
| `Result` | 结果反馈 | 成功、警告、普通、失败四种状态的新粗野反馈卡片 |
| `Tour` | 导览 | 新手引导组件，支持 Canvas 局部挖空遮罩、devicePixelRatio 高清渲染、硬边框聚焦、ResizeObserver + scroll/resize 防漂移、scrollIntoView 自动滚动、四方向 Popover、v-model:current/v-model:open、Escape/Enter 键盘操作 |
| `Message` | 消息提示 | 函数式 API（useMessage），单例挂载 + TransitionGroup 垂直堆叠 + 自动关闭 + GC 卸载；支持 info/success/warning/error 四种类型、show 自定义、duration/closable 配置 |

> 💡 **参数与插槽参考**：反馈与浮层组件的详细 API 声明参见 [feedback.md](./components/feedback.md)。

---

## 5. 新粗野主义特色 (Neo-Brutalist Features)

| 组件 | 中文名 | 说明 |
|------|--------|------|
| `GlitchText` | 故障文字 | CSS clip-path 驱动，支持 hover/click/autoplay，横向/纵向/双向撕裂，自动尊重 prefers-reduced-motion |
| `TypewriterText` | 打字机文本 | 逐字符显示动画，支持循环/光标/尺寸/粗细，自动尊重 prefers-reduced-motion |
| `NoiseBackground` | 噪点背景 | SVG feTurbulence 滤镜，支持动画/类型/圆角、prefers-reduced-motion 静态降级 |
| `ScratchCard` | 刮刮卡 | Canvas 覆盖层擦除 |
| `SketchyChart` | 手绘图表 | 支持折线/柱状/饼图，SVG + 分形噪声 |
| `CopyToClipboard` | 复制到剪贴板 | 支持自定义持续时间、变体/尺寸 |
| `KanbanBoard` | 看板 | 支持拖拽排序、列拖拽/添加卡片、键盘拖拽（Space 抓取、方向键移动）、defineExpose 暴露 moveCard/moveColumn/addCard 等方法 |

> 💡 **参数与插槽参考**：特色组件的详细 API 声明参见 [brutal.md](./components/brutal.md)。

---

## 6. 区块/页面模板 (Page Sections & Blocks)

| 组件 | 中文名 | 说明 |
|------|--------|------|
| `PricingSection` | 统一定价区域 | 支持 v-model、一次性价格，订阅切换和功能状态 |
| `BrutalistHero` | 英雄区块 | 支持主/次操作按钮 |
| `HeaderSection` | 页头导航 | 支持导航项/Logo |
| `FooterSection` | 页脚 | 支持链接分组/版权 |
| `DashboardShell` | 仪表盘外壳 | 含侧边栏和顶栏 |
| `DataTableSection` | 数据表格 | 支持搜索/分页/排序 |
| `StepperSection` | 步骤区块 | 支持当前步骤 |
| `AuthCard` | 登录卡片 | 内置国际化文案，支持 texts prop 批量覆盖 |
| `LoadingPage` | 加载页面 | 支持进度条 |
| `UploadCard` | 上传卡片 | 支持进度条/文件限制 |
| `ErrorCard` | 错误卡片 | 支持重试/关闭操作 |
| `SuccessCard` | 成功卡片 | 支持确认按钮 |
| `CookieConsent` | Cookie 同意 | 支持接受/拒绝 |
| `FeedbackForm` | 反馈表单 | 支持标题/描述、加载/成功状态 |
| `Tabs (tabs prop)` | 标签导航 | 传入 tabs 数组自动渲染触发器与面板，支持受控/非受控双模式 |

> 💡 **详细区块用法参考**：
> - 页头/页脚/外壳：参见 [layout-nav.md](./blocks/layout-nav.md)
> - 英雄区/定价/FAQ 等：参见 [marketing.md](./blocks/marketing.md)
> - 统计/图表/数据表：参见 [dashboard.md](./blocks/dashboard.md)
> - 认证/设置/404 等页面：参见 [pages.md](./blocks/pages.md)
> - 反馈/空状态/反馈表单：参见 [feedback.md](./blocks/feedback.md)
> - 搜索/上传/操作卡片：参见 [interactive.md](./blocks/interactive.md)
