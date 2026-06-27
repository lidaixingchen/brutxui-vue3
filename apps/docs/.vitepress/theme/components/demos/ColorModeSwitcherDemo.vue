<script setup lang="ts">
import { ColorModeSwitcher } from 'brutx-ui-vue'
</script>

<template>
    <div class="space-y-6">
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">Icon Mode (default)</p>
            <ColorModeSwitcher />
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">Button Mode</p>
            <ColorModeSwitcher display="button" />
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">Select Mode</p>
            <ColorModeSwitcher display="select" />
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">Without System Option</p>
            <ColorModeSwitcher display="button" :show-system="false" />
        </div>
    </div>
</template>