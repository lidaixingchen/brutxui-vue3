---
title: ChatBubble 聊天气泡
description: 聊天消息气泡组件，支持发送方/接收方/系统消息三种变体，附带头像、姓名、时间戳展示。
---

# ChatBubble 聊天气泡

支持三种消息角色变体的聊天 UI 组件，粗边框气泡 + 阴影偏移让对话界面充满个性张力。

## 预览

<ComponentPreview>
  <ChatBubbleDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="chat-bubble" />

## 用法

```vue
<script setup>
import { ChatBubble } from 'brutx-ui-vue'

const message = {
    id: '1',
    variant: 'received',
    name: 'Alex',
    content: '这个 UI 库太好用了！',
    timestamp: '14:01',
}
</script>

<template>
    <div class="flex flex-col gap-3">
        <ChatBubble :message="{ id: '1', variant: 'received', name: 'Alex', content: '你好！' }" />
        <ChatBubble :message="{ id: '2', variant: 'sent', content: '嘿！' }" />
        <ChatBubble :message="{ id: '3', variant: 'system', content: '对话已开始' }" />
    </div>
</template>
```

## 消息数据类型

```ts
interface ChatMessage {
    id: string
    content: string
    variant?: 'sent' | 'received' | 'system'  // 默认 'received'
    avatar?: string      // 头像图片 URL
    name?: string        // 发送者姓名
    timestamp?: string | Date  // 时间戳文本或 Date 对象
    status?: MessageStatus     // 消息状态
}

type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
```

## Props

### ChatBubble Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `message` | `ChatMessage` | — | 消息数据对象 |
| `color` | `'default' \| 'primary' \| 'accent'` | `'default'` | sent 气泡的背景配色；仅对 `variant="sent"` 生效，received/system 不受影响 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 气泡内边距/文字大小，同时联动头像尺寸 |
| `showAvatar` | `boolean` | `true` | 是否显示头像区域 |
| `showStatus` | `boolean` | `true` | 是否显示消息状态图标（仅 sent 消息） |
| `showTimestamp` | `boolean` | `true` | 是否显示时间戳 |
| `dateFormat` | `(date: Date) => string` | — | 自定义日期格式化函数 |
| `class` | `string` | — | 气泡自定义样式类 |

## 变体说明

| 变体 | 样式 | 用途 |
|------|------|------|
| `received` | 左对齐，白底 | 对方消息 |
| `sent` | 右对齐，主色背景 | 自己发送的消息 |
| `system` | 居中，斜体，虚线边框 | 系统通知 |

## 颜色

`color` 属性用于为 `variant="sent"` 的气泡切换背景配色，与 `variant` 正交组合（如 `variant="sent" color="accent"`）。`received` 与 `system` 气泡不受 `color` 影响。

| 颜色 | 说明 |
|------|------|
| `default` | 默认配色，sent 气泡使用主色（brutal-primary）背景 |
| `primary` | 主色配色，sent 气泡使用主色（brutal-primary）背景，与 `default` 视觉一致 |
| `accent` | 强调色配色，sent 气泡使用强调色（brutal-accent）背景 |

```vue
<script setup>
import { ChatBubble } from 'brutx-ui-vue'
</script>

<template>
    <div class="flex flex-col gap-3">
        <ChatBubble :message="{ id: '1', variant: 'sent', content: '默认配色', timestamp: '14:00' }" color="default" />
        <ChatBubble :message="{ id: '2', variant: 'sent', content: '主色配色', timestamp: '14:01' }" color="primary" />
        <ChatBubble :message="{ id: '3', variant: 'sent', content: '强调色配色', timestamp: '14:02' }" color="accent" />
    </div>
</template>
```

## 尺寸

`size` 属性同时控制气泡的内边距、文字大小以及头像尺寸。

| 尺寸 | 气泡内边距 | 文字大小 | 头像尺寸 |
|------|-----------|----------|----------|
| `sm` | `px-3 py-1.5` | `text-xs` | `w-6 h-6` |
| `default` | `px-4 py-2.5` | `text-sm` | `w-8 h-8` |
| `lg` | `px-5 py-3.5` | `text-base` | `w-10 h-10` |

```vue
<script setup>
import { ChatBubble } from 'brutx-ui-vue'
</script>

<template>
    <div class="flex flex-col gap-3">
        <ChatBubble :message="{ id: '1', variant: 'sent', name: '我', content: '小号气泡', timestamp: '14:00' }" size="sm" />
        <ChatBubble :message="{ id: '2', variant: 'sent', name: '我', content: '默认气泡', timestamp: '14:01' }" size="default" />
        <ChatBubble :message="{ id: '3', variant: 'sent', name: '我', content: '大号气泡', timestamp: '14:02' }" size="lg" />
    </div>
</template>
```

## 插槽

| 插槽名 | 说明 |
|--------|------|
| `default` | 自定义气泡内容（默认显示 `message.content`） |

---

## ChatContainer 聊天容器

支持时间分组的聊天消息容器：

```vue
<script setup>
import { ChatContainer } from 'brutx-ui-vue'

const messages = [
    { id: '1', variant: 'received', name: 'Alex', content: '你好！', timestamp: new Date() },
    { id: '2', variant: 'sent', content: '嘿！', timestamp: new Date(), status: 'read' },
]
</script>

<template>
    <ChatContainer :messages="messages" group-by-time show-status />
</template>
```

### ChatContainer Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `messages` | `ChatMessage[]` | — | 消息数组（必填） |
| `groupByTime` | `boolean` | `false` | 是否按时间分组（今天/昨天/日期） |
| `showAvatar` | `boolean` | `true` | 是否显示头像 |
| `showStatus` | `boolean` | `true` | 是否显示消息状态 |
| `showTimestamp` | `boolean` | `true` | 是否显示时间戳 |
| `dateFormat` | `(date: Date) => string` | — | 自定义日期格式化函数 |
| `class` | `string` | — | 自定义样式类 |
