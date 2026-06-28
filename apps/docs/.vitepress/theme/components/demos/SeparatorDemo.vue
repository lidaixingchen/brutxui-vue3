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
    </div>
</template>
