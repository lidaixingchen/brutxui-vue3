<script setup lang="ts">
import { Button } from 'brutx-ui-vue'
import { Mail } from '@lucide/vue'
</script>

<template>
    <div class="space-y-6">
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">变体</p>
            <div class="flex flex-wrap items-center gap-3">
                <Button>默认</Button>
                <Button variant="primary">主要</Button>
                <Button variant="secondary">次要</Button>
                <Button variant="accent">强调</Button>
                <Button variant="danger">危险</Button>
                <Button variant="success">成功</Button>
                <Button variant="outline">轮廓</Button>
                <Button variant="ghost">幽灵</Button>
                <Button variant="link">链接</Button>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">尺寸</p>
            <div class="flex flex-wrap items-center gap-3">
                <Button size="sm">小</Button>
                <Button size="default">默认</Button>
                <Button size="lg">大</Button>
                <Button size="xl">超大</Button>
                <Button size="icon"><Mail class="h-4 w-4" /></Button>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">状态</p>
            <div class="flex flex-wrap items-center gap-3">
                <Button :loading="true">加载中</Button>
                <Button disabled>禁用</Button>
            </div>
        </div>
    </div>
</template>
