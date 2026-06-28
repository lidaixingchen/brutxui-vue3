<script setup lang="ts">
import { Badge } from 'brutx-ui-vue'
</script>

<template>
    <div class="space-y-6">
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">变体</p>
            <div class="flex flex-wrap items-center gap-2">
                <Badge>默认</Badge>
                <Badge variant="primary">主要</Badge>
                <Badge variant="secondary">次要</Badge>
                <Badge variant="accent">强调</Badge>
                <Badge variant="danger">危险</Badge>
                <Badge variant="success">成功</Badge>
                <Badge variant="outline">轮廓</Badge>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">尺寸</p>
            <div class="flex flex-wrap items-center gap-2">
                <Badge size="sm">小</Badge>
                <Badge size="default">默认</Badge>
                <Badge size="lg">大</Badge>
            </div>
        </div>
    </div>
</template>
