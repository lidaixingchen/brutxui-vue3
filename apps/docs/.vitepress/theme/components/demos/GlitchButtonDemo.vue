<script setup lang="ts">
import { ref } from 'vue'
import { GlitchButton, Button } from 'brutx-ui-vue'

const glitchRef = ref<InstanceType<typeof GlitchButton> | null>(null)
</script>

<template>
    <div class="space-y-6">
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">变体</p>
            <div class="flex flex-wrap items-center gap-3">
                <GlitchButton>默认</GlitchButton>
                <GlitchButton variant="primary">主要</GlitchButton>
                <GlitchButton variant="secondary">次要</GlitchButton>
                <GlitchButton variant="accent">强调</GlitchButton>
                <GlitchButton variant="danger">危险</GlitchButton>
                <GlitchButton variant="success">成功</GlitchButton>
                <GlitchButton variant="outline">轮廓</GlitchButton>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">触发模式</p>
            <div class="flex flex-wrap items-center gap-3">
                <GlitchButton variant="primary" trigger="hover">Hover 触发</GlitchButton>
                <GlitchButton variant="primary" trigger="click">Click 切换</GlitchButton>
                <GlitchButton variant="primary" trigger="autoplay" :interval="2000">Autoplay 自动</GlitchButton>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">速度变体（Click 切换查看）</p>
            <div class="flex flex-wrap items-center gap-3">
                <GlitchButton trigger="click" speed="slow">慢</GlitchButton>
                <GlitchButton trigger="click" speed="medium">中</GlitchButton>
                <GlitchButton trigger="click" speed="fast">快</GlitchButton>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">撕裂方向（Click 切换查看）</p>
            <div class="flex flex-wrap items-center gap-3">
                <GlitchButton trigger="click" direction="horizontal" data-text="HORIZONTAL">HORIZONTAL</GlitchButton>
                <GlitchButton trigger="click" direction="vertical" data-text="VERTICAL">VERTICAL</GlitchButton>
                <GlitchButton trigger="click" direction="both" data-text="BOTH">BOTH</GlitchButton>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">尺寸</p>
            <div class="flex flex-wrap items-center gap-3">
                <GlitchButton size="sm" variant="secondary">小</GlitchButton>
                <GlitchButton size="default" variant="secondary">默认</GlitchButton>
                <GlitchButton size="lg" variant="secondary">大</GlitchButton>
                <GlitchButton size="xl" variant="secondary">超大</GlitchButton>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">手动控制（trigger="none"）</p>
            <div class="flex flex-wrap items-center gap-3">
                <GlitchButton ref="glitchRef" variant="accent" trigger="none" speed="fast">
                    MANUAL
                </GlitchButton>
                <Button size="sm" @click="glitchRef?.play()">Play</Button>
                <Button size="sm" variant="outline" @click="glitchRef?.stop()">Stop</Button>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">状态</p>
            <div class="flex flex-wrap items-center gap-3">
                <GlitchButton :loading="true" variant="primary">加载中</GlitchButton>
                <GlitchButton disabled variant="primary">禁用</GlitchButton>
            </div>
        </div>
    </div>
</template>
