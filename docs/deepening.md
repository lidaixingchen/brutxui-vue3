# BrutxUI 组件深化与拓展方案 v2.0

> 参考 Element Plus 组件库，系统性提出深化和拓展项目已有组件的方案。
>
> 版本：v2.0 | 最后更新：2026-07-03

---

## 一、当前状态总结

### 1.1 已完成的深化工作

原方案中绝大多数深化工作均已 **100% 完成**，包含：**Input, Select (含一体化与分组), Form, Pagination, DataTable (含列筛选与虚拟滚动), Dialog, Descriptions, Popconfirm, InfiniteScroll, Toast (含合并计数)**。

仅剩以下项尚未彻底完成：
- **Upload**：完成度 95%（已支持 fileList, limit, multiple, accept, maxSize, maxRetries, beforeUpload, beforeRemove, httpRequest, listType, autoUpload, drag, onError）。

### 1.2 Element Plus 组件覆盖分析

| 分类 | 已覆盖组件 | 缺失组件 |
|---|---|---|
| **基础组件** | Button, Link (a), Separator | Icon, Typography, Space, Layout, Row/Col, Container |
| **表单组件** | Input, InputNumber, Select, Switch, Slider, DatePicker, Upload, ColorPicker, Form, Cascader, Rate, Transfer | |
| **数据展示** | Table (DataTable), Tag (TagsInput), Progress, Tree (TreeView), Pagination, Badge, Avatar, Skeleton, Empty, Descriptions | Result, Statistic, Image |
| **导航组件** | Breadcrumb, Dropdown (DropdownMenu), Steps (Stepper), Tabs, Menu | |
| **反馈组件** | Dialog, Drawer (Sheet), Alert, Popconfirm, Tooltip, Popover | MessageBox, Loading (局部), Notification |
| **其他组件** | Divider (Separator), Calendar, InfiniteScroll | Backtop, Watermark, Tour |

---

## 二、深化方案（仅保留未完成部分）

### P2 — Tree 组件增强

#### 2.1 Tree 拖拽功能

**新增 Props**：

| Prop | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `draggable` | `boolean` | `false` | 是否可拖拽 |
| `allowDrop` | `(draggingNode: TreeNode, dropNode: TreeNode, type: 'before' \| 'after' \| 'inner') => boolean` | — | 是否允许放置 |
| `allowDrag` | `(node: TreeNode) => boolean` | — | 是否允许拖拽 |

**新增 Events**：

| Event | 参数 | 说明 |
|---|---|---|
| `node-drag-start` | `{ node: TreeNode, event: DragEvent }` | 开始拖拽时触发 |
| `node-drag-enter` | `{ draggingNode: TreeNode, dropNode: TreeNode, event: DragEvent }` | 拖拽进入时触发 |
| `node-drag-leave` | `{ draggingNode: TreeNode, dropNode: TreeNode, event: DragEvent }` | 拖拽离开时触发 |
| `node-drag-over` | `{ draggingNode: TreeNode, dropNode: TreeNode, event: DragEvent }` | 拖拽悬停时触发 |
| `node-drag-end` | `{ draggingNode: TreeNode, dropNode: TreeNode, dropType: 'before' \| 'after' \| 'inner', event: DragEvent }` | 拖拽结束时触发 |
| `node-drop` | `{ draggingNode: TreeNode, dropNode: TreeNode, dropType: 'before' \| 'after' \| 'inner', event: DragEvent }` | 放置时触发 |

---

#### 2.2 Tree 懒加载

**新增 Props**：

| Prop | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `lazy` | `boolean` | `false` | 是否懒加载子节点 |
| `load` | `(node: TreeNode) => Promise<TreeNode[]>` | — | 加载子节点数据的方法 |

**实现方案**：

- **TreeNode 接口定义扩展**：在 `types.ts` 中为 `TreeNode` 补充扩展属性，声明 `isLeaf?: boolean`（标记叶子节点以防止展开箭头误渲染）、`loaded?: boolean`（缓存标识字段）以及 `loading?: boolean`（用于局部 Spinner 渲染状态跟踪）。
- 节点展开时若未加载则调用 `load` 方法获取子节点。
- 加载中显示 Spinner 组件，加载完成后将子节点插入并置 `loaded = true`。
- **防重复请求与竞态条件防范**：内部必须维护一个 `loadingKeys` Set 结构。在某个节点的 `load` Promise 尚未 resolve 之前，拦截并拒绝该 Key 上的所有后续重复 load 请求。
- 加载失败时显示重试按钮，支持 `retryOnError` prop。
- 已加载的节点缓存子节点数据，再次展开时不再请求。同时在实例中暴露 `reloadNode(nodeKey: string)` 的方法，允许开发者手动清理缓存并将对应节点的 `loaded` 置为 `false`，以重新懒加载。

