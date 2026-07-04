<script setup lang="ts">
import { ref } from 'vue'
import { Tour, Button } from 'brutx-ui-vue'
import type { TourStep } from 'brutx-ui-vue'

const tourOpen = ref(false)

const steps: TourStep[] = [
    {
        target: '#tour-step-1',
        title: '第一步：导航',
        description: '这是导航区域，点击可切换页面。',
        placement: 'bottom',
    },
    {
        target: '#tour-step-2',
        title: '第二步：操作区',
        description: '在这里可以进行主要操作。',
        placement: 'right',
    },
    {
        target: '#tour-step-3',
        title: '第三步：设置',
        description: '点击齿轮图标进入设置页面。',
        placement: 'left',
    },
]
</script>

<template>
    <div class="space-y-8">
        <div class="flex flex-wrap gap-6 p-6 border-2 border-brutal rounded-brutal">
            <div id="tour-step-1" class="px-4 py-2 border-2 border-brutal rounded-brutal font-black text-sm bg-brutal-primary text-brutal-fg">
                导航
            </div>
            <div id="tour-step-2" class="px-4 py-2 border-2 border-brutal rounded-brutal font-black text-sm bg-brutal-accent text-brutal-fg">
                操作区
            </div>
            <div id="tour-step-3" class="ml-auto px-4 py-2 border-2 border-brutal rounded-brutal font-black text-sm bg-brutal-muted">
                ⚙ 设置
            </div>
        </div>

        <div class="flex justify-center">
            <Button variant="default" @click="tourOpen = true">
                开始导览
            </Button>
        </div>

        <Tour
            v-model:open="tourOpen"
            :steps="steps"
        />
    </div>
</template>
