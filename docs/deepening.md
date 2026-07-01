# BrutxUI 组件深化与拓展方案 v2.0

> 参考 Element Plus 组件库，系统性提出深化和拓展项目已有组件的方案。
>
> 版本：v2.0 | 最后更新：2026-07-01

---

## 一、当前状态总结

### 1.1 已完成的深化工作

经过全面分析，原方案中大部分 **P0 和 P1 优先级** 的功能已经实现：

| 组件 | 已实现功能 | 完成度 |
|---|---|---|
| **Input** | clearable、showPassword、showWordLimit、prefixIcon/suffixIcon、prepend/append 插槽、errorMessage | ✅ 100% |
| **Select** | clearable（通过 SelectTrigger）、基础选择功能 | 🟡 60% |
| **Form** | inline、labelPosition、scrollToError、resetFields、clearValidate、validateField、scrollToField | ✅ 100% |
| **Pagination** | total、pageSize、pageSizes、layout、background、hideOnSinglePage、jumper | ✅ 100% |
| **DataTable** | expandable、spanMethod、fixed columns、sorting、filtering、selection、pagination | ✅ 90% |
| **Dialog** | fullscreen、beforeClose、destroyOnClose、draggable、resizable、zIndex、open/close 事件 | ✅ 100% |
| **Upload** | fileList、limit、multiple、accept、maxSize、maxRetries、beforeUpload、beforeRemove、httpRequest、listType、autoUpload、drag、onError | ✅ 95% |
| **Descriptions** | column、border、direction、size、title | ✅ 100% |
| **Popconfirm** | 基础确认弹窗功能 | ✅ 100% |
| **InfiniteScroll** | 无限滚动功能 | ✅ 100% |

### 1.2 Element Plus 组件覆盖分析

| 分类 | 已覆盖组件 | 缺失组件 |
|---|---|---|
| **基础组件** | Button, Link (a), Separator | Icon, Typography, Space, Layout, Row/Col, Container |
| **表单组件** | Input, InputNumber, Select, Switch, Slider, DatePicker, Upload, ColorPicker, Form | Cascader, Rate, Transfer |
| **数据展示** | Table (DataTable), Tag (TagsInput), Progress, Tree (TreeView), Pagination, Badge, Avatar, Skeleton, Empty, Descriptions | Result, Statistic, Image |
| **导航组件** | Breadcrumb, Dropdown (DropdownMenu), Steps (Stepper), Tabs | Menu |
| **反馈组件** | Dialog, Drawer (Sheet), Alert, Popconfirm, Tooltip, Popover | MessageBox, Loading (局部), Notification |
| **其他组件** | Divider (Separator), Calendar, InfiniteScroll | Backtop, Watermark, Tour |

---

## 二、深化方案（按优先级排序）

### P0 — Select 与 Combobox 分立设计

#### 2.1 Select 保持纯粹，引导使用 Combobox/ComboboxMulti

**现状**：目前 Select 是基于 reka-ui SelectRoot 等子组件拼装的单选下拉框。项目目前在 `packages/ui/src/components/combobox/` 下已经独立实现了成熟的 `Combobox.vue`（可搜索单选）和 `ComboboxMulti.vue`（可搜索多选）。

**设计调整**：
- 依据 Reka UI 的规范与 ARIA 标准，Select 组件本身仅处理“非可编辑的轻量单选”。**不推荐**在 `Select` 内部强行集成过滤输入框和多选（这会破坏原语的键盘导航和 a11y 标准）。
- 项目中所有对于**检索、远程搜索、多选、Tag折叠**的需求，均直接使用和推广已有的 `Combobox` 和 `ComboboxMulti` 组件。
- 补充完善 `Combobox` 的 `loading`、`creative`（创建新选项）等高级特性。

---

#### 2.2 Select 分组功能

**新增 Props**：

| Prop | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `groupField` | `string` | — | 分组字段名 |
| `groupLabel` | `string` | — | 分组标签字段名 |

**实现方案**：

- 使用 reka-ui 的 `SelectGroup` 和 `SelectLabel` 原语
- 根据 `groupField` 对 options 进行分组
- 每个分组渲染一个 `SelectGroup`，包含 `SelectLabel` 和多个 `SelectItem`

---

### P1 — DataTable 高级功能

