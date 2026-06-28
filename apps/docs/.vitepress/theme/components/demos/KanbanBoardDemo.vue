<script setup lang="ts">
import { ref } from 'vue'
import { KanbanBoard, Button } from 'brutx-ui-vue'
import type { KanbanColumn } from 'brutx-ui-vue'

const columns = ref<KanbanColumn[]>([
    {
        id: 'todo',
        title: '待办',
        color: 'var(--brutal-muted)',
        cards: [
            { id: 'c1', title: '设计首页 Banner', description: '确定配色与排版方案', tags: ['设计'] },
            { id: 'c2', title: '编写组件文档', tags: ['文档'] },
        ],
    },
    {
        id: 'doing',
        title: '进行中',
        color: 'var(--brutal-accent)',
        cards: [
            { id: 'c3', title: '开发 Kanban 组件', description: '支持拖拽排序', tags: ['开发', 'P0'] },
        ],
    },
    {
        id: 'done',
        title: '已完成',
        color: 'var(--brutal-success)',
        cards: [
            { id: 'c4', title: 'Accordion 组件', tags: ['完成'] },
            { id: 'c5', title: 'Timeline 组件', tags: ['完成'] },
        ],
    },
])

const sortableColumns = ref<KanbanColumn[]>([
    { id: 'backlog', title: 'Backlog', cards: [{ id: 'b1', title: '调研需求' }] },
    { id: 'progress', title: 'Progress', cards: [{ id: 'p1', title: '搭建脚手架' }] },
    { id: 'review', title: 'Review', cards: [{ id: 'r1', title: '代码评审' }] },
])

const eventLog = ref<string[]>([])

function handleColumnMove(columnId: string, fromIndex: number, toIndex: number) {
    eventLog.value.unshift(`列 ${columnId}：${fromIndex} → ${toIndex}`)
    if (eventLog.value.length > 4) eventLog.value.pop()
}

function handleAddCard(columnId: string) {
    const col = sortableColumns.value.find((c) => c.id === columnId)
    if (!col) return
    col.cards.push({ id: `card-${Date.now()}`, title: '新任务' })
    eventLog.value.unshift(`添加卡片到 ${columnId}`)
    if (eventLog.value.length > 4) eventLog.value.pop()
}
</script>

<template>
    <div class="space-y-6">
        <div class="overflow-x-auto">
            <KanbanBoard v-model="columns" />
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">列拖拽排序与自定义添加按钮</p>
            <p class="text-xs opacity-60">拖拽列标题可重排顺序；待办列使用自定义「新建任务」按钮。</p>
            <div class="overflow-x-auto">
                <KanbanBoard
                    v-model="sortableColumns"
                    @column-move="handleColumnMove"
                    @add-card="handleAddCard"
                >
                    <template #add-backlog="{ columnId }">
                        <Button variant="primary" size="sm" class="w-full" @click="handleAddCard(columnId)">
                            新建任务
                        </Button>
                    </template>
                </KanbanBoard>
            </div>
            <div v-if="eventLog.length" class="border-3 border-brutal rounded-brutal p-2 bg-brutal-muted text-xs font-bold space-y-1">
                <p v-for="(log, i) in eventLog" :key="i">{{ log }}</p>
            </div>
        </div>
    </div>
</template>
