<script setup lang="ts">
import { Progress } from 'brutx-ui-vue'
</script>

<template>
    <div class="flex flex-col gap-4 w-full max-w-sm">
        <Progress :model-value="70" />
        <Progress :model-value="45" variant="secondary" />
        <Progress :model-value="30" variant="danger" size="sm" />

        <div class="space-y-2 pt-2">
            <p class="text-sm font-bold tracking-wide">不确定状态</p>
            <Progress indeterminate />
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">显示百分比标签</p>
            <Progress :model-value="65" show-label />
        </div>
    </div>
</template>
