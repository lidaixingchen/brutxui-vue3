<script setup lang="ts">
import { ColorModeSwitcher } from 'brutx-ui-vue'
</script>

<template>
    <div class="space-y-6">
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">图标模式（默认）</p>
            <ColorModeSwitcher />
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">按钮模式</p>
            <ColorModeSwitcher display="button" />
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">选择模式</p>
            <ColorModeSwitcher display="select" />
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">不包含系统选项</p>
            <ColorModeSwitcher display="button" :show-system="false" />
        </div>
    </div>
</template>