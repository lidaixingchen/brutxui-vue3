<script setup lang="ts">
import { Progress } from 'brutx-ui-vue'
</script>

<template>
    <div class="flex flex-col gap-4 w-full max-w-sm">
        <Progress :model-value="70" />
        <Progress :model-value="45" variant="secondary" />
        <Progress :model-value="30" variant="danger" size="sm" />
    </div>
</template>
