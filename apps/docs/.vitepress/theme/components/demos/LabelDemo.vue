<script setup lang="ts">
import { Label } from 'brutx-ui-vue'
</script>

<template>
    <div class="flex flex-col gap-4">
        <Label>默认标签</Label>
        <Label variant="error">错误标签</Label>
        <Label variant="success">成功标签</Label>
        <Label variant="muted">弱化标签</Label>
    </div>
</template>
