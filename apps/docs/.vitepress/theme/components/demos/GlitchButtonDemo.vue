<script setup lang="ts">
import { ref } from 'vue'
import { Button } from 'brutx-ui-vue'

const glitchRef = ref<{ play: () => void; stop: () => void } | null>(null)
</script>

<template>
    <div class="space-y-6">
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">变体</p>
            <div class="flex flex-wrap items-center gap-3">
                <Button effect="glitch">默认</Button>
                <Button effect="glitch" variant="primary">主要</Button>
                <Button effect="glitch" variant="secondary">次要</Button>
                <Button effect="glitch" variant="accent">强调</Button>
                <Button effect="glitch" variant="danger">危险</Button>
                <Button effect="glitch" variant="success">成功</Button>
                <Button effect="glitch" variant="outline">轮廓</Button>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">触发模式</p>
            <div class="flex flex-wrap items-center gap-3">
                <Button effect="glitch" variant="primary" glitch-trigger="hover">悬停触发</Button>
                <Button effect="glitch" variant="primary" glitch-trigger="click">点击切换</Button>
                <Button effect="glitch" variant="primary" glitch-trigger="autoplay" :glitch-interval="2000">自动播放</Button>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">速度变体（点击查看）</p>
            <div class="flex flex-wrap items-center gap-3">
                <Button effect="glitch" glitch-trigger="click" glitch-speed="slow">慢</Button>
                <Button effect="glitch" glitch-trigger="click" glitch-speed="medium">中</Button>
                <Button effect="glitch" glitch-trigger="click" glitch-speed="fast">快</Button>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">撕裂方向（点击查看）</p>
            <div class="flex flex-wrap items-center gap-3">
                <Button effect="glitch" glitch-trigger="click" glitch-direction="horizontal" data-text="水平">水平</Button>
                <Button effect="glitch" glitch-trigger="click" glitch-direction="vertical" data-text="垂直">垂直</Button>
                <Button effect="glitch" glitch-trigger="click" glitch-direction="both" data-text="双向">双向</Button>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">尺寸</p>
            <div class="flex flex-wrap items-center gap-3">
                <Button effect="glitch" size="sm" variant="secondary">小</Button>
                <Button effect="glitch" size="default" variant="secondary">默认</Button>
                <Button effect="glitch" size="lg" variant="secondary">大</Button>
                <Button effect="glitch" size="xl" variant="secondary">超大</Button>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">手动控制（glitch-trigger="none"）</p>
            <div class="flex flex-wrap items-center gap-3">
                <Button ref="glitchRef" effect="glitch" variant="accent" glitch-trigger="none" glitch-speed="fast">
                    手动
                </Button>
                <Button size="sm" @click="glitchRef?.play()">播放</Button>
                <Button size="sm" variant="outline" @click="glitchRef?.stop()">停止</Button>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">状态</p>
            <div class="flex flex-wrap items-center gap-3">
                <Button effect="glitch" :loading="true" variant="primary">加载中</Button>
                <Button effect="glitch" disabled variant="primary">禁用</Button>
            </div>
        </div>
    </div>
</template>
