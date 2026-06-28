<script setup lang="ts">
import { ref } from 'vue'
import { Switch } from 'brutx-ui-vue'

const enabled = ref(false)
const primaryEnabled = ref(true)
const dangerEnabled = ref(false)
</script>

<template>
    <div class="flex flex-col gap-4">
        <div class="flex items-center gap-3">
            <Switch v-model="enabled" />
            <span class="text-sm font-bold">{{ enabled ? '已启用' : '已禁用' }}</span>
        </div>
        <div class="flex items-center gap-3">
            <Switch v-model="primaryEnabled" variant="primary" />
            <span class="text-sm font-bold">主要</span>
        </div>
        <div class="flex items-center gap-3">
            <Switch v-model="dangerEnabled" variant="danger" />
            <span class="text-sm font-bold">危险</span>
        </div>
    </div>
</template>
