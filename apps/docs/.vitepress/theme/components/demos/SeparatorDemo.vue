<script setup lang="ts">
import { Separator } from 'brutx-ui-vue'
</script>

<template>
    <div class="space-y-4">
        <p class="text-sm font-bold">水平分隔线</p>
        <div>
            <p class="text-sm">上方内容</p>
            <Separator />
            <p class="text-sm">下方内容</p>
        </div>

        <p class="text-sm font-bold">垂直分隔线</p>
        <div class="flex items-center h-8">
            <span class="text-sm">左侧</span>
            <Separator orientation="vertical" />
            <span class="text-sm">中间</span>
            <Separator orientation="vertical" />
            <span class="text-sm">右侧</span>
        </div>

        <p class="text-sm font-bold tracking-wide">变体</p>
        <div class="space-y-2">
            <Separator variant="default" />
            <Separator variant="primary" />
            <Separator variant="muted" />
        </div>

        <p class="text-sm font-bold tracking-wide">尺寸</p>
        <div class="space-y-2">
            <Separator size="sm" />
            <Separator size="default" />
            <Separator size="lg" />
        </div>

        <p class="text-sm font-bold tracking-wide">文字分隔线</p>
        <Separator>章节标题</Separator>
        <Separator variant="primary" size="lg">主色标题</Separator>
    </div>
</template>
