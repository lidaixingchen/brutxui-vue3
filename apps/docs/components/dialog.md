---
title: Dialog 对话框
description: 模态对话框，支持焦点锁定、无障碍角色标记，硬边缘遮罩设计。
---

# Dialog 对话框

新粗野主义风格的模态对话框，基于 reka-ui 的 Dialog 原语构建。支持遮罩层、关闭按钮和可组合的子组件。

## 预览

<ComponentPreview>
  <DialogDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="dialog" />

## 用法

```vue
<script setup>
import { DialogRoot as Dialog, DialogTrigger, DialogClose } from 'reka-ui'
import { DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from 'brutx-ui-vue'
import { Button } from 'brutx-ui-vue'
</script>

<template>
    <Dialog>
        <DialogTrigger as-child>
            <Button variant="primary">Open Dialog</Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogDescription>
                    Make changes to your profile here. Click save when you're done.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <DialogClose as-child>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button variant="primary">Save</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
```

## 尺寸

通过 `DialogContent` 的 `size` 属性控制对话框的最大宽度。默认值为 `default`（`max-w-lg`）。

| 尺寸 | 最大宽度 | 适用场景 |
|------|----------|----------|
| `sm` | `max-w-sm` | 确认框、简单提示 |
| `default` | `max-w-lg` | 标准表单、常规内容 |
| `lg` | `max-w-2xl` | 多列表单、详细设置 |
| `xl` | `max-w-4xl` | 复杂内容、数据展示 |
| `full` | `max-w-[calc(100vw-2rem)]` | 大幅内容、全屏式交互 |

```vue
<script setup>
import { DialogRoot as Dialog, DialogTrigger } from 'reka-ui'
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from 'brutx-ui-vue'
import { Button } from 'brutx-ui-vue'
</script>

<template>
    <Dialog>
        <DialogTrigger as-child>
            <Button variant="primary">打开小型对话框</Button>
        </DialogTrigger>
        <DialogContent size="sm">
            <DialogHeader>
                <DialogTitle>确认删除</DialogTitle>
                <DialogDescription>此操作不可撤销，确定要继续吗？</DialogDescription>
            </DialogHeader>
        </DialogContent>
    </Dialog>
</template>
```

## 子组件

| 组件 | 说明 |
|------|------|
| `Dialog` | 根组件（需从 reka-ui 导入：`import { DialogRoot as Dialog } from 'reka-ui'`） |
| `DialogTrigger` | 打开对话框的按钮（需从 reka-ui 导入：`import { DialogTrigger } from 'reka-ui'`） |
| `DialogContent` | 带遮罩层的对话框内容面板 |
| `DialogHeader` | 头部容器 |
| `DialogFooter` | 底部容器，弹性布局 |
| `DialogTitle` | 对话框标题 |
| `DialogDescription` | 对话框描述文本 |
| `DialogClose` | 关闭按钮（需从 reka-ui 导入：`import { DialogClose } from 'reka-ui'`） |
| `DialogOverlay` | 背景遮罩层 |
| `DialogPortal` | 传送门容器（需从 reka-ui 导入：`import { DialogPortal } from 'reka-ui'`） |
| `DialogEnhanced` | 支持可拖拽和可调整大小的增强版对话框 |

### DialogEnhanced 用法

支持可拖拽和可调整大小的增强版对话框：

```vue
<script setup>
import { DialogRoot as Dialog, DialogTrigger } from 'reka-ui'
import { DialogEnhanced, DialogHeader, DialogTitle } from 'brutx-ui-vue'
</script>

<template>
    <Dialog>
        <DialogTrigger>打开可拖拽对话框</DialogTrigger>
        <DialogEnhanced
            draggable
            resizable
            :min-width="300"
            :min-height="200"
            drag-handle=".dialog-header"
        >
            <DialogHeader class="dialog-header">
                <DialogTitle>可拖拽对话框</DialogTitle>
            </DialogHeader>
            <p>拖拽标题栏移动，拖拽边缘调整大小</p>
        </DialogEnhanced>
    </Dialog>
</template>
```

## Props

### Dialog（根组件）

