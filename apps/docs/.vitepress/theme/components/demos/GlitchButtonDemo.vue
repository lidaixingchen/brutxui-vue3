<script setup lang="ts">
import { ref } from 'vue'
import { GlitchButton, Button } from 'brutx-ui-vue'

const glitchRef = ref<InstanceType<typeof GlitchButton> | null>(null)
</script>

<template>
    <div class="space-y-6">
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">Variants</p>
            <div class="flex flex-wrap items-center gap-3">
                <GlitchButton>Default</GlitchButton>
                <GlitchButton variant="primary">Primary</GlitchButton>
                <GlitchButton variant="secondary">Secondary</GlitchButton>
                <GlitchButton variant="accent">Accent</GlitchButton>
                <GlitchButton variant="danger">Danger</GlitchButton>
                <GlitchButton variant="success">Success</GlitchButton>
                <GlitchButton variant="outline">Outline</GlitchButton>
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
                <GlitchButton trigger="click" speed="slow">Slow</GlitchButton>
                <GlitchButton trigger="click" speed="medium">Medium</GlitchButton>
                <GlitchButton trigger="click" speed="fast">Fast</GlitchButton>
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
                <GlitchButton size="sm" variant="secondary">Small</GlitchButton>
                <GlitchButton size="default" variant="secondary">Default</GlitchButton>
                <GlitchButton size="lg" variant="secondary">Large</GlitchButton>
                <GlitchButton size="xl" variant="secondary">Extra Large</GlitchButton>
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
                <GlitchButton :loading="true" variant="primary">Loading</GlitchButton>
                <GlitchButton disabled variant="primary">Disabled</GlitchButton>
            </div>
        </div>
    </div>
</template>
