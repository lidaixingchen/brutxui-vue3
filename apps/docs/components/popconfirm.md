---
title: Popconfirm 气泡确认框
description: 轻量级的确认气泡弹窗，用于确认操作。
---

# Popconfirm 气泡确认框

轻量级的确认气泡弹窗，点击触发元素后弹出。比 Dialog 更适合简单的确认/取消操作。

## 安装

<InstallationTabs componentName="popconfirm" />

## 用法

```vue
<script setup>
import { Popconfirm, Button } from 'brutx-ui-vue'

function handleConfirm() {
    console.log('已确认!')
}

function handleCancel() {
    console.log('已取消!')
}
</script>

<template>
    <Popconfirm
        title="确定要删除此项吗？"
        @confirm="handleConfirm"
        @cancel="handleCancel"
    >
        <Button variant="destructive">删除</Button>
    </Popconfirm>
</template>
```

### 自定义按钮文字

```vue
<script setup>
import { Popconfirm, Button } from 'brutx-ui-vue'
</script>

<template>
    <Popconfirm
        title="提交此表单？"
        confirm-button-text="是，提交"
        cancel-button-text="不，返回"
        confirm-button-type="primary"
    >
        <Button>提交</Button>
    </Popconfirm>
</template>
```

### 危险操作

```vue
<script setup>
import { Popconfirm, Button } from 'brutx-ui-vue'
</script>

<template>
    <Popconfirm
        title="此操作不可撤销。"
        confirm-button-type="destructive"
        :cancelable="false"
    >
        <Button variant="destructive">删除账户</Button>
    </Popconfirm>
</template>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | —（必填） | 确认标题文本 |
| `confirmButtonText` | `string` | locale: `popconfirm.confirm` | 确认按钮文字 |
| `cancelButtonText` | `string` | locale: `popconfirm.cancel` | 取消按钮文字 |
| `confirmButtonType` | `'primary' \| 'destructive'` | `'primary'` | 确认按钮样式 |
| `icon` | `Component` | `TriangleAlert` | 警告图标组件 |
| `cancelable` | `boolean` | `true` | 是否显示取消按钮 |
| `class` | `string` | — | 自定义 CSS 类 |

## 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `confirm` | — | 点击确认按钮时触发 |
| `cancel` | — | 点击取消按钮时触发 |

## 插槽

| 插槽 | 说明 |
| --- | --- |
| `default` | 触发元素 |
| `icon` | 自定义图标 |
| `description` | 标题下方的描述文本 |

## 可访问性

- 基于 `Popover` 构建，遵循 WAI-ARIA 对话框模式
- **键盘操作**：`Escape` 关闭，`Tab` 在按钮间导航
- **焦点管理**：弹窗打开时焦点锁定在内部
- **ARIA 属性**：按钮有正确的标签
