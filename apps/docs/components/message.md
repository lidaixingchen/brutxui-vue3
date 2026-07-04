---
title: Message 消息提示
description: 函数式消息提示 API，覆盖 useMessage、useDialog、useMessageBox 三种调用方式。
---

# Message 消息提示

新粗野主义风格的函数式消息提示系统，提供 `useMessage`（轻量通知）、`useDialog`（模态对话框）和 `useMessageBox`（确认/输入框）三种 API。所有 API 均采用单例模式按需挂载，无需在模板中声明组件，调用即显示。

## 预览

<ComponentPreview>
  <MessageDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="message" />

## 用法

### useMessage 基础用法

通过 `info`、`success`、`warning`、`error` 四个快捷方法显示不同类型的消息提示。

```vue
<script setup>
import { useMessage } from 'brutx-ui-vue'

const { info, success, warning, error } = useMessage()
</script>

<template>
    <button @click="info('提示', '这是一条信息提示')">信息</button>
    <button @click="success('成功', '操作已成功完成')">成功</button>
    <button @click="warning('警告', '请注意检查输入内容')">警告</button>
    <button @click="error('错误', '操作失败，请重试')">错误</button>
</template>
```

### useMessage 自定义配置

使用 `show` 方法传入完整配置项，自定义持续时间、是否显示关闭按钮等。

```vue
<script setup>
import { useMessage } from 'brutx-ui-vue'

const { show } = useMessage()

function showCustom() {
    show({
        type: 'warning',
        title: '会话即将过期',
        description: '您的登录会话将在 5 分钟后失效，请及时保存工作。',
        duration: 8000,
        closable: true,
    })
}

function showPersistent() {
    show({
        type: 'error',
        title: '网络连接已断开',
        description: '请检查您的网络设置后重试。',
        duration: 0,
    })
}
</script>

<template>
    <button @click="showCustom">自定义时长（8 秒）</button>
    <button @click="showPersistent">不自动关闭</button>
</template>
```

### useMessage 手动关闭

每个方法均返回一个 `close` 函数，调用即可手动关闭对应消息。

```vue
<script setup>
import { useMessage } from 'brutx-ui-vue'
import { ref } from 'vue'

const { info } = useMessage()
const closeFn = ref(null)

function open() {
    closeFn.value = info('加载中', '正在处理请求，请稍候...')
}

function close() {
    closeFn.value?.()
}
</script>

<template>
    <button @click="open">打开消息</button>
    <button @click="close">手动关闭</button>
</template>
```

### useDialog 函数式对话框

通过 `useDialog` 以编程方式打开模态对话框，无需在模板中声明 `Dialog` 组件。

```vue
<script setup>
import { useDialog } from 'brutx-ui-vue'

const { show } = useDialog()

async function openDialog() {
    const { close, promise } = show({
        title: '用户协议',
        content: '请阅读并同意以下条款...',
        draggable: true,
    })

    await promise
    console.log('对话框已关闭')
}
</script>

<template>
    <button @click="openDialog">打开对话框</button>
</template>
```

### useMessageBox 确认框

通过 `useMessageBox` 显示确认对话框，支持取消按钮和自定义按钮文本。

```vue
<script setup>
import { useMessageBox } from 'brutx-ui-vue'

const { show } = useMessageBox()

async function confirmDelete() {
    try {
        const { close, promise } = show({
            title: '确认删除',
            message: '此操作不可撤销，确定要继续吗？',
            type: 'warning',
            showCancelButton: true,
            cancelButtonText: '取消',
            confirmButtonText: '确认删除',
        })

        await promise
        console.log('用户已确认')
    } catch (reason) {
        console.log('用户取消:', reason)
    }
}
</script>

<template>
    <button @click="confirmDelete">删除</button>
</template>
```

### useMessageBox 带输入验证

启用 `showInput` 显示输入框，配合 `inputPattern` 进行正则验证。

```vue
<script setup>
import { useMessageBox } from 'brutx-ui-vue'

const { show } = useMessageBox()

async function promptEmail() {
    try {
        const { close, promise } = show({
            title: '输入邮箱',
            message: '请输入您的邮箱地址以接收通知。',
            showInput: true,
            inputPlaceholder: 'example@domain.com',
            inputPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            inputErrorMessage: '请输入有效的邮箱地址',
            showCancelButton: true,
        })

        const result = await promise
        console.log('邮箱:', result.value)
    } catch (reason) {
        console.log('用户取消:', reason)
    }
}
</script>

<template>
    <button @click="promptEmail">输入邮箱</button>
</template>
```

## 数据类型

### MessageType