---

#### 2.3 Tree 过滤

**新增 Props**：

| Prop | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `filterable` | `boolean` | `false` | 是否可过滤 |
| `filterMethod` | `(value: string, node: TreeNode) => boolean` | — | 自定义过滤方法 |

**实现方案**：

- 提供 `filter(query: string)` 方法（需要在 Expose 属性中声明）
- 默认过滤逻辑：节点 label 包含查询字符串
- 过滤时自动展开匹配节点的父节点

---

### P4 — Calendar 增强

#### 2.4 Calendar 事件标记

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

## 三、新增组件方案（仅保留未完成部分）

### 3.1 Image 图片组件（P2）

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
- **预览挂载与 SSR 兼容**：使用 `reka-ui` 的 `DialogPortal` 原语，或 Vue 的 `<Teleport to="body" :disabled="!isMounted">`（配合 `onMounted` 切换 `isMounted` 状态），确保服务端渲染时不会将预览器 DOM 输出，实现水合（Hydration）安全性。
- 预览支持缩放、旋转、左右切换
- **键盘交互与 A11y 规范**：支持键盘 `ArrowLeft` 和 `ArrowRight` 切换图片，`Escape` 键关闭预览，且在预览器激活期间实施焦点捕获（Focus Trap）。
- 错误时显示 fallback 图片或默认占位符

---

### 3.2 Statistic 统计数值组件（P2）

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

### 3.3 Result 结果展示组件（P2）

**用途**：展示操作结果，如成功、失败、警告。

**核心 Props**：

```typescript
interface ResultProps {
  icon?: 'success' | 'warning' | 'info' | 'error'
  title?: string
  subtitle?: string
}
```

**Slots**：

| Slot | 说明 |
|---|---|
| `icon` | 自定义图标 |
| `title` | 自定义标题 |
| `subtitle` | 自定义副标题 |
| `extra` | 操作区 |

---

### 3.4 Tour 导览组件（P2）

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
- **Neo-Brutalism 遮罩与高亮**：不使用普通的软虚影遮罩，而使用 Canvas 在被聚焦元素周围裁剪出带 **2px 粗黑边框**的硬边界聚焦高亮区。
- **视口滚动定位计算**：如高亮目标在局部滚动区域中，需使用 `scrollIntoView` 定位。定位计算必须放在 `nextTick` 并且在滚动动效结束后执行，以防动效位移造成定位偏差。
- 支持键盘导航（Escape 关闭，Enter 下一步）

---

### 3.5 Watermark 水印组件（P2）

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
- **防篡改机制与死循环防范**：使用 MutationObserver 监控水印容器节点的 `style`、`class` 属性和子节点移除（`childList: true`）。在触发重绘或属性更新逻辑前，必须调用 `observer.disconnect()` 暂时禁用监听，DOM 更新完毕后再重新 observe，以防陷入“重绘 - 修改 style - 重绘”的无限循环。

---

### 3.6 Backtop 回到顶部组件（P2）

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

## 四、组件架构改进（仅保留未完成部分）

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
- **SSR 兼容隔离**：指令内部必须严格使用 `isClient` 确保在 Node.js (VitePress/SSR) 环境中不直接访问/操作 DOM 引起构建报错。在服务端仅注册为空的 fallback 操作，避免 Hydration Mismatch。
- 在指令的 `mounted` 与 `updated` 钩子中，动态在宿主元素内部生成遮罩和 Spinner 并实施渲染。
- **自动定位与还原**：指令挂载时将自动检测宿主 DOM 的 CSS 计算定位。如果其值为 `static`，则指令会自动向宿主追加一个特定的定位 CSS Class（例如 `relative!` 或修改 `style.position`）以防遮罩层溢出。在指令卸载（`unmounted`）时必须完整恢复宿主原 position，避免影响原先的 Flex 或 Grid 布局。
- **插件注册**：该指令应作为 UI 库插件（Plugin）的一部分，在 `packages/ui/src/index.ts` 中进行全局注册和统一导出。

---

