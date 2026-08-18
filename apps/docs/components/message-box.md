---
title: MessageBox 消息对话框
description: 结构化反馈对话框，支持确认提示、状态图标、输入验证与确定性非拒绝 Promise 交互契约。
---

# MessageBox 消息对话框

新粗野主义风格的结构化反馈对话框组件，基于 reka-ui 的 Dialog 原语构建。支持确认弹窗、状态图标、Prompt 输入校验，提供声明式组件、命令式函数（`showMessageBox` / `showConfirm` / `showAlert` / `showPrompt`）与 Composable（`useMessageBox`）三种调用方式。

## 预览

<ComponentPreview>
  <MessageBoxDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="message-box" />

## 用法

### 声明式组件用法

通过 `v-model:open` 控制显示与隐藏：

```vue
<script setup>
import { ref } from 'vue'
import { MessageBox, Button } from 'brutx-ui-vue'

const isOpen = ref(false)

function handleConfirm() {
    console.log('操作已确认')
}
</script>

<template>
    <Button @click="isOpen = true">打开确认对话框</Button>
    <MessageBox
        v-model:open="isOpen"
        title="重要提醒"
        message="该操作将永久同步所有配置，确定继续吗？"
        type="warning"
        @confirm="handleConfirm"
    />
</template>
```

### 命令式便捷函数

无需在模板中放置组件，直接调用函数触发：

```vue
<script setup>
import { showConfirm, showAlert, showPrompt } from 'brutx-ui-vue'

async function handleConfirm() {
    const isConfirmed = await showConfirm('确定要删除选中的项目吗？')
    if (isConfirmed) {
        console.log('已确认删除')
    }
}

async function handleAlert() {
    await showAlert('操作执行成功！')
}

async function handlePrompt() {
    const result = await showPrompt('请输入新的项目名称', {
        inputValue: 'My Project',
        inputPattern: /^[A-Za-z0-9_-]+$/,
        inputErrorMessage: '名称仅支持字母、数字、下划线与中划线',
    })

    if (result.action === 'confirm') {
        console.log('输入内容:', result.value)
    }
}
</script>

<template>
    <div class="flex flex-wrap gap-3">
        <button @click="handleConfirm">确认对话框 (showConfirm)</button>
        <button @click="handleAlert">提示对话框 (showAlert)</button>
        <button @click="handlePrompt">输入提示框 (showPrompt)</button>
    </div>
</template>
```

### 组合式 API (useMessageBox)

在组件内通过 `useMessageBox` 获取响应式的调用方法：

```vue
<script setup>
import { useMessageBox } from 'brutx-ui-vue'

const { confirm, prompt, alert } = useMessageBox()

async function deleteRecord() {
    const confirmed = await confirm('确认删除当前记录？', {
        title: '删除警示',
        confirmButtonText: '确定删除',
        cancelButtonText: '暂不删除',
    })
    if (confirmed) {
        // 执行删除操作
    }
}
</script>

<template>
    <button @click="deleteRecord">删除记录</button>
</template>
```

## 类型变体

支持 4 种类型变体，对应粗黑边框的新粗野主义状态色板：

| 类型 (`type`) | 状态色板 | 适用场景 |
|---------------|----------|----------|
| `info` | `bg-brutal-info text-brutal-info-foreground` | 常规消息通知与一般确认 |
| `success` | `bg-brutal-success text-brutal-success-foreground` | 操作成功完成提示 |
| `warning` | `bg-brutal-accent text-brutal-accent-foreground` | 破坏性或不可撤销操作二次确认（`showConfirm` 默认） |
| `error` | `bg-brutal-destructive text-brutal-destructive-foreground` | 严重异常阻断与错误提示 |

## Prompt 输入框与正则校验

在需要用户输入信息的场景下，开启 `showInput` 并传入 `inputPattern` 正则表达式。当输入不符合正则规则时，点击确认将自动阻断并展示 `inputErrorMessage`：

```vue
<script setup>
import { showPrompt } from 'brutx-ui-vue'

async function renameFile() {
    const result = await showPrompt('请输入新的文件名：', {
        title: '重命名文件',
        inputPlaceholder: '如 index.ts',
        inputPattern: /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/,
        inputErrorMessage: '请输入带合法扩展名的文件名',
    })

    if (result.action === 'confirm') {
        console.log('新文件名:', result.value)
    }
}
</script>
```

