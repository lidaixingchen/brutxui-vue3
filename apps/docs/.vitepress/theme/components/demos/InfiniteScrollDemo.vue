<script setup lang="ts">
import { ref } from 'vue'
import { InfiniteScroll, Button } from 'brutx-ui-vue'

const INITIAL_LIMIT = 10
const LOAD_COUNT = 5
const MAX_LIMIT = 25
const DELAY_MS = 1000

const items = ref<string[]>(Array.from({ length: INITIAL_LIMIT }, (_, i) => `数据项 ${i + 1}`))
const hasMore = ref(true)
const infiniteScrollRef = ref<InstanceType<typeof InfiniteScroll> | null>(null)

async function loadMore(): Promise<void> {
    if (!hasMore.value) {
        infiniteScrollRef.value?.resetLoading()
        return
    }

    // 模拟 API 异步请求
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS))

    const currentLength = items.value.length
    if (currentLength >= MAX_LIMIT) {
        hasMore.value = false
    } else {
        const nextItems = Array.from(
            { length: Math.min(LOAD_COUNT, MAX_LIMIT - currentLength) },
            (_, i) => `数据项 ${currentLength + i + 1}`
        )
        items.value.push(...nextItems)
        if (items.value.length >= MAX_LIMIT) {
            hasMore.value = false
        }
    }

    // 必须调用重置加载状态，告知组件数据加载完成
    infiniteScrollRef.value?.resetLoading()
}

function handleReset(): void {
    items.value = Array.from({ length: INITIAL_LIMIT }, (_, i) => `数据项 ${i + 1}`)
    hasMore.value = true
    infiniteScrollRef.value?.resetLoading()
}
</script>

<template>
    <div class="space-y-4 w-full max-w-sm">
        <div class="flex items-center justify-between">
            <span class="text-sm font-bold text-brutal-fg">已加载：{{ items.length }} / {{ MAX_LIMIT }}</span>
            <Button size="sm" variant="outline" @click="handleReset">重置数据</Button>
        </div>

        <!-- 滚动容器 -->
        <div class="h-64 overflow-y-auto border-3 border-brutal rounded-brutal bg-brutal-muted/5">
            <InfiniteScroll
                ref="infiniteScrollRef"
                :disabled="!hasMore"
                @load="loadMore"
            >
                <div
                    v-for="item in items"
                    :key="item"
                    class="p-3 border-b-2 border-brutal text-sm font-medium text-brutal-fg bg-brutal-bg"
                >
                    {{ item }}
                </div>

                <!-- 结束状态提示 -->
                <div v-if="!hasMore" class="p-4 text-center text-xs font-bold text-brutal-placeholder bg-brutal-bg">
                    🎉 已加载全部数据
                </div>
            </InfiniteScroll>
        </div>
    </div>
</template>
