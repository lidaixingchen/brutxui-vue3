---
title: 组件
description: BrutxUI 提供了一套全面的新粗野主义风格 Vue 3 组件，以无障碍性、类型安全和可定制性为设计理念。
---

# 组件

BrutxUI 提供了一套全面的新粗野主义风格 Vue 3 组件。所有组件均以无障碍性、类型安全和可定制性为设计理念。

## 布局与结构

| 组件 | 说明 |
|------|------|
| [Card](/components/card) | 容器组件，6 种变体和可组合子组件 |
| [Card3D](/components/card-3d) | 3D 物理悬浮卡片，鼠标悬停偏转与反向阴影 |
| [Accordion](/components/accordion) | 折叠面板，可展开/折叠的内容区域 |
| [Separator](/components/separator) | 内容区域之间的视觉分隔线 |
| [Scroll Area](/components/scroll-area) | 带 ScrollBar 的自定义滚动区域 |
| [Kbd](/components/kbd) | 键盘按键样式，展示快捷键 |

## 表单与输入

| 组件 | 说明 |
| --- | --- |
| [Button](/components/button) | 操作按钮，9 种变体、5 种尺寸、加载状态 |
| [Input](/components/input) | 文本输入框，支持变体、尺寸、清除、密码切换、字数统计 |
| [Textarea](/components/textarea) | 多行文本输入框，支持尺寸 |
| [NumberInput](/components/number-input) | 数字输入框，支持步进和范围限制 |
| [Checkbox](/components/checkbox) | 复选框，通过 v-model 绑定选中状态 |
| [Switch](/components/switch) | 切换开关，通过 v-model 绑定 |
| [Radio Group](/components/radio-group) | 单选按钮组 |
| [Select](/components/select) | 下拉选择框，支持清除和搜索过滤 |
| [Combobox](/components/combobox) | 可搜索的单选/多选 |
| [TreeSelect](/components/tree-select) | 树形选择器，支持单选/多选/搜索 |
| [Slider](/components/slider) | 滑块，支持 v-model |
| [TagsInput](/components/tags-input) | 标签输入，动态增删标签 |
| [ColorPicker](/components/color-picker) | 颜色选择器 |
| [Label](/components/label) | 表单字段标签 |
| [Upload](/components/upload) | 文件上传系统，支持拖拽、进度追踪、错误处理 |
| [Form](/components/form) | 表单系统，集成 vee-validate，支持 resetFields/scrollToError |
| [Submit Button](/components/submit-button) | 提交按钮，支持加载/等待状态 |
| [HardcoreInput](/components/hardcore-input) | 硬核输入框，8-bit 音效 + 表情反馈 + 物理震动 |

## 反馈与状态

| 组件 | 说明 |
|------|------|
| [Alert](/components/alert) | 状态消息，7 种变体 |
| [Alert Dialog](/components/alert-dialog) | 确认对话框，支持操作/取消 |
| [Badge](/components/badge) | 行内状态标签，7 种变体 |
| [Progress](/components/progress) | 进度条指示器 |
| [Spinner](/components/spinner) | 加载旋转器，4 种变体 |
| [Skeleton](/components/skeleton) | 内容占位符，支持子组件 |
| [Toast](/components/toast) | 通知提示，搭配 useToast 组合式函数 |
| [CopyToClipboard](/components/copy-to-clipboard) | 复制按钮，一键复制文本到剪贴板 |

## 弹出层与浮层

| 组件 | 说明 |
| --- | --- |
| [Dialog](/components/dialog) | 模态对话框，支持拖拽、调整大小、全屏、关闭前钩子 |
| [Sheet](/components/sheet) | 侧边面板，4 个方向变体 |
| [Popover](/components/popover) | 浮动内容面板 |
| [Popconfirm](/components/popconfirm) | 气泡确认框，轻量级确认操作 |
| [Tooltip](/components/tooltip) | 悬停工具提示 |
| [Dropdown Menu](/components/dropdown-menu) | 右键菜单，支持子菜单项 |
| [Command](/components/command) | 命令面板，支持搜索 |

## 导航

| 组件 | 说明 |
|------|------|
| [Tabs](/components/tabs) | 标签页导航，支持 list/trigger/content |
| [Pagination](/components/pagination) | 分页导航，支持计算算法 |
| [Breadcrumb](/components/breadcrumb) | 面包屑导航，支持子组件 |
| [Stepper](/components/stepper) | 步骤条，支持水平/垂直方向 |
| [Toggle](/components/toggle) | 可按下的切换按钮 |
| [Toggle Group](/components/toggle-group) | 切换按钮组，支持多选 |

## 数据展示

| 组件 | 说明 |
| --- | --- |
| [Avatar](/components/avatar) | 用户头像，支持 image/fallback、尺寸、形状 |
| [Table](/components/table) | 数据表格，8 个子组件 |
| [DataTable](/components/data-table) | 数据表格，排序/筛选/分页/固定列/展开行/合并单元格 |
| [Descriptions](/components/descriptions) | 描述列表，键值对形式展示只读信息 |
| [Carousel](/components/carousel) | 轮播图，支持自动播放和循环 |
| [Timeline](/components/timeline) | 时间线，垂直展示事件序列 |
| [TreeView](/components/tree-view) | 树形目录，支持展开/折叠/多选 |
| [VirtualScroll](/components/virtual-scroll) | 虚拟滚动，大数据列表高性能渲染 |
| [CodeBlock](/components/code-block) | 代码块，支持语法高亮与复制 |
| [ChatBubble](/components/chat-bubble) | 聊天气泡，支持左右对齐和头像 |
| [Counter](/components/counter) | 数字滚动动画，支持缓动 |
| [Marquee](/components/marquee) | 跑马灯，无缝循环滚动 |

## 交互与可视化

| 组件 | 说明 |
| --- | --- |
| [ScratchCard](/components/scratch-card) | 刮刮卡，Canvas 覆盖层擦除 |
| [SketchyChart](/components/sketchy-chart) | 手绘感折线/柱状图表，SVG + 分形噪声 |
| [NoiseBackground](/components/noise-background) | 噪点纹理背景，SVG 滤镜 + 动画 |
| [BeforeAfter](/components/before-after) | 前后对比滑块 |
| [KanbanBoard](/components/kanban-board) | 看板，拖拽卡片在列间移动 |
| [InfiniteScroll](/components/infinite-scroll) | 无限滚动，滚动到底部自动加载更多数据 |
| [GlitchText](/components/glitch-text) | 故障撕裂文本，CSS clip-path 驱动 |
| [GlitchButton](/components/glitch-button) | 故障效果按钮，支持多种触发模式 |
| [TypewriterText](/components/typewriter-text) | 打字机效果文本，支持循环和光标 |

## 区块

| 组件 | 说明 |
|------|------|
| [Dashboard Stats](/components/dashboard-stats) | 仪表盘统计区块 |
| [SaaS Pricing](/components/saas-pricing) | 基于 Pricing Section 的 SaaS 定价预设 |

## 主题与工具

| 组件 | 说明 |
|------|------|
| [ColorModeSwitcher](/components/color-mode-switcher) | 颜色模式切换，支持 icon/button/select 三种显示模式 |