#### 2.3 DataTable 虚拟滚动

**现状**：`virtualScroll` prop 已在类型中声明，但虚拟渲染逻辑未完成。项目目前已有一个基于 `div` + 绝对偏移定位的 `VirtualScroll` 组件。

**实现方案**：

- 整合已有的 `VirtualScroll` 组件作为内部行容器渲染器。
- **DOM 结构重构**：当 `virtualScroll` 为 `true` 时，DataTable 的 DOM 结构将**自动降级切换为非 Table 布局**，由 `div` 搭配 `display: grid` 或 `flex` 模拟行与单元格的渲染（以兼容 `VirtualScroll` 所需的绝对定位偏移）。
- **局限与约束**：虚拟滚动模式下，原生列宽的自适应将会失效，**开发者必须为每一列显式配置 `width`**。
- 需要支持 `rowHeight` prop，在复杂自适应场景下使用 `@tanstack/vue-virtual` 进行动态测量。

**新增 Props**：

| Prop | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `virtualScroll` | `boolean` | `false` | 启用虚拟滚动 |
| `rowHeight` | `number \| 'auto'` | `48` | 行高（auto 为基于实际 DOM 动态测量） |
| `virtualScrollBuffer` | `number` | `5` | 虚拟滚动缓冲行数 |

**风险提示**：

- 虚拟滚动 + 固定列 + 合并单元格的组合可能产生边界问题
- 建议：合并单元格或表头层级复杂场景下禁用虚拟滚动，或提供降级方案

---

#### 2.4 DataTable 列筛选 UI

**现状**：`useDataTableFilter` composable 已有 `filterState.columns` 数据结构，但缺少 UI。

**实现方案**：

- 在列头旁添加筛选图标（`Filter` Lucide 图标）
- 点击弹出 Popover，内含筛选选项
- 支持文本筛选、单选筛选、多选筛选、日期范围筛选

**新增 Column 定义**：

```typescript
interface DataTableColumn {
  // ... 现有属性
  filterType?: 'text' | 'select' | 'multi-select' | 'date-range'
  filterOptions?: { label: string; value: unknown }[]
  columnFilterable?: boolean
}
```

---

### P2 — Tree 组件增强

#### 2.5 Tree 拖拽功能

**新增 Props**：

| Prop | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `draggable` | `boolean` | `false` | 是否可拖拽 |
| `allowDrop` | `(draggingNode, dropNode, type) => boolean` | — | 是否允许放置 |
| `allowDrag` | `(node) => boolean` | — | 是否允许拖拽 |

**新增 Events**：

| Event | 参数 | 说明 |
|---|---|---|
| `node-drag-start` | `{ node, event }` | 开始拖拽时触发 |
| `node-drag-enter` | `{ draggingNode, dropNode, event }` | 拖拽进入时触发 |
| `node-drag-leave` | `{ draggingNode, dropNode, event }` | 拖拽离开时触发 |
| `node-drag-over` | `{ draggingNode, dropNode, event }` | 拖拽悬停时触发 |
| `node-drag-end` | `{ draggingNode, dropNode, dropType, event }` | 拖拽结束时触发 |
| `node-drop` | `{ draggingNode, dropNode, dropType, event }` | 放置时触发 |

---

#### 2.6 Tree 懒加载

**新增 Props**：

| Prop | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `lazy` | `boolean` | `false` | 是否懒加载子节点 |
| `load` | `(node) => Promise<TreeNode[]>` | — | 加载子节点数据的方法 |

**实现方案**：

- 节点展开时调用 `load` 方法获取子节点
- 加载中显示 Spinner 组件
- 加载完成后将子节点插入到对应节点下
- 使用 `loadingKeys` Set 跟踪正在加载的节点，防止重复请求
- 加载失败时显示重试按钮，支持 `retryOnError` prop
- 已加载的节点缓存子节点数据，再次展开时不再请求

---

#### 2.7 Tree 过滤

**新增 Props**：

| Prop | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `filterable` | `boolean` | `false` | 是否可过滤 |
| `filterMethod` | `(value, node) => boolean` | — | 自定义过滤方法 |

**实现方案**：

- 提供 `filter(query: string)` 方法
- 默认过滤逻辑：节点 label 包含查询字符串
- 过滤时自动展开匹配节点的父节点

---

### P3 — Toast 增强

