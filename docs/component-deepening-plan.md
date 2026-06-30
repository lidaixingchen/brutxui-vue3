# BrutxUI 组件深化与拓展方案

> 参考 Element Plus 组件库，系统性提出深化和拓展项目已有组件的方案。
>
> 版本：v1.1 | 最后更新：2026-06-30

---

## 一、总体差距概览

| 维度 | BrutxUI 现状 | Element Plus 对标 | 差距等级 |
| --- | --- | --- | --- |
| **基础表单** (Input/Select) | 极简封装，仅基础功能 | 完整复合组件（clearable/前缀/多选/搜索） | 🔴 严重 |
| **文件上传** (UploadCard) | 拖拽区域 + 进度条 | 完整上传系统（文件列表/预览/钩子） | 🔴 严重 |
| **数据表格** (DataTable) | 排序/过滤/选择/分页 | +固定列/展开行/合并单元格/列筛选 | 🟡 中等 |
| **表单系统** (Form) | vee-validate 验证 | +resetFields/scrollToError/inline | 🟡 中等 |
| **分页器** (Pagination) | 页码导航 + 省略号 | +pageSizes/total/快速跳转 | 🟡 中等 |
| **对话框** (Dialog) | 拖拽/调整大小(超EP) | +beforeClose/destroyOnClose/全屏 | 🟢 轻微 |
| **消息通知** (Toast) | 函数式/promise/堆叠(超EP) | +分组 | 🟢 轻微 |
| **完全缺失组件** | — | Transfer/InfiniteScroll/Popconfirm/Descriptions | ⚫ 缺失 |

---

## 二、现有组件深化方案（按优先级排序）

### P0 — 基础表单组件（阻塞性缺失）

#### 2.1 Input 组件深化

**现状问题**：当前是裸 `<input>` 封装，无任何复合功能。

**深化目标**：增加 clearable、密码切换、字数统计、前后缀插槽，保持 Neo-Brutalism 风格。

```text
┌─────────────────────────────────────────────┐
│  ┌─────┬──────────────────────┬─────┐       │
│  │Pre- │  placeholder         │Suf- │       │
│  │pend │                      │fix  │       │
│  └─────┴──────────────────────┴─────┘       │
│                              ┌────┐         │
│                              │Clear│         │
│                              └────┘         │
│  0 / 100                    Password toggle  │
└─────────────────────────────────────────────┘
```

**新增 Props**：

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `clearable` | `boolean` | `false` | 显示清除按钮 |
| `showPassword` | `boolean` | `false` | 密码显隐切换按钮 |
| `showWordLimit` | `boolean` | `false` | 字数统计（需配合 `maxlength`） |
| `prefixIcon` | `ConcreteComponent \| (() => Component)` | — | 前缀图标（支持异步组件和函数式组件） |
| `suffixIcon` | `ConcreteComponent \| (() => Component)` | — | 后缀图标（支持异步组件和函数式组件） |

**新增 Slots**：

| Slot | 作用域 | 说明 |
| --- | --- | --- |
| `prefix` | — | 输入框前置内容（图标、文字） |
| `suffix` | — | 输入框后置内容（图标、按钮） |
| `prepend` | — | 输入框前置元素（Select、Button） |
| `append` | — | 输入框后置元素（Button、搜索图标） |

**新增 Events**：

| Event | 参数 | 说明 |
| --- | --- | --- |
| `clear` | — | 点击清除按钮时触发 |

**实现要点**：

- 需要将当前的单层 `<input>` 重构为包裹结构：`wrapper > (prepend + container > (prefix + input + suffix) + append)`
- 使用 `Eye` / `EyeOff` Lucide 图标实现密码切换
- 使用 `X` 图标实现清除按钮，仅在 `modelValue` 非空时显示
- 字数统计显示格式：`当前长度 / maxlength`
- 保持现有 ARIA 属性和 IME 组合事件处理

---

#### 2.2 Select 组件深化

**现状问题**：基于 reka-ui 的单选下拉，无多选/搜索/清除功能。

**深化目标**：在保持 reka-ui 基础上增加多选、可搜索、清除功能。

**方案选择**：reka-ui 的 Select 原语不支持多选。建议：

