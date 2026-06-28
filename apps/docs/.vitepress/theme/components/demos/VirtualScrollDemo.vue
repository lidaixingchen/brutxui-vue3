<script setup lang="ts">
import { ref } from 'vue'
import { VirtualScroll } from 'brutx-ui-vue'

interface Item {
    id: number
    name: string
}

const items = ref<Item[]>(
    Array.from({ length: 5000 }, (_, i) => ({
        id: i,
        name: `项目 ${i + 1}`,
    }))
)

const stripedItems = ref<Item[]>(
    Array.from({ length: 2000 }, (_, i) => ({
        id: i,
        name: `条纹项目 ${i + 1}`,
    }))
)

const borderedItems = ref<Item[]>(
    Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `带边框行 ${i + 1}`,
    }))
)
</script>

<template>
    <div class="space-y-8 w-full">
        <div>
            <h3 class="text-sm font-black mb-3">基础用法（{{ items.length }} 条数据）</h3>
            <VirtualScroll :items="items" :item-height="48" size="sm">
                <template #default="{ item, index }">
                    <div class="flex items-center justify-between px-4 py-3 text-sm">
                        <span class="font-bold">{{ item.name }}</span>
                        <span class="text-brutal-fg/50">#{{ index + 1 }}</span>
                    </div>
                </template>
            </VirtualScroll>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">斑马纹列表（striped）</h3>
            <VirtualScroll :items="stripedItems" :item-height="44" variant="striped" size="sm">
                <template #default="{ item }">
                    <div class="px-4 py-3 text-sm font-bold">{{ item.name }}</div>
                </template>
            </VirtualScroll>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">带边框列表（bordered）</h3>
            <VirtualScroll :items="borderedItems" :item-height="48" variant="bordered" size="sm">
                <template #default="{ item, index }">
                    <div class="flex items-center gap-3 px-4 py-3 text-sm">
                        <span class="inline-flex h-6 w-6 items-center justify-center border-2 border-brutal bg-brutal-accent text-xs font-black">
                            {{ index + 1 }}
                        </span>
                        <span class="font-bold">{{ item.name }}</span>
                    </div>
                </template>
            </VirtualScroll>
        </div>
    </div>
</template>