#### 2.8 Toast 分组功能

**新增 Props（ToastContainer）**：

| Prop | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `grouping` | `boolean` | `false` | 相同标题/内容的 Toast 合并计数 |

**实现方案**：

- 相同 `title` + `variant` 的 Toast 不创建新实例，而是增加已有 Toast 的 `count` 属性
- 显示格式：`标题 (3)`，使用现有 Badge 组件

---

### P4 — Calendar 增强

#### 2.9 Calendar 事件标记

**新增 Props**：

| Prop | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `events` | `CalendarEvent[]` | `[]` | 日历事件列表 |
| `eventRenderer` | `(event: CalendarEvent) => VNode` | — | 自定义事件渲染 |

**CalendarEvent 类型**：

```typescript
interface CalendarEvent {
  id: string
  title: string
  date: Date | string
  color?: 'primary' | 'success' | 'warning' | 'destructive'
  allDay?: boolean
}
```

---

## 三、新增组件方案

### 3.1 Transfer 穿梭框（P1）

**用途**：在两个列表间移动选项，常用于权限分配、角色配置等场景。

**组件结构**：

```text
Transfer
├── TransferPanel (左侧源列表)
│   ├── TransferHeader (标题 + 全选 + 搜索)
│   └── TransferList (列表项)
├── TransferOperations (中间操作按钮)
│   ├── Button (右移 >)
│   └── Button (左移 <)
└── TransferPanel (右侧目标列表)
```

**核心 Props**：

```typescript
interface TransferProps {
  modelValue: (string | number)[]
  data: TransferDataItem[]
  filterable?: boolean
  titles?: [string, string]
  buttonTexts?: [string, string]
  targetOrder?: 'original' | 'push' | 'unshift'
}

interface TransferDataItem {
  key: string | number
  label: string
  disabled?: boolean
}
```

**Neo-Brutalism 风格要点**：

- 使用现有 `Card` 作为面板容器
- 使用 `Checkbox` 组件作为选择项
- 中间操作按钮使用 `Button` 组件的 primary variant
- 粗边框 + 硬阴影的一致性设计

---

### 3.2 Cascader 级联选择器（P1）

**用途**：从多级分类中选择选项，如省市区选择。

**组件结构**：

```text
Cascader
├── CascaderTrigger (触发器 - 显示选中值)
└── CascaderPanel (弹出面板)
    ├── CascaderMenu (每一级菜单)
    │   └── CascaderMenuItem (菜单项)
    └── CascaderMenu (下一级菜单...)
```

**核心 Props**：

```typescript
interface CascaderProps {
  modelValue?: string | number | (string | number)[]
  options: CascaderOption[]
  fieldNames?: CascaderFieldNames
  multiple?: boolean
  filterable?: boolean
  clearable?: boolean
  showAllLevels?: boolean
  collapseTags?: boolean
  separator?: string
}

interface CascaderOption {
  value: string | number
  label: string
  children?: CascaderOption[]
  disabled?: boolean
  leaf?: boolean
}

interface CascaderFieldNames {
  value?: string
  label?: string
  children?: string
  disabled?: string
  leaf?: string
}
```

**实现方案**：

- 基于 reka-ui 的 Popover 原语实现弹出层
- 使用 CSS Grid 布局多级菜单
- 支持键盘导航（左右键切换级别，上下键选择选项）

---

### 3.3 Rate 评分组件（P2）

**用途**：评分操作，如商品评价。

**核心 Props**：

```typescript
interface RateProps {
  modelValue?: number
  max?: number
  allowHalf?: boolean
  allowClear?: boolean
  lowThreshold?: number
  highThreshold?: number
  colors?: [string, string, string]
  voidColor?: string
  disabledVoidColor?: string
  icon?: Component
  voidIcon?: Component
  disabled?: boolean
  showText?: boolean
  showScore?: boolean
  texts?: string[]
  scoreTemplate?: string
}
```

**Neo-Brutalism 风格要点**：

- 使用 Lucide 的 `Star` 图标
- 选中状态使用高对比度颜色（如黄色填充 + 粗边框）
- hover 时添加硬阴影效果
- 支持 `prefers-reduced-motion`：禁用缩放动画

---

### 3.4 Image 图片组件（P2）

**用途**：图片展示，支持预览、懒加载、错误兜底。

