---
title: Submit Button 提交按钮
description: 提交按钮，自带防重复提交逻辑与加载中状态切换。
---

# Submit Button 提交按钮

新粗野主义风格提交按钮，内置加载和等待状态，专为表单提交设计。渲染为 `<button type="submit">`，支持防重复点击与国际化等待文本。

## 预览

<ComponentPreview>
  <SubmitButtonDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="submit-button" />

## 用法

```vue
<script setup>
import { ref } from 'vue'
import { SubmitButton } from 'brutx-ui-vue'

const isLoading = ref(false)

async function handleSubmit() {
    isLoading.value = true
    await new Promise(resolve => setTimeout(resolve, 2000))
    isLoading.value = false
}
</script>

<template>
    <form @submit.prevent="handleSubmit">
        <SubmitButton :loading="isLoading" variant="primary">
            Save Changes
        </SubmitButton>
    </form>
</template>
```

### 配合表单使用

```vue
<script setup>
import { ref } from 'vue'
import { Form, SubmitButton } from 'brutx-ui-vue'

const isLoading = ref(false)

function onSubmit(values) {
    isLoading.value = true
    setTimeout(() => {
        isLoading.value = false
    }, 2000)
}
</script>

<template>
    <Form @submit="onSubmit">
        <SubmitButton :loading="isLoading" variant="primary">
            Sign In
        </SubmitButton>
    </Form>
</template>
```

### 等待文本

加载时，按钮会显示 `pendingText` 属性的值，而非插槽内容：

```vue
<script setup>
import { SubmitButton } from 'brutx-ui-vue'
</script>

<template>
    <SubmitButton loading pending-text="Processing..." variant="primary">
        Pay Now
    </SubmitButton>
</template>
```

## 变体

| 变体 | 说明 |
|------|------|
| `default` | 标准背景色 |
| `primary` | Primary（珊瑚色）背景 |
| `secondary` | Secondary 背景 |
| `accent` | Accent 背景 |
| `danger` | 危险操作背景 |
| `success` | 成功状态背景 |
| `outline` | 透明背景，带边框 |
| `ghost` | 透明背景，无边框 |
| `link` | 链接样式 |

## 尺寸

| 尺寸 | 说明 |
|------|------|
| `sm` | 小尺寸 |
| `default` | 默认尺寸 |
| `lg` | 大尺寸 |
| `xl` | 超大尺寸 |
| `icon` | 图标按钮尺寸 |

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent' \| 'danger' \| 'success' \| 'outline' \| 'ghost' \| 'link'` | `'default'` | 颜色变体 |
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl' \| 'icon'` | `'default'` | 尺寸 |
| `pendingText` | `string` | locale: `submitButton.submitting` | 加载中显示的等待文本 |
| `loading` | `boolean` | `false` | 是否处于加载状态 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `class` | `string` | — | 自定义样式类 |

## 插槽

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 按钮内容，当 `loading` 为 `false` 时显示 |

## 可访问性

- **键盘操作**：支持 `Space` / `Enter` 触发表单提交
- **ARIA 属性**：加载状态下按钮语义上处于禁用状态，防止重复提交
- **焦点管理**：`disabled` 或 `loading` 状态下阻止点击事件

## 常见问题

**Q: 加载时如何自定义显示文本？**

A: 通过 `pendingText` 属性设置，未设置时默认使用国际化文本 `submitButton.submitting`。

**Q: `disabled` 和 `loading` 有什么区别？**

A: 两者都会阻止点击，但 `loading` 会切换按钮显示内容为等待文本，`disabled` 仅禁用按钮。