- **单选增强**（clearable/filterable）：在现有 reka-ui Select 基础上扩展
- **多选功能**：基于 reka-ui 的 `Listbox` 原语（支持多选）创建新的 `SelectMulti` 或扩展现有 `Combobox` 组件

> **注意**：项目中已有 `Combobox` / `ComboboxMulti` 组件，支持搜索和多选。建议将 Select 的增强聚焦在 clearable 和 filterable，多选场景引导用户使用 ComboboxMulti。

**新增 Props**：

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `clearable` | `boolean` | `false` | 显示清除按钮 |
| `filterable` | `boolean` | `false` | 输入框搜索过滤 |
| `filterFunction` | `(query: string, item: SelectOption) => boolean` | — | 自定义过滤函数（SelectOption 为选项数据类型） |
| `loading` | `boolean` | `false` | 加载状态（用于远程搜索） |
| `remote` | `boolean` | `false` | 远程搜索模式（禁用本地过滤） |

> **类型说明**：`SelectOption` 为 `{ label: string; value: any; disabled?: boolean }` 类型，具体定义参见项目 TypeScript 类型文件。

**新增 Events**：

| Event | 参数 | 说明 |
| --- | --- | --- |
| `clear` | — | 清除选中值时触发 |
| `filter-change` | `query: string` | 搜索关键词变化时触发 |

**实现要点**：

- 清除按钮：在 Trigger 内添加 `X` 图标，点击时将 `modelValue` 设为 `undefined`
- 可搜索：在 Content 头部渲染一个搜索 Input，使用 `filterFunction` 或默认字符串匹配过滤 Item
- 远程搜索：`remote` 为 true 时，`filter-change` 事件透传给外部，由外部控制 options 列表

---

### P1 — 上传与表格组件

#### 2.3 UploadCard → Upload 系统升级

**现状问题**：仅是拖拽区域，缺少文件列表管理、钩子函数、预览功能。

**深化目标**：从 "上传区域" 升级为完整 "上传系统"。

**建议架构**：

```text
Upload (父组件 - 管理文件列表和上传逻辑)
├── UploadTrigger (触发区域 - 拖拽/点击)
├── UploadFileList (文件列表)
│   └── UploadFileItem (单个文件项 - 预览/进度/删除)
└── UploadPreview (图片预览弹窗)
```

**新增 Props**：

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `fileList` | `UploadFile[]` | `[]` | 文件列表 v-model |
| `limit` | `number` | — | 最大文件数量 |
| `multiple` | `boolean` | `true` | 是否支持多选 |
| `beforeUpload` | `(file: File) => boolean \| Promise<boolean>` | — | 上传前钩子 |
| `beforeRemove` | `(file: UploadFile) => boolean \| Promise<boolean>` | — | 删除前钩子 |
| `httpRequest` | `(options: UploadRequestOptions) => Promise<void>` | — | 自定义上传实现 |
| `listType` | `'text' \| 'picture' \| 'picture-card'` | `'text'` | 列表类型 |
| `autoUpload` | `boolean` | `true` | 选择后自动上传 |
| `drag` | `boolean` | `true` | 是否支持拖拽 |

**UploadFile 类型**：

```typescript
interface UploadFile {
  id: string
  name: string
  size: number
  type: string
  status: 'ready' | 'uploading' | 'success' | 'error'
  progress: number
  url?: string
  raw?: File
  error?: UploadError  // 新增：错误信息
}

interface UploadError {
  message: string
  code?: string
  status?: number
}
```

**错误处理策略**：

- **重试机制**：提供 `retry` 方法，支持单个文件重新上传
- **部分失败处理**：单个文件失败不影响其他文件继续上传
- **错误展示**：文件项显示错误图标和错误信息，hover 时显示详情
- **新增 Props**：

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `maxRetries` | `number` | `3` | 最大重试次数 |
| `onError` | `(error: UploadError, file: UploadFile) => void` | — | 错误回调 |

**实现要点**：

- 保持现有 UploadCard 作为 `UploadTrigger` 的基础
- 文件列表使用现有 `Card` + `Progress` 组件组合
- 图片预览使用现有 `Dialog` 组件
- 文件图标根据 type 区分（使用 Lucide 图标：FileText/File/Image/Video/Music）

---

#### 2.4 DataTable 高级功能

**现状**：排序/过滤/选择/分页已完整，缺少固定列、展开行、合并单元格、列筛选 UI。