**核心 Props**：

```typescript
interface ImageProps {
  src: string
  alt?: string
  fit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
  previewSrcList?: string[]
  initialIndex?: number
  hideOnClickModal?: boolean
  zoomRate?: number
  preview?: boolean
  fallback?: string
  loading?: 'eager' | 'lazy'
}
```

**实现方案**：

- 使用 `IntersectionObserver` 实现懒加载
- 使用现有 `Dialog` 组件实现图片预览
- 预览支持缩放、旋转、左右切换
- 错误时显示 fallback 图片或默认占位符

---

### 3.5 Statistic 统计数值组件（P2）

**用途**：展示统计数据，如销售额、用户数。

**核心 Props**：

```typescript
interface StatisticProps {
  value: number
  title?: string
  precision?: number
  decimalSeparator?: string
  groupSeparator?: string
  prefix?: string | Component
  suffix?: string | Component
  valueStyle?: Record<string, string>
}
```

**实现方案**：

- 使用现有 `counter` 组件的数字动画功能
- 添加标题、前缀、后缀支持
- 支持千分位分隔符

---

### 3.6 Result 结果展示组件（P2）

**用途**：展示操作结果，如成功、失败、警告。

**核心 Props**：

```typescript
interface ResultProps {
  icon?: 'success' | 'warning' | 'info' | 'error'
  title?: string
  subTitle?: string
}
```

**Slots**：

| Slot | 说明 |
|---|---|
| `icon` | 自定义图标 |
| `title` | 自定义标题 |
| `sub-title` | 自定义副标题 |
| `extra` | 操作区 |

---

### 3.7 Tour 导览组件（P2）

**用途**：新手引导，分步介绍功能。

**核心 Props**：

```typescript
interface TourProps {
  steps: TourStep[]
  current?: number
  mask?: boolean
  type?: 'default' | 'primary'
  scrollIntoViewOptions?: ScrollIntoViewOptions
}

interface TourStep {
  target: string | HTMLElement
  title?: string
  description?: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  mask?: boolean
  type?: 'default' | 'primary'
}
```

**实现方案**：

- 使用 `Popover` 组件作为提示框
- 使用遮罩层突出目标元素
- 支持键盘导航（Escape 关闭，Enter 下一步）

---

### 3.8 Watermark 水印组件（P2）

**用途**：为页面添加水印，防止内容被盗用。

**核心 Props**：

```typescript
interface WatermarkProps {
  width?: number
  height?: number
  rotate?: number
  zIndex?: number
  image?: string
  content?: string | string[]
  font?: {
    color?: string
    fontSize?: number | string
    fontWeight?: 'normal' | 'light' | 'weight' | number
    fontStyle?: 'none' | 'normal' | 'italic' | 'oblique'
    fontFamily?: string
  }
  gap?: [number, number]
  offset?: [number, number]
}
```

**实现方案**：

- 使用 Canvas API 生成水印图片
- 将水印图片设置为背景
- 使用 MutationObserver 防止水印被删除

---

### 3.9 Backtop 回到顶部组件（P2）

**用途**：快速回到页面顶部。

**核心 Props**：

```typescript
interface BacktopProps {
  target?: string | HTMLElement
  visibilityHeight?: number
  right?: number
  bottom?: number
}
```

**Neo-Brutalism 风格要点**：

- 使用 Lucide 的 `ArrowUp` 图标
- 粗边框 + 硬阴影
- hover 时阴影偏移变化

---

### 3.10 Menu 导航菜单组件（P1）

**用途**：网站导航菜单，支持多级、折叠。

**组件结构**：

```text
Menu
├── MenuItem (菜单项)
├── SubMenu (子菜单)
│   ├── SubMenuTitle (子菜单标题)
│   └── SubMenuContent (子菜单内容)
│       ├── MenuItem
│       └── SubMenu (嵌套)
└── MenuItemGroup (菜单项分组)
    ├── GroupTitle (分组标题)
    └── MenuItem
```

**核心 Props**：

```typescript
interface MenuProps {
  mode?: 'horizontal' | 'vertical'
  defaultActive?: string
  defaultOpeneds?: string[]
  uniqueOpened?: boolean
  menuTrigger?: 'hover' | 'click'
  collapse?: boolean
  ellipsis?: boolean
  backgroundColor?: string
  textColor?: string
  activeTextColor?: string
}
```

