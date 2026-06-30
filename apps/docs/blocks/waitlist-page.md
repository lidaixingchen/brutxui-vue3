---
title: Waitlist Page 等候列表页
description: 新粗野主义风格的候补注册页面，包含邮箱输入、CTA 按钮和社交证明指标。
---

# Waitlist Page 等候列表页

新粗野主义风格的候补注册页面，包含邮箱输入、CTA 按钮和社交证明指标。用于新品发布的邮箱预约收集。

## 预览

<ComponentPreview>
  <WaitlistPageDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="waitlist-page" />

## 用法

```vue
<script setup>
import WaitlistPage from '@/components/ui/waitlist-page/WaitlistPage.vue'

function handleSubmit(email) {
    console.log('Waitlist signup:', email)
}
</script>

<template>
    <WaitlistPage
        title="Join the BrutxUI Waitlist Club"
        description="Be the first to know when we launch. Get early access and exclusive perks."
        cta-text="Secure Priority Access"
        :waitlist-count="1247"
        @submit="handleSubmit"
    />
</template>
```

## Props

### WaitlistPage

| 属性 | 类型 | 默认值 | 说明 |
| ---- | ---- | ------ | ---- |
| `title` | `string` | locale: `waitlistPage.title` | 页面标题 |
| `description` | `string` | — | 页面描述 |
| `ctaText` | `string` | locale: `waitlistPage.ctaText` | CTA 按钮文本 |
| `waitlistCount` | `number` | `0` | 候补人数 |
| `class` | `string` | — | 自定义样式类 |

## 事件

| 事件 | 参数 | 说明 |
| ---- | ---- | ---- |
| `submit` | `string`（邮箱地址） | 提交邮箱时触发 |

## 可访问性

- **键盘操作**：支持 `Tab` 在输入框和按钮间导航，`Enter` 提交表单
- **ARIA 属性**：邮箱输入框使用 `aria-label` 提供标签
- **焦点管理**：表单提交后焦点保持在输入框