从 reka-ui 的 `DialogRoot` 重新导出，管理对话框的打开/关闭状态。

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `open` | `boolean` | — | 受控的打开状态 |
| `defaultOpen` | `boolean` | `false` | 非受控模式下的默认打开状态 |
| `modal` | `boolean` | `true` | 是否为模态对话框 |

### DialogTrigger

从 reka-ui 重新导出的触发按钮。

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `asChild` | `boolean` | — | 是否将渲染委托给子元素 |
| `as` | `string` | `'button'` | 渲染的 HTML 元素 |

### DialogContent

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `showCloseButton` | `boolean` | `true` | 是否显示关闭按钮 |
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl' \| 'full'` | `'default'` | 对话框尺寸 |
| `forceMount` | `boolean` | — | 强制渲染（用于动画控制） |
| `class` | `string` | — | 自定义样式类 |

### DialogClose

从 reka-ui 重新导出的关闭按钮。

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `asChild` | `boolean` | — | 是否将渲染委托给子元素 |
| `as` | `string` | `'button'` | 渲染的 HTML 元素 |

### DialogEnhanced

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `draggable` | `boolean` | `false` | 是否可拖拽 |
| `dragHandle` | `string \| HTMLElement` | — | 拖拽手柄（CSS 选择器或元素） |
| `bounds` | `'parent' \| 'viewport' \| { top, left, right, bottom }` | `'viewport'` | 拖拽边界 |
| `initialPosition` | `{ x: number; y: number }` | — | 初始位置 |
| `resizable` | `boolean` | `false` | 是否可调整大小 |
| `minWidth` | `number` | `200` | 最小宽度 |
| `minHeight` | `number` | `150` | 最小高度 |
| `maxWidth` | `number` | — | 最大宽度 |
| `maxHeight` | `number` | — | 最大高度 |
| `aspectRatio` | `number` | — | 宽高比锁定 |
| `showCloseButton` | `boolean` | `true` | 是否显示关闭按钮 |
| `forceMount` | `boolean` | — | 强制渲染 |
| `fullscreen` | `boolean` | `false` | 全屏模式（占满整个视口） |
| `beforeClose` | `((done) => void) \| (() => boolean \| Promise<boolean>)` | — | 关闭前钩子（支持回调模式和 Promise 模式） |
| `destroyOnClose` | `boolean` | `false` | 关闭后销毁内容 |
| `zIndex` | `number` | — | 自定义层级 |
| `class` | `string` | — | 自定义样式类 |

### DialogHeader / DialogFooter / DialogTitle / DialogDescription / DialogOverlay

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `class` | `string` | — | 自定义样式类 |

## 事件

### Dialog

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `update:open` | `(value: boolean)` | 对话框打开状态变化时触发 |

### DialogEnhanced 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `update:open` | `(value: boolean)` | 对话框打开状态变化时触发 |
| `open` | — | 对话框开始打开时触发 |
| `opened` | — | 对话框打开动画完成时触发 |
| `close` | — | 对话框开始关闭时触发 |
| `closed` | — | 对话框关闭动画完成时触发 |

## 插槽

### Dialog

| 插槽 | 作用域 | 说明 |
| --- | --- | --- |
| `default` | `{ open: boolean, close: () => void }` | 默认插槽，提供当前打开状态和关闭方法 |

### DialogContent / DialogHeader / DialogFooter / DialogTitle / DialogDescription / DialogOverlay / DialogEnhanced

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 默认插槽 |

## 可访问性

- **键盘操作**：按 `Escape` 关闭对话框
- **焦点管理**：对话框打开时，焦点被限制在对话框内；关闭时恢复焦点
- **ARIA 属性**：关闭按钮包含屏幕阅读器文本
- **交互元素**：拖拽时自动排除交互元素（Input、Button 等）

## 函数式 API

除了声明式组件，Dialog 还提供命令式调用与 Composable 方式，适合在业务逻辑中快速弹出自定义对话框容器。如需结构化确认框、状态图标或输入提示，请参阅独立的 [MessageBox 消息对话框](./message-box.md)。

### showDialog

