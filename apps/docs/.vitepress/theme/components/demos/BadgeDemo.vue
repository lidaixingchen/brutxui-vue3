<script setup lang="ts">
import { Badge } from 'brutx-ui-vue'
</script>

<template>
    <div class="space-y-6">
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">Variants</p>
            <div class="flex flex-wrap items-center gap-2">
                <Badge>Default</Badge>
                <Badge variant="primary">Primary</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="accent">Accent</Badge>
                <Badge variant="danger">Destructive</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="outline">Outline</Badge>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">Sizes</p>
            <div class="flex flex-wrap items-center gap-2">
                <Badge size="sm">Small</Badge>
                <Badge size="default">Default</Badge>
                <Badge size="lg">Large</Badge>
            </div>
        </div>
    </div>
</template>
