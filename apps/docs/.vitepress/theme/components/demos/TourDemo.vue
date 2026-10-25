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
            <Button id="tour-step-1" variant="primary" size="sm">
                导航
            </Button>
            <Button id="tour-step-2" variant="accent" size="sm">
                操作区
            </Button>
            <Button id="tour-step-3" variant="default" size="sm" class="ml-auto bg-brutal-muted">
                ⚙ 设置
            </Button>
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