### 4.2 统一的函数式调用 API

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

**架构设计要点 (App Context 继承 & SSR)**：
- **App Context 继承机制**：由于通过 `render(createVNode(Component), container)` 独立渲染挂载的组件（如 `useDialog`, `useMessageBox`）会脱离 Vue 主应用树，从而导致其无法通过 `inject` 获取主应用中 provide 的 Locale 状态和 Pinia。为解决此问题，必须在库入口插件安装函数（`install` 方法）中拦截并保存 Vue 应用的全局 context（`app._context`），并在函数式挂载时将其赋值给 VNode 的 `appContext`（`vnode.appContext = globalAppContext`），使其完美继承全局上下文，同时允许在方法传参中接受指定的组件上下文。
- **客户端环境检测**：所有函数式方法及 Composable 内部必须带有 `isClient` 环境检测，防止在服务端渲染 (VitePress Build) 期间实例化时直接使用 `document`/`window` 导致构建崩溃。
- **资源回收机制 (Garbage Collection)**：所有动态挂载的命令式组件在关闭 Transition 动画结束后，必须自动执行 `render(null, container)` 和 `container.remove()` 彻底清理宿主元素，防止 DOM 和组件实例泄露。

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

- 提取 `useKeyboardNavigation` composable。
- 使用 `aria-*` 属性标记可访问状态，如 `aria-expanded`、`aria-haspopup` 和 `aria-controls` 等。
- 遵循 WAI-ARIA 设计模式（如 Combobox、Listbox、Menu），且弹出层内强制使用 Focus Trap 焦点捕获（建议采用 `reka-ui` 的 `FocusScope` 原语）。
- **聚焦样式（Focus Rings）规范**：为了匹配 Neo-Brutalism 的高对比度特色，当元素被聚焦时必须有统一且醒目的视觉指示。应避免使用隐蔽的默认聚焦边框。由于项目使用 Tailwind CSS 4.3+，建议统一使用以下聚焦环样式：`focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brutal-black focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-white dark:focus-visible:ring-offset-brutal-black`。

---

## 五、实施路线图

```text
Phase 1 (核心功能增强) ————— [✅ 已完成] (Select 检索、DataTable 筛选、Toast 合并)
Phase 2 (新增基础组件) ————— [✅ 已完成] (Transfer、Cascader、Rate、Menu)
Phase 3 (新增展示组件) ————— [ ] (Image、Statistic、Result、Watermark)
Phase 4 (高级功能) ————————— [ ] (Tree 拖拽/懒加载/过滤、DataTable 虚拟滚动、Tour、Backtop、Loading 局部)
Phase 5 (架构优化) ————————— [ ] (函数式 Composable 封装、统一键盘导航、无障碍测试)
```

> [!IMPORTANT]
> **注册表登记规范**：所有新开发及重构的组件在开发完成并通过测试后，**必须在 `packages/shared/src/components.ts` 的 `COMPONENTS` 中登记元数据**，并运行 `pnpm --filter brutx-ui-vue prebuild:scan` 生成组件清单，以确保 `pnpm build` 能正确编译出组件的 JSON 注册表数据。

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
| ... 现有指标 | ... |
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

## 十、文档与知识库更新规范

每个 Phase（阶段）的功能开发与测试实施完毕后，必须同步执行以下文档与知识库更新工作，以确保文档与代码库的同步：

1. **VitePress 文档网站更新**：
   - 同步更新 `apps/docs/` 目录下相关组件的使用指南、交互 Demo、组件效果说明及完整的 API 列表（Props / Events / Slots / Expose）。
   - 新建组件必须在 `apps/docs/` 中建立相应的 Markdown 文档，并在 VitePress 的侧边栏配置文件中进行登记。
2. **知识库与 Custom Skills 更新**：
   - 同步更新组件库专有的 `skills/brutxui/references/` 目录下的组件参考规约、设计约定及代码最佳实践。
   - 确保未来 AI 编码助手在加载 `skills/brutxui` 时能保持上下文信息的最新性。

---

## 十一、术语表

| 术语 | 说明 |
|---|---|
| Neo-Brutalism | 项目采用的设计风格，特征为粗边框、硬阴影、高对比度 |
| reka-ui | 项目使用的 Vue 3 组件原语库 |
| vee-validate | 项目使用的表单验证库 |
| Lucide | 项目使用的图标库 |
| Tailwind CSS | 项目使用的 CSS 工具类框架 |
