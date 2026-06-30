---
title: Success Card
description: 成功状态卡片区块，带有勾选图标、标题、描述和确认按钮。
---

# Success Card 成功卡片

新粗野主义风格的成功卡片，包含成功色顶部条、装饰性勾选图标、标题、描述和确认按钮。

## 预览

<ComponentPreview>
  <SuccessCardDemo />
</ComponentPreview>

## 安装

```bash
npx brutx-vue@latest add --block success-card
```

## 用法

```vue
<script setup>
import SuccessCard from '@/components/ui/success-card/SuccessCard.vue'

function handleConfirm() {
    console.log('Confirmed')
}
</script>

<template>
    <SuccessCard
        title="Operation Successful"
        description="Your changes have been saved successfully."
        confirm-text="Continue"
        @confirm="handleConfirm"
    />
</template>
```

自定义文本示例：

```vue
<script setup>
import SuccessCard from '@/components/ui/success-card/SuccessCard.vue'
</script>

<template>
    <SuccessCard
        title="Payment Complete"
        description="Your order has been placed and is being processed."
        confirm-text="View Order"
        @confirm="viewOrder"
    />
</template>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | locale: `successCard.defaultTitle` | 卡片标题文本 |
| `description` | `string` | locale: `successCard.defaultDescription` | 卡片描述文本 |
| `confirmText` | `string` | locale: `successCard.defaultConfirmText` | 确认按钮文本 |
| `class` | `string` | — | 自定义 CSS 类名 |

## 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `confirm` | `[]` | 点击确认按钮时触发 |

## 插槽

| 插槽 | 作用域 | 说明 |
| --- | --- | --- |
| `actions` | — | 额外操作按钮区域 |

## 可访问性

- 卡片使用语义化结构，标题和描述文本清晰可读
- 确认按钮支持键盘导航和焦点管理
- 成功状态通过视觉图标和文本双重提示
- 颜色对比度符合 WCAG 标准
