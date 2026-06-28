<script setup lang="ts">
import { SubmitButton } from 'brutx-ui-vue'
</script>

<template>
    <div class="space-y-8">
        <div>
            <h3 class="text-sm font-black mb-3">变体</h3>
            <div class="flex flex-wrap items-center gap-3">
                <SubmitButton variant="default">默认</SubmitButton>
                <SubmitButton variant="primary">主要</SubmitButton>
                <SubmitButton variant="secondary">次要</SubmitButton>
                <SubmitButton variant="accent">强调</SubmitButton>
                <SubmitButton variant="danger">危险</SubmitButton>
                <SubmitButton variant="success">成功</SubmitButton>
                <SubmitButton variant="outline">轮廓</SubmitButton>
                <SubmitButton variant="ghost">幽灵</SubmitButton>
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">尺寸</h3>
            <div class="flex flex-wrap items-center gap-3">
                <SubmitButton size="sm">小</SubmitButton>
                <SubmitButton size="default">默认</SubmitButton>
                <SubmitButton size="lg">大</SubmitButton>
                <SubmitButton size="xl">超大</SubmitButton>
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">加载状态</h3>
            <div class="flex flex-wrap items-center gap-3">
                <SubmitButton :loading="true">提交</SubmitButton>
                <SubmitButton :loading="true" pending-text="处理中...">提交</SubmitButton>
                <SubmitButton :loading="true" variant="primary" pending-text="保存中...">提交</SubmitButton>
                <SubmitButton :loading="true" variant="secondary" pending-text="上传中...">提交</SubmitButton>
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">禁用状态</h3>
            <div class="flex flex-wrap items-center gap-3">
                <SubmitButton :disabled="true">禁用</SubmitButton>
                <SubmitButton :disabled="true" variant="primary">禁用</SubmitButton>
                <SubmitButton :disabled="true" variant="danger">禁用</SubmitButton>
            </div>
        </div>
    </div>
</template>
