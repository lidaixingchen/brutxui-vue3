---
title: Feedback Form
description: 反馈表单区块，带有姓名、邮箱、主题和消息字段。
---

# Feedback Form

新粗野主义风格的反馈表单，包含标题、描述和完整的表单字段（姓名、邮箱、主题、消息），带有提交按钮。

## 预览

<ComponentPreview>
  <div class="flex items-center justify-center p-8">
    <div class="w-full max-w-2xl">
      <div class="text-center mb-8">
        <h2 class="text-3xl font-black tracking-tight">Send Feedback</h2>
        <p class="mt-2 text-brutal-muted-foreground font-medium">We'd love to hear from you.</p>
      </div>
      <div class="border-3 border-brutal bg-brutal-bg shadow-brutal">
        <div class="border-b-3 border-brutal p-4">
          <h3 class="text-xl font-black">Send Feedback</h3>
          <p class="text-sm text-brutal-muted-foreground font-medium">We'd love to hear from you.</p>
        </div>
        <div class="p-4 space-y-4">
          <div class="space-y-2">
            <label class="text-sm font-bold">Name</label>
            <div class="h-10 border-3 border-brutal bg-brutal-bg px-3 flex items-center"><span class="text-sm text-brutal-muted-foreground">Name</span></div>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-bold">Email</label>
            <div class="h-10 border-3 border-brutal bg-brutal-bg px-3 flex items-center"><span class="text-sm text-brutal-muted-foreground">Email</span></div>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-bold">Subject</label>
            <div class="h-10 border-3 border-brutal bg-brutal-bg px-3 flex items-center"><span class="text-sm text-brutal-muted-foreground">Subject</span></div>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-bold">Message</label>
            <div class="h-24 border-3 border-brutal bg-brutal-bg px-3 py-2"><span class="text-sm text-brutal-muted-foreground">Message</span></div>
          </div>
          <button class="w-full px-5 py-2 bg-brutal-primary text-brutal-fg border-3 border-brutal shadow-brutal font-black text-sm active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none transition-all">Submit</button>
        </div>
      </div>
    </div>
  </div>
</ComponentPreview>

## 安装

```bash
npx brutx-vue@latest add --block feedback-form
```

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

## 自定义文本

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

## Props

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `title` | `string` | locale: `feedbackForm.defaultTitle` |
| `description` | `string` | locale: `feedbackForm.defaultDescription` |
| `submitText` | `string` | locale: `feedbackForm.defaultSubmitText` |
| `class` | `string` | — |

## 事件

| 事件 | 载荷 |
|------|------|
| `submit` | `[{ name: string; email: string; subject: string; message: string }]` |

## Slots

| Slot | 用途 |
|------|------|
| `header` | 替换/扩展区块头部 |
| `default` | 替换区块主体内容（含表单） |
| `footer` | 替换/扩展区块底部 |

## 布局

FeedbackForm 包含：
- **头部**：居中标题和描述文本
- **表单卡片**：Card 组件包裹的表单区域
  - **姓名字段**：Input 组件
  - **邮箱字段**：Input 组件（type="email"）
  - **主题字段**：Input 组件
  - **消息字段**：Textarea 组件
  - **提交按钮**：primary 变体，带 Send 图标，全宽
