<script setup lang="ts">
import { CopyToClipboard } from 'brutx-ui-vue'
</script>

<template>
    <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-3 items-start">
            <CopyToClipboard text="pnpm add brutx-ui-vue" />
            <CopyToClipboard text="Hello Neo-Brutalism!" class="bg-brutal-accent text-brutal-fg" />
        </div>

        <div class="flex flex-col gap-3">
            <p class="text-sm font-bold opacity-60">变体</p>
            <div class="flex flex-wrap items-center gap-3">
                <CopyToClipboard text="default" variant="default" />
                <CopyToClipboard text="primary" variant="primary" />
                <CopyToClipboard text="outline" variant="outline" />
            </div>
        </div>

        <div class="flex flex-col gap-3">
            <p class="text-sm font-bold opacity-60">尺寸</p>
            <div class="flex flex-wrap items-center gap-3">
                <CopyToClipboard text="sm" size="sm" />
                <CopyToClipboard text="default" size="default" />
                <CopyToClipboard text="lg" size="lg" />
            </div>
        </div>
    </div>
</template>
