<script setup lang="ts">
import { ref } from 'vue'
import { GlitchText, Button } from 'brutx-ui-vue'

const glitchRef = ref<InstanceType<typeof GlitchText> | null>(null)
</script>

<template>
    <div class="flex flex-col gap-8">
        <div>
            <p class="text-sm font-bold mb-2">Hover 触发（默认）</p>
            <GlitchText text="BRUTAL GLITCH" class="text-4xl" />
        </div>

        <div>
            <p class="text-sm font-bold mb-2">Click 触发</p>
            <GlitchText text="CLICK ME" trigger="click" speed="fast" class="text-3xl" />
        </div>

        <div>
            <p class="text-sm font-bold mb-2">Autoplay 自动播放</p>
            <GlitchText text="AUTO GLITCH" trigger="autoplay" speed="slow" class="text-3xl" />
        </div>

        <div>
            <p class="text-sm font-bold mb-2">Speed 变体</p>
            <div class="flex gap-4 items-end">
                <GlitchText text="SLOW" trigger="click" speed="slow" class="text-2xl" />
                <GlitchText text="MEDIUM" trigger="click" speed="medium" class="text-2xl" />
                <GlitchText text="FAST" trigger="click" speed="fast" class="text-2xl" />
            </div>
        </div>

        <div>
            <p class="text-sm font-bold mb-2">Direction 撕裂方向（Click 切换查看）</p>
            <div class="flex flex-wrap gap-6 items-center">
                <GlitchText text="HORIZONTAL" trigger="click" direction="horizontal" class="text-3xl" />
                <GlitchText text="VERTICAL" trigger="click" direction="vertical" class="text-3xl" />
                <GlitchText text="BOTH" trigger="click" direction="both" class="text-3xl" />
            </div>
        </div>

        <div>
            <p class="text-sm font-bold mb-2">自定义间隔 (interval=1000ms)</p>
            <GlitchText text="SLOW INTERVAL" trigger="autoplay" :interval="1000" speed="medium" class="text-3xl" />
        </div>

        <div>
            <p class="text-sm font-bold mb-2">手动控制 (trigger="none")</p>
            <div class="flex flex-wrap items-center gap-3">
                <GlitchText ref="glitchRef" text="MANUAL" trigger="none" speed="fast" class="text-3xl" />
                <Button size="sm" @click="glitchRef?.play()">Play</Button>
                <Button size="sm" variant="outline" @click="glitchRef?.stop()">Stop</Button>
            </div>
        </div>
    </div>
</template>
