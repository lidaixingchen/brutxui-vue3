<script setup lang="ts">
import { ref } from 'vue'
import { GlitchText, Button } from 'brutx-ui-vue'

const glitchRef = ref<InstanceType<typeof GlitchText> | null>(null)
</script>

<template>
    <div class="flex flex-col gap-8">
        <div>
            <p class="text-sm font-bold mb-2">悬停触发（默认）</p>
            <GlitchText text="残影闪烁" class="text-4xl" />
        </div>

        <div>
            <p class="text-sm font-bold mb-2">点击触发</p>
            <GlitchText text="点击我" trigger="click" speed="fast" class="text-3xl" />
        </div>

        <div>
            <p class="text-sm font-bold mb-2">自动播放</p>
            <GlitchText text="自动闪烁" trigger="autoplay" speed="slow" class="text-3xl" />
        </div>

        <div>
            <p class="text-sm font-bold mb-2">速度变体</p>
            <div class="flex gap-4 items-end">
                <GlitchText text="慢速" trigger="click" speed="slow" class="text-2xl" />
                <GlitchText text="中速" trigger="click" speed="medium" class="text-2xl" />
                <GlitchText text="快速" trigger="click" speed="fast" class="text-2xl" />
            </div>
        </div>

        <div>
            <p class="text-sm font-bold mb-2">撕裂方向（点击切换查看）</p>
            <div class="flex flex-wrap gap-6 items-center">
                <GlitchText text="水平" trigger="click" direction="horizontal" class="text-3xl" />
                <GlitchText text="垂直" trigger="click" direction="vertical" class="text-3xl" />
                <GlitchText text="双向" trigger="click" direction="both" class="text-3xl" />
            </div>
        </div>

        <div>
            <p class="text-sm font-bold mb-2">自定义间隔 (interval=1000ms)</p>
            <GlitchText text="慢速间隔" trigger="autoplay" :interval="1000" speed="medium" class="text-3xl" />
        </div>

        <div>
            <p class="text-sm font-bold mb-2">手动控制 (trigger="none")</p>
            <div class="flex flex-wrap items-center gap-3">
                <GlitchText ref="glitchRef" text="手动" trigger="none" speed="fast" class="text-3xl" />
                <Button size="sm" @click="glitchRef?.play()">播放</Button>
                <Button size="sm" variant="outline" @click="glitchRef?.stop()">停止</Button>
            </div>
        </div>
    </div>
</template>