---

## 四、组件架构改进

### 4.1 统一的加载状态系统

**建议**：扩展现有 `Spinner` 组件，提供 `<Loading>` 包裹组件及一键化绑定的 `v-loading` 自定义指令：

```vue
<!-- 组件用法 -->
<Loading :loading="isLoading" :text="'加载中...'">
  <DataTable :data="data" />
</Loading>

<!-- 指令用法（推荐） -->
<div v-loading="isLoading" v-loading-text="'数据拼命加载中...'">
  <DataTable :data="data" />
</div>
```

**核心 Props（Loading 组件）**：

```typescript
interface LoadingProps {
  loading?: boolean
  text?: string
  spinner?: Component
  background?: string
  customClass?: string
}
```

**指令 `v-loading` 设计机制**：
- 在指令的 `mounted` 与 `updated` 钩子中，动态在宿主元素内部生成遮罩和 Spinner 并实施渲染。
- **自动定位补充**：指令挂载时将自动检测宿主 DOM 的 CSS 定位。如果不是 `relative` 或 `absolute`，则指令会自动向宿主追加一个特定的定位 CSS Class（例如 `relative`），以防止遮罩层溢出，在指令销毁时还原。
- **SSR 兼容**：在服务端渲染时忽略指令的 DOM 挂载逻辑，或配置 `getSSRProps`，仅在客户端 mounted 后初始化。

---

### 4.2 统一的函数式调用 API

**现状**：Toast 已有函数式调用，但 Dialog、MessageBox 等组件缺少函数式 API。

**建议**：为以下组件提供函数式调用 API：

```typescript
// Dialog 函数式调用
const dialog = useDialog()
const result = await dialog.open({
  title: '提示',
  content: '确认删除？',
  onConfirm: () => { ... },
})
// result: { action: 'confirm' | 'cancel' | 'close' }

// MessageBox 函数式调用
const messageBox = useMessageBox()
const action = await messageBox.confirm('确认删除？', '提示', {
  confirmButtonText: '确定',
  cancelButtonText: '取消',
  type: 'warning',
})
// action: 'confirm' | 'cancel'

// Message 函数式调用
const message = useMessage()
const id = message.success('操作成功')
// id: string，可用于手动关闭
message.error('操作失败')
message.warning('警告信息')
message.info('提示信息')
```

---

### 4.3 统一的键盘导航规范

**建议制定统一规范**：

| 按键 | 行为 |
|---|---|
| `Tab` / `Shift+Tab` | 在可聚焦元素间移动焦点 |
| `Enter` / `Space` | 激活当前聚焦元素（按钮、选项） |
| `Escape` | 关闭弹出层、取消操作 |
| `Arrow Up/Down` | 在列表选项间导航 |
| `Arrow Left/Right` | 在输入框内移动光标、在标签间切换 |

**实现建议**：

- 提取 `useKeyboardNavigation` composable
- 使用 `aria-*` 属性标记可访问状态
- 遵循 WAI-ARIA 设计模式（如 Combobox、Listbox、Menu）

---

### 4.4 使用 `defineModel` 简化双向绑定

**建议**：Vue 3.4+ 提供了 `defineModel` 宏，可简化组件的 v-model 实现。新增组件应优先采用此方式：

```typescript
// 传统方式
const props = defineProps<{ modelValue?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

// 使用 defineModel（推荐）
const model = defineModel<string>()
```

**适用场景**：所有需要 v-model 的组件（Select、Cascader、Rate、Transfer 等）。

---

## 五、实施路线图

```text
Phase 1 (核心功能增强 — 2-3周)
├── Select 可搜索 (filterable/remote)
├── Select 分组功能
├── DataTable 列筛选 UI
└── Toast 分组功能

Phase 2 (新增基础组件 — 3-4周)
├── Transfer 穿梭框
├── Cascader 级联选择器
├── Rate 评分组件
└── Menu 导航菜单

Phase 3 (新增展示组件 — 2-3周)
├── Image 图片组件
├── Statistic 统计数值
├── Result 结果展示
└── Watermark 水印

Phase 4 (高级功能 — 3-4周)
├── Tree 拖拽/懒加载/过滤
├── DataTable 虚拟滚动
├── Tour 导览组件
├── Backtop 回到顶部
└── Loading 局部加载

Phase 5 (架构优化 — 2-3周)
├── 函数式调用 API (Dialog/MessageBox/Message)
├── 统一键盘导航规范
└── 无障碍测试完善
```

