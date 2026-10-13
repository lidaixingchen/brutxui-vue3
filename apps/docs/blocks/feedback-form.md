---
title: Feedback Form
description: 反馈表单区块，带有姓名、邮箱、主题和消息字段。
---

# Feedback Form 反馈表单

新粗野主义风格的反馈表单，包含标题、描述和完整的表单字段（姓名、邮箱、主题、消息），带有提交按钮。

## 预览

<ComponentPreview>
  <FeedbackFormDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="feedback-form" />

## 用法

```vue
<script setup>
import FeedbackForm from '@/components/ui/feedback-form/FeedbackForm.vue'

function handleSubmit(payload) {
    console.log('Feedback:', payload)
    // payload: { name, email, subject, message }
}
</script>

<template>
    <FeedbackForm
        title="Send Feedback"
        description="We'd love to hear from you."
        submit-text="Submit"
        @submit="handleSubmit"
    />
</template>
```

### 自定义文本

```vue
<script setup>
import FeedbackForm from '@/components/ui/feedback-form/FeedbackForm.vue'
</script>

<template>
    <FeedbackForm
        title="Contact Us"
        description="Have a question? Reach out to our team."
        submit-text="Send Message"
        @submit="handleContact"
    />
</template>
```

### 加载状态

组件会阻止同一提交回合内的重复触发。若要在异步请求期间持续锁定表单，应在 `submit` 回调中同步将受控的 `loading` 设为 `true`，并在请求结束后重置为 `false`；未接管 `loading` 时，内部防重锁会在下一个 Vue 更新周期释放。

```vue
<script setup>
import { ref } from 'vue'
import FeedbackForm from '@/components/ui/feedback-form/FeedbackForm.vue'

const loading = ref(false)

async function handleSubmit(payload) {
    loading.value = true
    try {
        await sendFeedback(payload)
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <FeedbackForm :loading="loading" @submit="handleSubmit" />
</template>
```

### 成功状态

设置 `success` 为 `true` 时，表单被 `Result` 成功状态替换，展示成功标题、描述与确认按钮。点击确认按钮触发 `success-confirm` 事件，由调用方决定后续行为（如重置表单、跳转）。

```vue
<script setup>
import { ref } from 'vue'
import FeedbackForm from '@/components/ui/feedback-form/FeedbackForm.vue'

const loading = ref(false)
const success = ref(false)

async function handleSubmit(payload) {
    loading.value = true
    try {
        await sendFeedback(payload)
        success.value = true
    } finally {
        loading.value = false
    }
}

function handleSuccessConfirm() {
    success.value = false
}
</script>

<template>
    <FeedbackForm
        :loading="loading"
        :success="success"
        success-title="反馈已收到"
        success-description="感谢您的反馈，我们会尽快处理"
        success-confirm-text="继续填写"
        @submit="handleSubmit"
        @success-confirm="handleSuccessConfirm"
    />
</template>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | locale: `feedbackForm.defaultTitle` | 表单标题 |
| `description` | `string` | locale: `feedbackForm.defaultDescription` | 表单描述文本 |
| `submitText` | `string` | locale: `feedbackForm.defaultSubmitText` | 提交按钮文本 |
| `loading` | `boolean` | `false` | 是否处于加载状态 |
| `success` | `boolean` | `false` | 是否显示成功卡片 |
| `successTitle` | `string` | locale: `feedbackForm.successTitle` | 成功状态标题 |
| `successDescription` | `string` | locale: `feedbackForm.successDescription` | 成功状态描述文本 |
| `successConfirmText` | `string` | locale: `feedbackForm.successConfirmText` | 成功状态确认按钮文本 |
| `iconSize` | `IconSize` | `'default'` | 图标尺寸 |
| `class` | `string` | — | 自定义 CSS 类名 |

## 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `submit` | `[{ name: string; email: string; subject: string; message: string }]` | 表单提交时触发，携带表单数据 |
| `success-confirm` | `[]` | 点击成功卡片确认按钮时触发 |

## 插槽

| 插槽 | 作用域 | 说明 |
| --- | --- | --- |
| `header` | — | 替换/扩展区块头部 |
| `default` | — | 替换区块主体内容（含表单） |
| `footer` | — | 替换/扩展区块底部 |

## 可访问性

- 表单字段均使用语义化 `<label>` 关联，确保屏幕阅读器可正确识别。
- `loading` 状态会禁用提交控件；组件同时阻止同一提交回合内的重复提交。
- 成功卡片提供确认按钮，支持键盘导航和焦点管理。