**深化目标**：补齐高级表格功能。

##### 2.4.1 固定列（Fixed Columns）

**新增 Column 定义**：

```typescript
interface DataTableColumn {
  // ... 现有属性
  fixed?: 'left' | 'right'  // 新增
}
```

**实现方案**：

- 左侧固定列：`position: sticky; left: 0; z-index: 10`
- 右侧固定列：`position: sticky; right: 0; z-index: 10`
- 需要计算每个固定列的 `left` / `right` 偏移量（累加前面固定列的宽度）
- 固定列添加 box-shadow 以视觉区分

##### 2.4.2 展开行（Expandable Rows）

**新增 Column 类型**：

```typescript
type: 'expand'  // 特殊列类型
```

**新增 Props**：

| Prop | 类型 | 说明 |
| --- | --- | --- |
| `expandable` | `boolean` | 启用展开行 |
| `expandRowKeys` | `Set<string>` | 控制展开的行 |
| `rowKey` | `string \| (row: T) => string` | 行唯一标识 |

**新增 Slots**：

| Slot | 作用域 | 说明 |
| --- | --- | --- |
| `expanded-row` | `{ row: T, index: number }` | 展开行内容 |

##### 2.4.3 合并单元格（Span Method）

**新增 Props**：

| Prop | 类型 | 说明 |
| --- | --- | --- |
| `spanMethod` | `(params: { row, column, rowIndex, columnIndex }) => [number, number] \| void` | 合并方法 |

**实现方案**：

- 返回 `[rowspan, colspan]`，设置为 `[0, 0]` 的单元格不渲染
- **注意**：需先审查现有 DataTable 的 DOM 结构：
  - 若使用传统 `<table>` 元素：使用原生 `rowspan` / `colspan` 属性
  - 若使用 CSS Grid 布局：使用 `grid-row: span N` / `grid-column: span N`
- 合并单元格时需处理边框重叠问题，确保视觉一致性

##### 2.4.4 列筛选 UI

**实现方案**：

- 在列头旁添加筛选图标（`Filter` Lucide 图标）
- 点击弹出 Popover，内含筛选选项
- 利用现有的 `useDataTableFilter` composable 中已有的 `filterState.columns` 数据结构

##### 2.4.5 虚拟滚动实现

**现状**：`virtualScroll` prop 已在类型中声明但未实现。

**实现方案**：

- 利用已有的 `@tanstack/vue-virtual` 依赖和 `VirtualScroll` 组件
- 当 `virtualScroll` 为 true 时，使用虚拟渲染替代全量渲染
- 需要 `rowHeight` prop 或自动测量行高

**风险提示**：

- 虚拟滚动 + 固定列 + 合并单元格的组合可能产生边界问题
- 建议：合并单元格场景下禁用虚拟滚动，或提供降级方案

---

#### 2.5 Form 组件增强

**新增 Props**：

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `inline` | `boolean` | `false` | 行内表单布局 |
| `labelPosition` | `'left' \| 'right' \| 'top'` | `'right'` | 标签位置 |
| `labelWidth` | `string \| number` | — | 标签宽度 |
| `scrollToError` | `boolean` | `false` | 验证失败时滚动到错误字段 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 统一尺寸 |

**通过 defineExpose 暴露方法**：

```typescript
defineExpose({
  validate: () => Promise<boolean>,
  validateField: (field: string) => Promise<boolean>,
  resetFields: () => void,
  clearValidate: (fields?: string[]) => void,
  scrollToField: (field: string) => void,
})
```

**inline 布局实现**：

- Form 添加 `inline` prop 时，`<form>` 添加 `class="flex flex-wrap items-start gap-x-4 gap-y-2"`
- FormItem 在 inline 模式下变为 `flex items-center gap-2` 而非 `space-y-2`

**scrollToError 实现细节**：

- 滚动目标：错误字段的 FormItem 容器顶部
- 滚动 API：使用 `element.scrollIntoView({ behavior: 'smooth', block: 'start' })`
- 固定头部处理：使用 `scroll-margin-top` CSS 属性预留头部空间
- 降级方案：若浏览器不支持平滑滚动，直接跳转

---

#### 2.6 Pagination 增强

