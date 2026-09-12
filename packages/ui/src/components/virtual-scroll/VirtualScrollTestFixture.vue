<script setup lang="ts">
import { ref, type ComponentPublicInstance } from 'vue'
import VirtualScroll from './VirtualScroll.vue'

interface TestItem {
    id: number
    title: string
}

const items = ref<TestItem[]>(
    Array.from({ length: 500 }, (_, i) => ({
        id: i,
        title: `Item #${i}`,
    }))
)

const virtualScrollRef = ref<ComponentPublicInstance | null>(null)

defineExpose({
    items,
    virtualScrollRef,
})
</script>

<template>
    <div class="p-4">
        <VirtualScroll
            ref="virtualScrollRef"
            :items="items"
            :item-height="40"
            style="height: 300px; width: 400px; overflow-y: auto;"
            class="border-2 border-black"
        >
            <template #default="{ item, index }">
                <div :data-index="index" class="h-10 p-2 border-b flex items-center">
                    {{ item.title }}
                </div>
            </template>
        </VirtualScroll>
    </div>
</template>