调用 `showDialog` 以命令式挂载通用的 Dialog 对话框容器：

```ts
import { showDialog } from 'brutx-ui-vue'

const instance = showDialog({
    title: '系统设置',
    content: '自定义弹层正文内容...',
    size: 'default',
    draggable: true,
    showCloseButton: true,
    onCancel: () => {
        console.log('对话框已关闭')
    },
})

// 手动关闭
// instance.close()
```

**常用参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | — | 对话框标题 |
| `description` | `string` | — | 对话框描述 |
| `content` | `string \| Component \| VNode \| (() => ...)` | — | 自定义正文内容 |
| `footer` | `string \| Component \| VNode \| (() => ...)` | — | 自定义底部插槽内容 |
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl' \| 'full'` | `'default'` | 对话框尺寸 |
| `draggable` | `boolean` | `false` | 是否开启拖拽 |
| `resizable` | `boolean` | `false` | 是否开启缩放 |
| `fullscreen` | `boolean` | `false` | 是否全屏展示 |
| `zIndex` | `number` | — | 自定义弹层层级 |
| `onCancel` | `() => void` | — | 关闭时的回调钩子 |

**返回值：** `OverlayInstanceHandle<void>` — 包含 `close()`、`destroy()` 方法及 `promise` 句柄。

### useDialog（Composable）

在组件中使用 `useDialog` 组合式函数，获得响应式的状态与单例实例管理：

```vue
<script setup>
import { useDialog } from 'brutx-ui-vue'

const { show, close, isOpen } = useDialog()

function showMyDialog() {
    show({
        title: '提示',
        content: '这是一个通过 Composable 打开的自定义对话框',
    })
}
</script>

<template>
    <div class="flex items-center gap-3">
        <button @click="showMyDialog">打开对话框</button>
        <span v-if="isOpen" class="text-sm font-bold text-brutal-accent">对话框开启中</span>
    </div>
</template>
```

> [!TIP]
> `useDialog` 返回的 `isOpen` 属性为 `Readonly<Ref<boolean>>` 只读响应式视图，状态仅由 Composable 内部统一调度。

### useDialogGeometry（空间几何状态控制器）

当需要对自定义弹窗或浮层实现拖拽、缩放与边界约束时，可直接使用底层的 `useDialogGeometry` 纯空间几何状态控制器：

```ts
import { useDialogGeometry } from 'brutx-ui-vue'

const {
    contentRef,
    position,
    size,
    contentStyle,
    isDragging,
    isResizing,
    onDragStart,
    onResizeStart,
} = useDialogGeometry({
    draggable: true,
    resizable: true,
    bounds: 'viewport',
    minWidth: 320,
    minHeight: 240,
})
```

- **纯空间几何职责**：专注管理位置、尺寸、拖拽、缩放、宽高比与视口/父级边界限制，彻底与业务关闭控制流解耦；
- **只读视图契约**：`position` 与 `size` 为只读 Ref，程序化改写请通过 `setPosition` 与 `setSize`。

## 常见问题

**Q: 打开对话框后页面还能滚动怎么办？**

A: 默认情况下 `Dialog` 的 `modal` 属性为 `true`，打开时会锁定背景滚动。如果遇到背景仍可滚动的情况，请确认没有通过 CSS 手动覆盖了 `overflow` 属性，或者检查是否有其他全局样式干扰了对话框的遮罩层行为。

**Q: 如何通过代码控制对话框的打开和关闭？**

A: 使用受控模式：将 `Dialog` 的 `open` 属性绑定到一个 `ref` 变量，然后通过修改该变量来控制对话框状态。也可以监听 `update:open` 事件来响应对话框的关闭操作（如按 Escape 键或点击遮罩层）。

**Q: DialogEnhanced 的拖拽区域不正确，怎样设置拖拽手柄？**

A: 通过 `drag-handle` 属性指定拖拽手柄，可以是 CSS 选择器字符串（如 `".dialog-header"`）或 DOM 元素引用。确保选择器能正确匹配到对话框内的某个元素，只有按住该元素区域才能拖拽。不设置时，默认整个对话框内容区域可拖拽。