**新增 Props**：

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `total` | `number` | — | 总条数（与 `totalPages` 二选一） |
| `pageSize` | `number` | — | 每页条数 |
| `pageSizes` | `number[]` | `[10, 20, 50, 100]` | 每页条数选项 |
| `layout` | `string` | `'sizes, prev, pager, next, jumper, total'` | 自定义布局 |
| `disabled` | `boolean` | `false` | 禁用状态 |
| `background` | `boolean` | `false` | 页码按钮背景色 |
| `hideOnSinglePage` | `boolean` | `false` | 只有一页时隐藏 |

**layout 解析实现**：

- 支持的组件标识：`total` / `sizes` / `prev` / `pager` / `next` / `jumper`
- 按逗号分隔后依次渲染对应组件
- `sizes` 使用现有 Select 组件渲染每页条数选择
- `jumper` 渲染一个小型 Input + "前往" 文字

**容错策略**：

- 无效标识：静默忽略，仅在开发环境输出 console.warn
- 组件间距：统一使用 `gap-x-2` Tailwind 类
- 响应式适配：小屏幕下自动隐藏部分组件（优先保留 `prev` / `pager` / `next`）

---

### P2 — 对话框与通知增强

#### 2.7 Dialog 增强

**新增 Props**：

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `fullscreen` | `boolean` | `false` | 真正全屏模式（占满 viewport） |
| `beforeClose` | `((done: () => void) => void) \| (() => boolean \| Promise<boolean>)` | — | 关闭前钩子（支持回调模式和 Promise 模式） |
| `destroyOnClose` | `boolean` | `false` | 关闭后销毁内容 |
| `headerClass` | `string` | — | 头部自定义类 |
| `bodyClass` | `string` | — | 内容区自定义类 |
| `footerClass` | `string` | — | 底部自定义类 |
| `zIndex` | `number` | — | 自定义层级 |

**新增 Events**：

| Event | 说明 |
| --- | --- |
| `open` | 打开动画开始时触发 |
| `opened` | 打开动画完成时触发 |
| `close` | 关闭动画开始时触发 |
| `closed` | 关闭动画完成时触发 |

**beforeClose 实现**：

```typescript
const handleClose = async () => {
  if (!props.beforeClose) {
    emit('update:modelValue', false)
    return
  }

  // 检测模式：回调模式（参数长度 > 0）或 Promise 模式
  if (props.beforeClose.length > 0) {
    // 回调模式
    props.beforeClose(() => {
      emit('update:modelValue', false)
    })
  } else {
    // Promise 模式
    const result = await (props.beforeClose as () => boolean | Promise<boolean>)()
    if (result !== false) {
      emit('update:modelValue', false)
    }
  }
}
```

**fullscreen 实现**：

- `dialog-variants.ts` 新增 `fullscreen` variant：`w-screen h-screen max-w-none max-h-none rounded-none`
- 移除居中 transform，改为 `inset-0`

---

#### 2.8 Toast 增强

**新增 Props（ToastContainer）**：

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `grouping` | `boolean` | `false` | 相同标题/内容的 Toast 合并计数 |
| `offset` | `number` | `16` | 距离边缘的偏移量（px） |
| `zIndex` | `number` | — | 自定义层级 |

**grouping 实现**：

- 相同 `title` + `variant` 的 Toast 不创建新实例，而是增加已有 Toast 的 `count` 属性
- 显示格式：`标题 (3)`，使用现有 Badge 组件

---

## 三、缺失组件新增方案

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
  titles?: [string, string]  // [源列表标题, 目标列表标题]
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

### 3.2 Descriptions 描述列表（P2）

**用途**：以键值对形式展示只读信息，常见于详情页。

**组件结构**：

```text
Descriptions
├── DescriptionsItem (label: string, span: number)
└── DescriptionsItem ...
```

**核心 Props**：

```typescript
interface DescriptionsProps {
  column?: number           // 列数，默认 3
  border?: boolean          // 是否带边框
  direction?: 'horizontal' | 'vertical'
  size?: 'sm' | 'default' | 'lg'
  title?: string            // 标题
}
```

**实现方案**：

- 使用 CSS Grid 布局，`grid-template-columns: repeat(column, 1fr)`
- `span` 属性控制跨列：`grid-column: span N`
- border 模式使用现有 Table 的样式基础

---

### 3.3 Popconfirm 气泡确认框（P2）