```ts
type MessageType = 'info' | 'success' | 'warning' | 'error'
```

### MessageOptions

```ts
interface MessageOptions {
    type?: 'info' | 'success' | 'warning' | 'error'
    title?: string
    description?: string
    duration?: number
    closable?: boolean
}
```

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'` | 消息类型 |
| `title` | `string` | `''` | 标题文本 |
| `description` | `string` | — | 描述文本 |
| `duration` | `number` | `3000` | 自动关闭时长（毫秒），设为 `0` 不自动关闭 |
| `closable` | `boolean` | `true` | 是否显示关闭按钮 |

### MessageItem

```ts
interface MessageItem {
    id: string
    type: MessageType
    title: string
    description?: string
    duration: number
    closable: boolean
}
```

### ShowDialogOptions

```ts
type RenderableContent = string | Component | VNode | (() => string | Component | VNode | null)

interface ShowDialogOptions {
    title?: string
    content?: RenderableContent
    footer?: RenderableContent
    draggable?: boolean
    dragHandle?: string | HTMLElement
    bounds?: 'parent' | 'viewport' | { top: number; left: number; right: number; bottom: number }
    initialPosition?: { x: number; y: number }
    resizable?: boolean
    minWidth?: number
    minHeight?: number
    maxWidth?: number
    maxHeight?: number
    aspectRatio?: number
    showCloseButton?: boolean
    forceMount?: boolean
    fullscreen?: boolean
    beforeClose?: ((done: () => void) => void) | (() => boolean | Promise<boolean>)
    destroyOnClose?: boolean
    zIndex?: number
    class?: string
}
```

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | — | 对话框标题 |
| `content` | `RenderableContent` | — | 对话框内容，支持字符串、组件、VNode 或渲染函数 |
| `footer` | `RenderableContent` | — | 底部内容 |
| `draggable` | `boolean` | `false` | 是否可拖拽 |
| `dragHandle` | `string \| HTMLElement` | — | 拖拽手柄（CSS 选择器或元素） |
| `bounds` | `'parent' \| 'viewport' \| object` | `'viewport'` | 拖拽边界 |
| `initialPosition` | `{ x: number; y: number }` | — | 初始位置 |
| `resizable` | `boolean` | `false` | 是否可调整大小 |
| `minWidth` | `number` | — | 最小宽度 |
| `minHeight` | `number` | — | 最小高度 |
| `maxWidth` | `number` | — | 最大宽度 |
| `maxHeight` | `number` | — | 最大高度 |
| `aspectRatio` | `number` | — | 宽高比锁定 |
| `showCloseButton` | `boolean` | `true` | 是否显示关闭按钮 |
| `forceMount` | `boolean` | — | 强制渲染 |
| `fullscreen` | `boolean` | `false` | 全屏模式 |
| `beforeClose` | `((done) => void) \| (() => boolean \| Promise<boolean>)` | — | 关闭前钩子 |
| `destroyOnClose` | `boolean` | `false` | 关闭后销毁内容 |
| `zIndex` | `number` | — | 自定义层级 |
| `class` | `string` | — | 自定义样式类 |

### MessageBoxOptions

```ts
interface MessageBoxOptions extends ShowDialogOptions {
    message?: string
    type?: 'info' | 'success' | 'warning' | 'error'
    showCancelButton?: boolean
    cancelButtonText?: string
    confirmButtonText?: string
    confirmButtonClass?: string
    cancelButtonClass?: string
    showInput?: boolean
    inputPlaceholder?: string
    inputValue?: string
    inputPattern?: RegExp
    inputErrorMessage?: string
}
```

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `message` | `string` | — | 提示消息文本 |
| `type` | `'info' \| 'success' \| 'warning' \| 'error'` | — | 消息类型 |
| `showCancelButton` | `boolean` | `false` | 是否显示取消按钮 |
| `cancelButtonText` | `string` | `'取消'` / `'Cancel'` | 取消按钮文本（根据语言自动切换） |
| `confirmButtonText` | `string` | `'确定'` / `'Confirm'` | 确认按钮文本（根据语言自动切换） |
| `confirmButtonClass` | `string` | — | 确认按钮自定义样式类 |
| `cancelButtonClass` | `string` | — | 取消按钮自定义样式类 |
| `showInput` | `boolean` | `false` | 是否显示输入框 |
| `inputPlaceholder` | `string` | — | 输入框占位文本 |
| `inputValue` | `string` | `''` | 输入框初始值 |
| `inputPattern` | `RegExp` | — | 输入验证正则 |
| `inputErrorMessage` | `string` | `'输入格式不正确'` | 验证失败提示文本 |

## 组合式函数

### useMessage

