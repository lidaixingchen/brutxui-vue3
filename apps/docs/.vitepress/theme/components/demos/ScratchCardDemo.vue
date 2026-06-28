<script setup lang="ts">
import { ref } from 'vue'
import { ScratchCard, Button } from 'brutx-ui-vue'

const scratchRef = ref<InstanceType<typeof ScratchCard> | null>(null)
</script>

<template>
    <div class="flex flex-col gap-8 items-center">
        <ScratchCard class="w-full max-w-sm h-48">
            <div class="flex items-center justify-center h-full bg-brutal-accent">
                <p class="text-2xl font-black">🎉 恭喜中奖！</p>
            </div>
        </ScratchCard>

        <ScratchCard class="w-full max-w-sm h-48" :percentage="30" overlay-color="#FFE66D">
            <div class="flex items-center justify-center h-full bg-brutal-success">
                <p class="text-2xl font-black">自定义底色</p>
            </div>
        </ScratchCard>

        <div>
            <p class="text-sm font-bold mb-2">大笔刷 (brushRadius=40)</p>
            <ScratchCard class="w-full max-w-sm h-48" :brush-radius="40">
                <div class="flex items-center justify-center h-full bg-brutal-secondary">
                    <p class="text-2xl font-black">大笔刷</p>
                </div>
            </ScratchCard>
        </div>

        <div>
            <p class="text-sm font-bold mb-2">渐隐时长 (fadeDuration=1000ms)</p>
            <ScratchCard class="w-full max-w-sm h-48" :fade-duration="1000">
                <div class="flex items-center justify-center h-full bg-brutal-primary">
                    <p class="text-2xl font-black">慢速渐隐</p>
                </div>
            </ScratchCard>
        </div>

        <div>
            <p class="text-sm font-bold mb-2">手动揭示 (revealAll)</p>
            <div class="flex flex-col items-center gap-3">
                <ScratchCard ref="scratchRef" class="w-full max-w-sm h-48">
                    <div class="flex items-center justify-center h-full bg-brutal-info">
                        <p class="text-2xl font-black">一键揭示</p>
                    </div>
                </ScratchCard>
                <Button size="sm" @click="scratchRef?.revealAll()">全部揭示</Button>
            </div>
        </div>
    </div>
</template>