**用途**：点击元素后弹出简单的确认气泡，比 Dialog 更轻量。

**组件结构**：

```text
Popconfirm
├── Popover (复用现有 Popover)
│   ├── reference slot (触发元素)
│   └── content
│       ├── Icon (警告图标)
│       ├── Title
│       ├── Description
│       └── Actions (确认/取消按钮)
```

**核心 Props**：

```typescript
interface PopconfirmProps {
  title: string
  confirmButtonText?: string
  cancelButtonText?: string
  confirmButtonType?: 'primary' | 'destructive'
  icon?: Component
  cancelable?: boolean
}
```

**实现方案**：

- 复用现有 `Popover` + `Button` 组件
- 使用 `useLocale()` 的 t() 函数处理默认文案
- 使用 `TriangleAlert` Lucide 图标作为默认警告图标

---

### 3.4 InfiniteScroll 无限滚动（P2）

**用途**：滚动到底部自动加载更多数据。

**核心 Props**：

```typescript
interface InfiniteScrollProps {
  distance?: number         // 触发距离阈值 (px)
  delay?: number            // 防抖延迟 (ms)
  disabled?: boolean
  immediate?: boolean       // 是否立即检查
}
```

**实现方案**：

- 使用 `IntersectionObserver` API 监测底部哨兵元素
- 提供 `infinite-scroll` composable 供复用
- 加载状态动画尊重 `prefers-reduced-motion`：使用简单的 opacity 切换替代旋转动画

---

## 四、组件架构改进

### 4.1 统一的前缀/后缀系统

当前 Input、Select、Textarea 等组件各自独立，缺乏统一的前后缀系统。

**建议**：提取通用的 `InputAdornment` 组件：

```text
InputAdornment
├── slot: default (包裹的目标组件)
├── prop: prepend (前置元素)
├── prop: append (后置元素)
├── prop: prefixIcon (前置图标)
└── prop: suffixIcon (后缀图标)
```

所有表单组件通过组合 `InputAdornment` 获得一致的前后缀能力。

---

### 4.2 统一的清除按钮逻辑

多个组件需要清除功能（Input、Select、DatePicker、ColorPicker、TreeSelect 等）。

**建议**：提取 `useClearable` composable：

```typescript
export function useClearable(props: { clearable: boolean; disabled: boolean }) {
  const showClear = ref(false)
  const handleClear = (emit: Function) => {
    emit('update:modelValue', undefined)
    emit('clear')
  }
  // 统一的鼠标进入/离开逻辑
  return { showClear, handleClear, onMouseEnter, onMouseLeave }
}
```

---

### 4.3 统一的加载状态系统

**建议**：扩展现有 `Spinner` 组件，提供 `Loading` 包裹组件：

```vue
<Loading :loading="isLoading" :text="'加载中...'">
  <DataTable :data="data" />
</Loading>
```

---

### 4.4 统一的弹出层定位系统

Select、Popover、Popconfirm、Tooltip 等组件都需要弹出层定位。当前各组件可能使用不同的定位策略。

**建议**：

- 统一使用 Floating UI 或类似定位库
- 抽取 `useFloating` composable，封装定位逻辑
- 统一 z-index 管理策略，避免层级冲突

```typescript
// 示例：useFloating composable 接口设计
export function useFloating(options: {
  placement?: 'top' | 'bottom' | 'left' | 'right' | ...
  offset?: number
  flip?: boolean
  shift?: boolean
}) {
  // 返回定位状态和方法
  return {
    referenceRef: Ref<HTMLElement | null>,
    floatingRef: Ref<HTMLElement | null>,
    style: ComputedRef<{ top: string; left: string }>,
    update: () => void,
  }
}
```

---

### 4.5 统一的键盘导航规范

表单组件（Input、Select、Combobox、Transfer）需要统一的键盘交互规范，确保无障碍访问。

**建议制定统一规范**：

| 按键 | 行为 |
| --- | --- |
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

## 五、实施路线图