**总计**：约 12-17 周（3-4.25 个月）

---

## 六、设计约束

在所有深化过程中，必须保持以下 Neo-Brutalism 设计语言：

| 设计元素 | 规范 |
|---|---|
| **边框** | 2-3px 实线深色边框 (`border-2 border-brutal-black`) |
| **阴影** | 硬阴影，无模糊 (`shadow-brutal`，offset 4-6px) |
| **圆角** | 小圆角或无圆角 (`rounded-none` 或 `rounded-md`) |
| **交互** | hover 时阴影偏移变化，active 时阴影消失 + 微位移 |
| **色彩** | 高对比度，鲜艳的强调色 (primary/success/warning/destructive) |
| **动效** | 尊重 `prefers-reduced-motion`，提供降级方案 |
| **SSR** | 新增组件需兼容 SSR 环境，避免直接访问 `window`/`document`，使用 `hasDocument` 等工具函数检测环境 |
| **Bundle Size** | 所有组件支持 tree-shaking，大型组件（Image 预览、Tour 遮罩）考虑异步加载 |

---

## 七、国际化策略

所有新增组件的文案必须支持国际化。

**复用现有系统**：

- 使用项目已有的 `useLocale()` composable 和 `t()` 函数
- 默认文案语言：简体中文（与项目现有组件一致）

**文案管理规范**：

| 类型 | 示例 | 处理方式 |
|---|---|---|
| Placeholder | "请选择"、"请输入" | 通过 `t('select.placeholder')` 获取 |
| 按钮文字 | "确认"、"取消"、"上移" | 通过 `t('button.confirm')` 获取 |
| 提示信息 | "上传失败"、"没有更多数据" | 通过 `t('upload.error')` 获取 |
| 状态文案 | "加载中..."、"已完成" | 通过 `t('status.loading')` 获取 |

---

## 八、测试策略

每个 Phase 的完成标准必须包含测试要求。

### 单元测试

| 覆盖率目标 | 说明 |
|---|---|
| 语句覆盖率 | ≥ 80% |
| 分支覆盖率 | ≥ 75% |
| 函数覆盖率 | ≥ 85% |

### 必须测试场景

| 场景类型 | 说明 |
|---|---|
| Props 默认值 | 验证所有 Props 的默认行为 |
| Props 自定义 | 验证 Props 自定义值的生效 |
| Events 触发 | 验证所有 Events 在正确时机触发 |
| Slots 渲染 | 验证所有 Slots 的内容渲染 |
| 边界条件 | 空值、极大值、极小值等边界情况 |
| 错误处理 | 异常输入、网络错误等错误场景 |

### 无障碍测试

- 使用 `@axe-core/vue` 进行自动化 a11y 测试
- 手动测试键盘导航和屏幕阅读器兼容性
- 遵循 WCAG 2.1 AA 级别标准

---

## 九、风险提示

| 风险 | 等级 | 说明 | 应对措施 |
|---|---|---|---|
| reka-ui 版本兼容 | 🟡 中 | Select 多选依赖 Listbox，需确认 reka-ui 版本支持 | 升级前进行兼容性测试 |
| 虚拟滚动性能 | 🟡 中 | DataTable 虚拟滚动 + 固定列 + 合并单元格的组合可能产生边界问题 | 复杂场景下禁用虚拟滚动 |
| 破坏性变更 | 🟡 中 | 组件深化可能影响现有 API | 保持向兼容，使用 deprecated 标记旧 API |
| 样式一致性 | 🟡 中 | 新增组件需保持 Neo-Brutalism 风格一致性 | 使用现有 variants 和设计规范 |

---

## 十、术语表

| 术语 | 说明 |
|---|---|
| Neo-Brutalism | 项目采用的设计风格，特征为粗边框、硬阴影、高对比度 |
| reka-ui | 项目使用的 Vue 3 组件原语库 |
| vee-validate | 项目使用的表单验证库 |
| Lucide | 项目使用的图标库 |
| Tailwind CSS | 项目使用的 CSS 工具类框架 |
