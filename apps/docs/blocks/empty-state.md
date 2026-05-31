# Empty State

新粗野主义风格的空状态占位符，包含装饰性图标、标题、描述和操作按钮。

## 预览

<ComponentPreview>
  <div class="flex flex-col items-center justify-center py-16 px-4">
    <div class="relative mb-6">
      <div class="absolute inset-0 bg-brutal-muted border-3 border-brutal translate-x-2 translate-y-2"></div>
      <div class="relative h-20 w-20 flex items-center justify-center bg-brutal-accent border-3 border-brutal shadow-brutal">
        <span class="text-3xl">&#128193;</span>
      </div>
    </div>
    <h3 class="text-xl font-black tracking-tight">No active deployments found</h3>
    <p class="mt-2 text-sm text-gray-500 font-medium text-center max-w-md">Get started by deploying your first application.</p>
    <button class="mt-6 px-5 py-2 bg-brutal-primary text-brutal-fg border-3 border-brutal shadow-brutal font-black text-sm active:translate-y-[2px] active:shadow-none transition-all">Deploy New App</button>
  </div>
</ComponentPreview>

## 安装

```bash
npx brutx@latest add --block empty-state
```

## 用法

```vue
<script setup>
import EmptyState from '@/components/ui/EmptyState.vue'
import { Server } from 'lucide-vue-next'

function handleAction() {
    console.log('Action clicked')
}
</script>

<template>
    <EmptyState
        title="No active deployments found"
        description="Get started by deploying your first application to the cloud."
        action-text="Deploy New App"
        :icon="Server"
        @action="handleAction"
    />
</template>
```

## 自定义图标

```vue
<script setup>
import EmptyState from '@/components/ui/EmptyState.vue'
import { Inbox } from 'lucide-vue-next'
</script>

<template>
    <EmptyState
        title="No messages yet"
        description="Your inbox is empty. Start a conversation."
        action-text="New Message"
        :icon="Inbox"
    />
</template>
```

## Props

| 属性 | 类型 | 默认值 |
|------|------|--------|
| `title` | `string` | `'No active deployments found'` |
| `description` | `string` | — |
| `actionText` | `string` | `'Deploy New App'` |
| `icon` | `Component` | `FolderOpen`（来自 lucide-vue-next） |
| `class` | `string` | — |

## 事件

| 事件 | 载荷 |
|------|------|
| `action` | `[]` |

## 布局

EmptyState 包含：
- **装饰性图标**：强调色方框，带有偏移阴影背景
- **标题**：加粗、字距调整的标题
- **描述**：标题下方的弱化文本
- **操作按钮**：primary 变体按钮（仅在提供了 `actionText` 时显示）