## Props

### MessageBox 组件

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `open` | `boolean` | `false` | 是否显示对话框（支持 `v-model:open`） |
| `title` | `string` | `t('messageBox.defaultTitle')` | 对话框标题 |
| `message` | `string` | — | 消息正文文本 |
| `type` | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'` | 状态类型变体 |
| `showCloseButton` | `boolean` | `true` | 是否展示右上角关闭按钮 |
| `showCancelButton` | `boolean` | `true` | 是否展示取消按钮 |
| `confirmButtonText` | `string` | `t('messageBox.confirm')` | 确认按钮文本 |
| `cancelButtonText` | `string` | `t('messageBox.cancel')` | 取消按钮文本 |
| `confirmButtonClass` | `string` | — | 确认按钮自定义类名 |
| `cancelButtonClass` | `string` | — | 取消按钮自定义类名 |
| `showInput` | `boolean` | `false` | 是否展示输入框（Prompt 模式） |
| `inputPlaceholder` | `string` | — | 输入框占位符 |
| `inputValue` | `string` | `''` | 输入框初始值 |
| `inputPattern` | `RegExp` | — | 输入格式校验正则表达式 |
| `inputErrorMessage` | `string` | `t('messageBox.inputError')` | 校验失败错误提示文案 |
| `zIndex` | `number` | — | 自定义弹层层级 |
| `class` | `string` | — | 卡片自定义类名 |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:open` | `(value: boolean)` | 对话框打开/关闭状态变化时触发 |
| `confirm` | `(value?: string)` | 点击确认按钮并通过校验时触发，携带输入框文本 |
| `cancel` | — | 点击取消按钮、右上角关闭、遮罩层或按 ESC 时触发 |

## 可访问性

- **键盘导航**：按 `Escape` 键可快速退出并关闭对话框，在多层弹层叠加时优先分发至活动栈顶层实例。
- **焦点捕获与锁定**：对话框打开时，焦点自动锁定在弹窗内部（优先聚焦确认按钮或 Prompt 输入框），关闭后自动恢复失焦前 DOM 节点的焦点。
- **ARIA 语义**：内置 `role="alertdialog"` / `role="dialog"` 语义角色，支持屏幕阅读器完整朗读标题与正文。
- **高对比度可见性**：严格基于 Neo-Brutalism 3px 高反差黑边框与明晰的主题状态色板，满足 WCAG AAA 级色彩对比度标准。

## 命令式与 Composable API

### showMessageBox(options)

底层命令式入口，基于宿主深模块控制器挂载，返回 `MessageBoxInstance`：

```ts
import { showMessageBox, type MessageBoxResult } from 'brutx-ui-vue'

const { close, promise } = showMessageBox({
    title: '系统通知',
    message: '核心服务已成功升级。',
    type: 'success',
})

const result: MessageBoxResult = await promise
// result.action 取值：'confirm' | 'cancel' | 'destroy'
```

### 确定性非拒绝 Promise 契约

`MessageBox` 函数式 API 的 Promise **恒为兑现状态（Never Rejects）**，避免产生未捕获的 Unhandled Rejection 异常。通过 `result.action` 区分用户的交互终态：

```ts
export type MessageBoxAction = 'confirm' | 'cancel' | 'destroy'

export interface MessageBoxResult {
    /** confirm: 确认按钮; cancel: 取消/ESC/遮罩/关闭; destroy: 手动销毁 */
    action: MessageBoxAction
    /** 输入框确认时的值（Prompt 模式） */
    value?: string
}
```

## 常见问题

**Q: 多个命令式弹窗连续打开时层级会重叠错乱吗？**

A: 不会。底层命令式宿主内建全局活动弹层栈（LIFO），每次挂载新弹层时会自动按步长（`OVERLAY_Z_INDEX_STEP = 10`）向上递增 `z-index`，并自动将 ESC 按键路由分发给顶层弹窗，确保弹层层级与关闭交互始终严格一致。

**Q: 在 SSR / 服务端渲染环境下调用会报错吗？**

A: 不会。所有命令式与 Composable API 均内置 SSR 安全守卫。在非客户端无 DOM 环境下，`showConfirm` 安全返回 `false`，`showPrompt` 返回 `{ action: 'cancel' }`，`showAlert` 立即 resolve，保障服务端代码健壮性。