```ts
import { useMessage } from 'brutx-ui-vue'

const {
    info,      // (title: string, description?: string) => () => void
    success,   // (title: string, description?: string) => () => void
    warning,   // (title: string, description?: string) => () => void
    error,     // (title: string, description?: string) => () => void
    show,      // (options: MessageOptions) => () => void
} = useMessage()
```

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `info` | `(title: string, description?: string)` | `() => void` | 显示信息提示，返回关闭函数 |
| `success` | `(title: string, description?: string)` | `() => void` | 显示成功提示，返回关闭函数 |
| `warning` | `(title: string, description?: string)` | `() => void` | 显示警告提示，返回关闭函数 |
| `error` | `(title: string, description?: string)` | `() => void` | 显示错误提示，返回关闭函数 |
| `show` | `(options: MessageOptions)` | `() => void` | 自定义提示，返回关闭函数 |

核心特性：
- **单例模式**：首次调用自动挂载 `MessageContainer` 到 `body`，无需手动声明
- **堆叠动画**：多条消息通过 `TransitionGroup` 垂直堆叠，自动排列
- **自动关闭**：默认 3 秒后自动关闭，可通过 `duration` 自定义，设为 `0` 禁用
- **手动关闭**：每个方法返回 `close` 函数，调用即可立即关闭该条消息
- **自动卸载**：全部消息关闭后 500ms 自动卸载容器 DOM，确保完美垃圾回收
- **SSR 安全**：内部使用 `isClient` 守卫，服务端渲染环境不会报错

### useDialog

```ts
import { useDialog } from 'brutx-ui-vue'

const {
    show,      // (options?: ShowDialogOptions) => { close: () => void; promise: Promise<void> }
} = useDialog()
```

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `show` | `(options?: ShowDialogOptions)` | `{ close, promise }` | 打开对话框 |

返回值说明：

| 属性 | 类型 | 说明 |
|------|------|------|
| `close` | `() => void` | 手动关闭对话框 |
| `promise` | `Promise<void>` | 对话框关闭时 resolve |

### useMessageBox

```ts
import { useMessageBox } from 'brutx-ui-vue'

const {
    show,      // (options?: MessageBoxOptions) => { close: () => void; promise: Promise<{ value: string } | undefined> }
} = useMessageBox()
```

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `show` | `(options?: MessageBoxOptions)` | `{ close, promise }` | 打开确认/输入框 |

返回值说明：

| 属性 | 类型 | 说明 |
|------|------|------|
| `close` | `() => void` | 手动关闭消息框 |
| `promise` | `Promise<{ value: string } \| undefined>` | 确认时 resolve（无输入框为 `undefined`，有输入框为 `{ value }`）；取消时 reject `'cancel'`，关闭时 reject `'close'` |

## 可访问性

- **键盘操作**：对话框支持 `Escape` 关闭
- **ARIA 属性**：消息提示使用 `role="status"` 和 `aria-live="polite"` 通知屏幕阅读器；关闭按钮包含国际化 `aria-label`，支持屏幕阅读器朗读
- **焦点管理**：`useDialog` 和 `useMessageBox` 基于 reka-ui 的 `DialogRoot`，打开时锁定焦点、关闭时恢复焦点
- **动效降级**：尊重 `prefers-reduced-motion` 系统设置，自动简化过渡动画

## 常见问题

**Q: useMessage 和 useToast 有什么区别？**

A: `useMessage` 是轻量级的顶部消息提示，固定在页面顶部居中显示，适合简短的操作反馈；`useToast` 功能更丰富，支持多种位置、堆叠配置、Promise 追踪和悬停暂停等特性，适合复杂的通知场景。

**Q: 消息提示在 SSR 环境下会报错吗？**

A: 不会。`useMessage` 内部使用 `isClient` 守卫，在服务端渲染环境下调用不会产生副作用，也不会抛出错误。

**Q: 如何在对话框关闭前进行异步校验？**

A: 使用 `beforeClose` 钩子，支持回调模式和 Promise 模式：

```vue
<script setup>
import { useDialog } from 'brutx-ui-vue'

const { show } = useDialog()

function openWithValidation() {
    show({
        title: '编辑资料',
        content: '表单内容...',
        beforeClose: async () => {
            const isValid = await validateForm()
            return isValid
        },
    })
}
</script>
```

**Q: useMessageBox 的 promise 什么时候会 reject？**

A: 两种情况会 reject：用户点击取消按钮时 reject 值为 `'cancel'`；用户通过关闭按钮或点击遮罩层关闭时 reject 值为 `'close'`。建议使用 `try/catch` 捕获并区分关闭原因。
