<script setup lang="ts">
import { ChatBubble } from 'brutx-ui-vue'

const messages = [
    {
        id: '1',
        variant: 'system' as const,
        content: '对话开始于 2025-06-01',
    },
    {
        id: '2',
        variant: 'received' as const,
        name: 'Alex',
        content: '嘿！这个新粗野主义 UI 库看起来太赞了！',
        timestamp: '14:01',
    },
    {
        id: '3',
        variant: 'sent' as const,
        name: '我',
        content: '对吧！粗边框 + 硬朗阴影，直接把普通组件卷死。',
        timestamp: '14:02',
    },
    {
        id: '4',
        variant: 'received' as const,
        name: 'Alex',
        content: 'Kanban + TreeView 这两个复合组件是重头戏 🔥',
        timestamp: '14:03',
    },
    {
        id: '5',
        variant: 'sent' as const,
        name: '我',
        content: '还有 Carousel！Embla 驱动的，性能拉满 💪',
        timestamp: '14:03',
    },
]
</script>

<template>
    <div class="space-y-6 max-w-md mx-auto">
        <div class="flex flex-col gap-3 border-3 border-brutal shadow-brutal rounded-brutal p-4 bg-brutal-bg">
            <ChatBubble
                v-for="msg in messages"
                :key="msg.id"
                :message="msg"
            />
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">颜色（仅 sent 生效）</p>
            <div class="flex flex-col gap-3 border-3 border-brutal shadow-brutal rounded-brutal p-4 bg-brutal-bg">
                <ChatBubble :message="{ id: 'c1', variant: 'received', name: 'Alex', content: 'received 不受 color 影响', timestamp: '14:00' }" color="accent" />
                <ChatBubble :message="{ id: 'c2', variant: 'sent', name: '我', content: 'default 配色', timestamp: '14:01' }" color="default" />
                <ChatBubble :message="{ id: 'c3', variant: 'sent', name: '我', content: 'primary 配色', timestamp: '14:02' }" color="primary" />
                <ChatBubble :message="{ id: 'c4', variant: 'sent', name: '我', content: 'accent 配色', timestamp: '14:03' }" color="accent" />
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">尺寸</p>
            <div class="flex flex-col gap-3 border-3 border-brutal shadow-brutal rounded-brutal p-4 bg-brutal-bg">
                <ChatBubble :message="{ id: 's1', variant: 'sent', name: '我', content: 'sm 小号气泡', timestamp: '14:00' }" size="sm" />
                <ChatBubble :message="{ id: 's2', variant: 'sent', name: '我', content: 'default 默认气泡', timestamp: '14:01' }" size="default" />
                <ChatBubble :message="{ id: 's3', variant: 'sent', name: '我', content: 'lg 大号气泡', timestamp: '14:02' }" size="lg" />
            </div>
        </div>
    </div>
</template>
