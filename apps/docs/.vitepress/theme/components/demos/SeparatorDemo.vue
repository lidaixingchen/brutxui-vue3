<script setup lang="ts">
import { Separator } from 'brutx-ui-vue'
</script>

<template>
    <div class="space-y-4">
        <p class="text-sm font-bold">水平分隔线</p>
        <div>
            <p class="text-sm">Content above</p>
            <Separator />
            <p class="text-sm">Content below</p>
        </div>

        <p class="text-sm font-bold">垂直分隔线</p>
        <div class="flex items-center h-8">
            <span class="text-sm">Left</span>
            <Separator orientation="vertical" />
            <span class="text-sm">Center</span>
            <Separator orientation="vertical" />
            <span class="text-sm">Right</span>
        </div>
    </div>
</template>
