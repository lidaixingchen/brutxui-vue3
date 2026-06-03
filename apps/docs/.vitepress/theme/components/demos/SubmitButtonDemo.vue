<script setup lang="ts">
import { SubmitButton } from 'brutx-ui-vue'
</script>

<template>
    <div class="space-y-8">
        <div>
            <h3 class="text-sm font-black mb-3">变体</h3>
            <div class="flex flex-wrap items-center gap-3">
                <SubmitButton variant="default">Default</SubmitButton>
                <SubmitButton variant="primary">Primary</SubmitButton>
                <SubmitButton variant="secondary">Secondary</SubmitButton>
                <SubmitButton variant="accent">Accent</SubmitButton>
                <SubmitButton variant="danger">Danger</SubmitButton>
                <SubmitButton variant="success">Success</SubmitButton>
                <SubmitButton variant="outline">Outline</SubmitButton>
                <SubmitButton variant="ghost">Ghost</SubmitButton>
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">尺寸</h3>
            <div class="flex flex-wrap items-center gap-3">
                <SubmitButton size="sm">Small</SubmitButton>
                <SubmitButton size="default">Default</SubmitButton>
                <SubmitButton size="lg">Large</SubmitButton>
                <SubmitButton size="xl">Extra Large</SubmitButton>
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">加载状态</h3>
            <div class="flex flex-wrap items-center gap-3">
                <SubmitButton :loading="true">Submit</SubmitButton>
                <SubmitButton :loading="true" pending-text="处理中...">Submit</SubmitButton>
                <SubmitButton :loading="true" variant="primary" pending-text="保存中...">Submit</SubmitButton>
                <SubmitButton :loading="true" variant="secondary" pending-text="上传中...">Submit</SubmitButton>
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">禁用状态</h3>
            <div class="flex flex-wrap items-center gap-3">
                <SubmitButton :disabled="true">Disabled</SubmitButton>
                <SubmitButton :disabled="true" variant="primary">Disabled</SubmitButton>
                <SubmitButton :disabled="true" variant="danger">Disabled</SubmitButton>
            </div>
        </div>
    </div>
</template>
