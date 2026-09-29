---
title: Popconfirm 气泡确认框
description: 轻量级的确认气泡弹窗，用于确认操作。
---

# Popconfirm 气泡确认框

轻量级的确认气泡弹窗，点击触发元素后弹出。比 Dialog 更适合简单的确认/取消操作。

## 预览

<ComponentPreview>
  <PopconfirmDemo />
</ComponentPreview>

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

## API 参考

<span id="事件"></span>
<span id="插槽"></span>

<ComponentApi name="popconfirm" />

## 可访问性

- 基于 `Popover` 构建，遵循 WAI-ARIA 对话框模式
- **键盘操作**：`Escape` 关闭，`Tab` 在按钮间导航
- **焦点管理**：弹窗打开时焦点锁定在内部
- **ARIA 属性**：按钮有正确的标签
