---
title: KanbanBoard 看板
description: 基于原生 HTML5 拖拽 API 的看板组件，支持多列卡片拖拽移动、标签、颜色标记，适合任务管理场景。
---

# KanbanBoard 看板

轻量级、无外部拖拽库依赖的看板组件，粗边框列 + 硬朗阴影卡片尽显新粗野主义张力。

## 预览

<ComponentPreview>
  <KanbanBoardDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="kanban" />

## 用法

```vue
<script setup>
import { KanbanBoard } from 'brutx-ui-vue'
import type { KanbanColumn } from 'brutx-ui-vue'
import { ref } from 'vue'

const columns = ref<KanbanColumn[]>([
    {
        id: 'todo',
        title: '待办',
        color: '#FFE66D',
        cards: [
            { id: 'c1', title: '需求分析', tags: ['研发'] },
        ],
    },
    {
        id: 'done',
        title: '已完成',
        cards: [],
    },
])
</script>

<template>
    <KanbanBoard
        v-model="columns"
        @card-move="(id, from, to) => console.log(id, from, to)"
    />
</template>
```

## 数据类型

```ts
interface KanbanCard {
    id: string
    title: string
    description?: string
    tags?: string[]
    color?: string
}

interface KanbanColumn {
    id: string
    title: string
    color?: string
    cards: KanbanCard[]
}
```

## Props

### KanbanBoard Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `KanbanColumn[]` | — | 看板数据（v-model） |
| `class` | `string` | — | 根节点自定义样式类 |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `KanbanColumn[]` | 列数据更新（卡片移动或列排序后） |
| `card-move` | `(cardId: string, fromColumn: string, toColumn: string)` | 卡片跨列移动完成时触发 |
| `card-click` | `(card: KanbanCard, columnId: string)` | 点击卡片时触发（拖拽过程中不会触发） |
| `column-move` | `(columnId: string, fromIndex: number, toIndex: number)` | 拖拽列标题完成排序时触发 |
| `add-card` | `columnId: string` | 点击默认「添加卡片」按钮时触发 |

## 插槽

| 插槽名 | 参数 | 说明 |
|--------|------|------|
| `add-{columnId}` | `columnId: string` | 在指定列底部自定义「添加卡片」入口；未提供时渲染默认 `Button`（`variant="outline"` `size="sm"`）并触发 `add-card` 事件 |

## 列排序

拖拽列标题即可在列之间重新排序，排序结果通过 `v-model` 同步，并触发 `column-move` 事件。

```vue
<script setup>
import { ref } from 'vue'
import { KanbanBoard } from 'brutx-ui-vue'

const columns = ref([
    { id: 'todo', title: '待办', cards: [] },
    { id: 'done', title: '已完成', cards: [] },
])

function handleColumnMove(columnId, fromIndex, toIndex) {
    console.log('列', columnId, '从', fromIndex, '移动到', toIndex)
}
</script>

<template>
    <KanbanBoard v-model="columns" @column-move="handleColumnMove" />
</template>
```

## 自定义添加卡片入口

每列底部默认渲染一个 `outline` 风格的「添加卡片」按钮，点击触发 `add-card` 事件。通过 `#add-{columnId}` 插槽可替换为自定义入口。

```vue
<script setup>
import { ref } from 'vue'
import { KanbanBoard, Button } from 'brutx-ui-vue'

const columns = ref([
    { id: 'todo', title: '待办', cards: [] },
])

function handleAddCard(columnId) {
    columns.value[0].cards.push({ id: Date.now().toString(), title: '新卡片' })
}
</script>

<template>
    <KanbanBoard v-model="columns" @add-card="handleAddCard">
        <template #add-todo="{ columnId }">
            <Button variant="primary" size="sm" class="w-full" @click="handleAddCard(columnId)">
                新建任务
            </Button>
        </template>
    </KanbanBoard>
</template>
```

## 无障碍支持

- 卡片支持键盘导航，可通过 `Tab` 键聚焦
- 聚焦后按 `Enter` 或 `Space` 键可触发 `card-click` 事件
- 空列会显示本地化的提示文本，引导用户拖放卡片
