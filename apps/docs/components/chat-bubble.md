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

### 颜色变体

`color` 属性用于为 `variant="sent"` 的气泡切换背景配色，与 `variant` 正交组合（如 `variant="sent" color="accent"`）。`received` 与 `system` 气泡不受 `color` 影响。

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

## 变体

### 消息角色

| 变体 | 样式 | 用途 |
|------|------|------|
| `received` | 左对齐，背景色 | 对方消息 |
| `sent` | 右对齐，主色背景 | 自己发送的消息 |
| `system` | 居中，斜体，虚线边框，无阴影，强制 text-xs | 系统通知 |

> **注意：** `system` 变体会忽略 `size` prop，始终使用 `text-xs`；同时隐藏头像和发送者名称。

### 颜色

| 颜色 | 说明 |
|------|------|
| `default` | 默认配色，sent 气泡使用主色（brutal-primary）背景 |
| `primary` | 主色配色，sent 气泡使用主色（brutal-primary）背景，并附加主色阴影（shadow-brutal-primary） |
| `accent` | 强调色配色，sent 气泡使用强调色（brutal-accent）背景 |

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

## 子组件

### ChatContainer 聊天容器

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

## 数据类型

### ChatMessage

```ts
interface ChatMessage {
    id: string                        // 消息唯一标识（必填）
    content: string                   // 消息文本内容（必填）
    variant?: 'sent' | 'received' | 'system'  // 消息变体，默认 'received'
    avatar?: string                   // 头像图片 URL，加载失败时回退为首字母缩写
    name?: string                     // 发送者姓名，用于显示名称和生成首字母缩写
    timestamp?: string | Date         // 时间戳，字符串直接展示，Date 对象按 dateFormat 或 toLocaleString 格式化
    status?: MessageStatus            // 消息状态，仅对 variant="sent" 有效
}
```

### MessageStatus

```ts
type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
```

| 状态 | 图标 | 样式 |
|------|------|------|
| `sending` | 旋转加载图标 | 半透明 + 旋转动画 |
| `sent` | 单勾 | 半透明 |
| `delivered` | 双勾 | 略深 |
| `read` | 双勾 | 主题主色 |
| `failed` | 警告图标 | 销毁色 |

## Props

### ChatBubble

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `message` | `ChatMessage` | — | 消息数据对象（必填） |
| `color` | `'default' \| 'primary' \| 'accent'` | `'default'` | sent 气泡的背景配色；仅对 `variant="sent"` 生效，received/system 不受影响 |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | 气泡内边距/文字大小，同时联动头像尺寸 |
| `showAvatar` | `boolean` | `true` | 是否显示头像区域（system 消息始终隐藏） |
| `showStatus` | `boolean` | `true` | 是否显示消息状态图标（仅 sent 消息） |
| `showTimestamp` | `boolean` | `true` | 是否显示时间戳 |
| `dateFormat` | `(date: Date) => string` | — | 自定义日期格式化函数，未设置时使用 `Date.toLocaleString()` |
| `class` | `string` | — | 气泡自定义样式类 |

### ChatContainer

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `messages` | `ChatMessage[]` | — | 消息数组（必填） |
| `groupByTime` | `boolean` | `false` | 是否按时间分组（今天/昨天/日期） |
| `groupInterval` | `number` | `5` | 时间分组间隔（分钟），预留属性，当前版本未启用 |
| `showAvatar` | `boolean` | `true` | 是否显示头像 |
| `showStatus` | `boolean` | `true` | 是否显示消息状态 |
| `showTimestamp` | `boolean` | `true` | 是否显示时间戳 |
| `dateFormat` | `(date: Date) => string` | — | 自定义日期格式化函数 |
| `class` | `string` | — | 自定义样式类 |

> **注意：** 当 `groupByTime` 为 `true` 时，消息按日期标签（今天/昨天/具体日期）自动分组，分组之间显示分隔线和日期标签。

## 插槽

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 自定义气泡内容（默认显示 `message.content`） |

## 可访问性

- **ARIA 属性**：ChatContainer 使用 `role="log"` 以支持无障碍访问
- **语义化**：消息气泡使用语义化结构，支持屏幕阅读器正确朗读
