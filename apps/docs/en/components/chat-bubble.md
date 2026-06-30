---
title: ChatBubble
description: Chat message bubble component supporting sent/received/system message variants with avatar, name, and timestamp display.
translated: true
---

# ChatBubble

A chat UI component supporting three message role variants. Bold-bordered bubbles with shadow offsets give the conversation interface a distinctive personality.

## Demo

<ComponentPreview>
  <ChatBubbleDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="chat-bubble" />

## Usage

```vue
<script setup>
import { ChatBubble } from 'brutx-ui-vue'

const message = {
    id: '1',
    variant: 'received',
    name: 'Alex',
    content: 'This UI library is amazing!',
    timestamp: '14:01',
}
</script>

<template>
    <div class="flex flex-col gap-3">
        <ChatBubble :message="{ id: '1', variant: 'received', name: 'Alex', content: 'Hello!' }" />
        <ChatBubble :message="{ id: '2', variant: 'sent', content: 'Hey!' }" />
        <ChatBubble :message="{ id: '3', variant: 'system', content: 'Conversation started' }" />
    </div>
</template>
```

### Color Variants

The `color` prop switches the background color scheme for `variant="sent"` bubbles, combining orthogonally with `variant` (e.g., `variant="sent" color="accent"`). `received` and `system` bubbles are not affected by `color`.

```vue
<script setup>
import { ChatBubble } from 'brutx-ui-vue'
</script>

<template>
    <div class="flex flex-col gap-3">
        <ChatBubble :message="{ id: '1', variant: 'sent', content: 'Default color', timestamp: '14:00' }" color="default" />
        <ChatBubble :message="{ id: '2', variant: 'sent', content: 'Primary color', timestamp: '14:01' }" color="primary" />
        <ChatBubble :message="{ id: '3', variant: 'sent', content: 'Accent color', timestamp: '14:02' }" color="accent" />
    </div>
</template>
```

## Variants

### Message Roles

| Variant | Style | Purpose |
|------|------|------|
| `received` | Left-aligned, background color | Messages from others |
| `sent` | Right-aligned, primary color background | Messages sent by yourself |
| `system` | Centered, italic, dashed border, no shadow, forced text-xs | System notifications |

> **Note:** The `system` variant ignores the `size` prop and always uses `text-xs`. It also hides the avatar and sender name.

### Colors

| Color | Description |
|------|------|
| `default` | Default color scheme; sent bubbles use primary color (brutal-primary) background |
| `primary` | Primary color scheme; sent bubbles use primary color (brutal-primary) background with primary color shadow (shadow-brutal-primary) |
| `accent` | Accent color scheme; sent bubbles use accent color (brutal-accent) background |

## Sizes

The `size` prop controls bubble padding, text size, and avatar dimensions simultaneously.

| Size | Bubble Padding | Text Size | Avatar Size |
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
        <ChatBubble :message="{ id: '1', variant: 'sent', name: 'Me', content: 'Small bubble', timestamp: '14:00' }" size="sm" />
        <ChatBubble :message="{ id: '2', variant: 'sent', name: 'Me', content: 'Default bubble', timestamp: '14:01' }" size="default" />
        <ChatBubble :message="{ id: '3', variant: 'sent', name: 'Me', content: 'Large bubble', timestamp: '14:02' }" size="lg" />
    </div>
</template>
```

## Sub-components

### ChatContainer

A chat message container with time-based grouping support:

```vue
<script setup>
import { ChatContainer } from 'brutx-ui-vue'

const messages = [
    { id: '1', variant: 'received', name: 'Alex', content: 'Hello!', timestamp: new Date() },
    { id: '2', variant: 'sent', content: 'Hey!', timestamp: new Date(), status: 'read' },
]
</script>

<template>
    <ChatContainer :messages="messages" group-by-time show-status />
</template>
```

## Data Types

### ChatMessage

```ts
interface ChatMessage {
    id: string                        // Unique message identifier (required)
    content: string                   // Message text content (required)
    variant?: 'sent' | 'received' | 'system'  // Message variant, defaults to 'received'
    avatar?: string                   // Avatar image URL; falls back to initials on load failure
    name?: string                     // Sender name, used for display and initial generation
    timestamp?: string | Date         // Timestamp; strings are displayed directly, Date objects are formatted via dateFormat or toLocaleString
    status?: MessageStatus            // Message status, only effective for variant="sent"
}
```

### MessageStatus

```ts
type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
```

| Status | Icon | Style |
|------|------|------|
| `sending` | Spinning loader icon | Semi-transparent + rotation animation |
| `sent` | Single check | Semi-transparent |
| `delivered` | Double check | Slightly darker |
| `read` | Double check | Theme primary color |
| `failed` | Warning icon | Destructive color |

## Props

### ChatBubble

| Prop | Type | Default | Description |
|------|------|--------|------|
| `message` | `ChatMessage` | — | Message data object (required) |
| `color` | `'default' \| 'primary' \| 'accent'` | `'default'` | Background color scheme for sent bubbles; only effective for `variant="sent"`, received/system are unaffected |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Bubble padding/text size, also adjusts avatar size |
| `showAvatar` | `boolean` | `true` | Whether to show the avatar area (system messages always hidden) |
| `showStatus` | `boolean` | `true` | Whether to show the message status icon (sent messages only) |
| `showTimestamp` | `boolean` | `true` | Whether to show the timestamp |
| `dateFormat` | `(date: Date) => string` | — | Custom date formatting function; uses `Date.toLocaleString()` when unset |
| `class` | `string` | — | Custom CSS class for the bubble |

### ChatContainer

| Prop | Type | Default | Description |
|------|------|--------|------|
| `messages` | `ChatMessage[]` | — | Message array (required) |
| `groupByTime` | `boolean` | `false` | Whether to group by time (today/yesterday/date) |
| `groupInterval` | `number` | `5` | Time grouping interval (minutes); reserved prop, not yet enabled in current version |
| `showAvatar` | `boolean` | `true` | Whether to show avatars |
| `showStatus` | `boolean` | `true` | Whether to show message status |
| `showTimestamp` | `boolean` | `true` | Whether to show timestamps |
| `dateFormat` | `(date: Date) => string` | — | Custom date formatting function |
| `class` | `string` | — | Custom CSS class |

> **Note:** When `groupByTime` is `true`, messages are automatically grouped by date labels (today/yesterday/specific date), with dividers and date labels between groups.

## Slots

| Slot | Scope | Description |
|------|--------|------|
| `default` | — | Custom bubble content (defaults to displaying `message.content`) |

## Accessibility

- **ARIA Attributes**: ChatContainer uses `role="log"` for accessibility support
- **Semantics**: Message bubbles use semantic structure, supporting correct screen reader narration
