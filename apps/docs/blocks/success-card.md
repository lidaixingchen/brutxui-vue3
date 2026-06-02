---
title: Success Card
description: 成功状态卡片区块，带有勾选图标、标题、描述和确认按钮。
---

# Success Card

新粗野主义风格的成功卡片，包含成功色顶部条、装饰性勾选图标、标题、描述和确认按钮。

## 预览

<ComponentPreview>
  <div class="flex items-center justify-center p-8">
    <div class="w-full max-w-md border-3 border-brutal bg-brutal-bg shadow-brutal">
      <div class="h-2 bg-brutal-success border-b-3 border-brutal"></div>
      <div class="p-6 pt-6 flex flex-col items-center text-center">
        <div class="relative mb-4">
          <div class="absolute inset-0 bg-brutal-muted border-3 border-brutal translate-x-2 translate-y-2"></div>
          <div class="relative h-16 w-16 flex items-center justify-center bg-brutal-success border-3 border-brutal shadow-brutal">
            <span class="text-3xl">&#10003;</span>
          </div>
        </div>
        <h3 class="text-xl font-black tracking-tight">Operation Successful</h3>
        <p class="mt-2 text-sm text-brutal-muted-foreground font-medium">Your changes have been saved successfully.</p>
        <button class="mt-6 px-5 py-2 bg-brutal-primary text-brutal-fg border-3 border-brutal shadow-brutal font-black text-sm active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none transition-all">Continue</button>
      </div>
    </div>
  </div>
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

## 自定义文本

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

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `title` | `string` | locale: `successCard.defaultTitle` |
| `description` | `string` | locale: `successCard.defaultDescription` |
| `confirmText` | `string` | locale: `successCard.defaultConfirmText` |
| `class` | `string` | — |

## 事件

| 事件 | 载荷 |
|------|------|
| `confirm` | `[]` |

## Slots

| Slot | 用途 |
|------|------|
| `actions` | 额外操作按钮区域 |

## 布局

SuccessCard 包含：
- **成功色顶部条**：`bg-brutal-success` 装饰条
- **装饰性勾选图标**：成功色方框内 Check 图标，带有偏移阴影背景
- **标题**：加粗、字距调整的标题
- **描述**：标题下方的弱化文本（仅在提供时显示）
- **确认按钮**：primary 变体按钮
- **扩展插槽**：`actions` slot 用于添加自定义操作按钮
