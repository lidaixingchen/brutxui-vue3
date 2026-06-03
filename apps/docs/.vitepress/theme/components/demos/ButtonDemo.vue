<script setup lang="ts">
import { Button } from 'brutx-ui-vue'
import { Mail } from 'lucide-vue-next'
</script>

<template>
    <div class="space-y-6">
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">Variants</p>
            <div class="flex flex-wrap items-center gap-3">
                <Button>Default</Button>
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="accent">Accent</Button>
                <Button variant="danger">Destructive</Button>
                <Button variant="success">Success</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">Sizes</p>
            <div class="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="xl">Extra Large</Button>
                <Button size="icon"><Mail class="h-4 w-4" /></Button>
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">States</p>
            <div class="flex flex-wrap items-center gap-3">
                <Button :loading="true">Loading</Button>
                <Button disabled>Disabled</Button>
            </div>
        </div>
    </div>
</template>