```text
Phase 1 (核心表单补齐 — 3-4周)
├── Input 深化 (clearable/password/wordLimit/slots)
├── Select 增强 (clearable/filterable)
├── useClearable composable 提取
└── InputAdornment 通用组件

Phase 2 (上传系统升级 — 2-3周)
├── Upload 父组件 (文件列表管理)
├── UploadFileList / UploadFileItem
├── beforeUpload/beforeRemove 钩子
├── 图片预览 (复用 Dialog)
└── httpRequest 自定义上传

Phase 3 (表格高级功能 — 4-5周)
├── DataTable 固定列
├── DataTable 展开行
├── DataTable 合并单元格
├── DataTable 列筛选 UI
└── DataTable 虚拟滚动实现

Phase 4 (表单/分页/弹窗增强 — 2周)
├── Form resetFields/scrollToError/inline
├── Pagination pageSizes/total/jumper/layout
├── Dialog fullscreen/beforeClose/destroyOnClose
└── Toast grouping

Phase 5 (新增组件 — 3-4周)
├── Transfer 穿梭框
├── Descriptions 描述列表
├── Popconfirm 气泡确认框
└── InfiniteScroll 无限滚动
```

**总计**：约 14-18 周（3.5-4.5 个月）

---

## 六、设计约束

在所有深化过程中，必须保持以下 Neo-Brutalism 设计语言：

| 设计元素 | 规范 |
| --- | --- |
| **边框** | 2-3px 实线深色边框 (`border-2 border-brutal-black`) |
| **阴影** | 硬阴影，无模糊 (`shadow-brutal`，offset 4-6px) |
| **圆角** | 小圆角或无圆角 (`rounded-none` 或 `rounded-md`) |
| **交互** | hover 时阴影偏移变化，active 时阴影消失 + 微位移 |
| **色彩** | 高对比度，鲜艳的强调色 (primary/success/warning/destructive) |
| **动效** | 尊重 `prefers-reduced-motion`，提供降级方案 |

---

## 七、国际化策略

所有新增组件的文案必须支持国际化。

**复用现有系统**：

- 使用项目已有的 `useLocale()` composable 和 `t()` 函数
- 默认文案语言：简体中文（与项目现有组件一致）

**文案管理规范**：

| 类型 | 示例 | 处理方式 |
| --- | --- | --- |
| Placeholder | "请选择"、"请输入" | 通过 `t('select.placeholder')` 获取 |
| 按钮文字 | "确认"、"取消"、"上移" | 通过 `t('button.confirm')` 获取 |
| 提示信息 | "上传失败"、"没有更多数据" | 通过 `t('upload.error')` 获取 |
| 状态文案 | "加载中..."、"已完成" | 通过 `t('status.loading')` 获取 |

**覆盖机制**：

- 所有文案相关 Props 支持直接传入字符串覆盖
- 示例：`<Pagination :prev-text="'上一页'" />`

---

## 八、测试策略

每个 Phase 的完成标准必须包含测试要求。

### 单元测试

| 覆盖率目标 | 说明 |
| --- | --- |
| 语句覆盖率 | ≥ 80% |
| 分支覆盖率 | ≥ 75% |
| 函数覆盖率 | ≥ 85% |

### 必须测试场景

| 场景类型 | 说明 |
| --- | --- |
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
| --- | --- | --- | --- |
| reka-ui 版本兼容 | 🟡 中 | Select 多选依赖 Listbox，需确认 reka-ui 版本支持 | 升级前进行兼容性测试 |
| 虚拟滚动性能 | 🟡 中 | DataTable 虚拟滚动 + 固定列 + 合并单元格的组合可能产生边界问题 | 复杂场景下禁用虚拟滚动 |
| Upload 安全性 | 🔴 高 | 缺少文件类型校验、大小限制、恶意文件防护 | 增加 `accept`、`maxSize` Props 和服务端校验 |
| 无障碍合规 | 🟡 中 | 新增组件需要确保 WCAG 2.1 AA 级别合规 | 使用 axe-core 自动化测试 |
| 破坏性变更 | 🟡 中 | 组件深化可能影响现有 API | 保持向兼容，使用 deprecated 标记旧 API |

---

## 十、术语表

| 术语 | 说明 |
| --- | --- |
| Neo-Brutalism | 项目采用的设计风格，特征为粗边框、硬阴影、高对比度 |
| reka-ui | 项目使用的 Vue 3 组件原语库 |
| vee-validate | 项目使用的表单验证库 |
| Lucide | 项目使用的图标库 |
| Floating UI | 推荐引入的弹出层定位库 |
