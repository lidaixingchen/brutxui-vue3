<script setup lang="ts">
import { ref } from 'vue'
import { SearchWidget, Button } from 'brutx-ui-vue'
import type { SearchSuggestion } from 'brutx-ui-vue'

const suggestions: SearchSuggestion[] = [
    { label: 'Button 按钮', value: 'button', group: '组件' },
    { label: 'Badge 徽章', value: 'badge', group: '组件' },
    { label: 'Card 卡片', value: 'card', group: '组件' },
    { label: 'Dialog 对话框', value: 'dialog', group: '组件' },
    { label: '快速开始', value: 'getting-started', group: '文档' },
    { label: '主题配置', value: 'theming', group: '文档' },
]

const recent: SearchSuggestion[] = [
    { label: 'Button 按钮', value: 'button' },
    { label: '主题配置', value: 'theming' },
    { label: 'Card 卡片', value: 'card' },
]

const loading = ref(false)
const lastSelected = ref<string | null>(null)

function handleSelect(suggestion: SearchSuggestion) {
    lastSelected.value = suggestion.label
}

function toggleLoading() {
    loading.value = true
    setTimeout(() => { loading.value = false }, 2000)
}
</script>

<template>
    <div class="space-y-6 w-full max-w-lg">
        <SearchWidget :suggestions="suggestions" @select="handleSelect" />

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">最近搜索</p>
            <p class="text-xs opacity-60">输入框为空时展示「最近搜索」分组，点击回填。</p>
            <SearchWidget :recent="recent" @select="handleSelect" />
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">加载状态</p>
            <p class="text-xs opacity-60">点击按钮触发 loading，列表底部显示 Spinner。</p>
            <div class="flex gap-2">
                <Button variant="outline" size="sm" :disabled="loading" @click="toggleLoading">
                    {{ loading ? '搜索中...' : '模拟搜索' }}
                </Button>
            </div>
            <SearchWidget :suggestions="suggestions" :loading="loading" @select="handleSelect" />
        </div>

        <p v-if="lastSelected" class="text-xs font-bold border-3 border-brutal rounded-brutal p-2 bg-brutal-muted">
            已选择：{{ lastSelected }}
        </p>
    </div>
</template>
