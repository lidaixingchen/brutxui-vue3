<script setup lang="ts">
import { Label, Input } from 'brutx-ui-vue'
</script>

<template>
    <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-4">
            <Label>默认标签</Label>
            <Label variant="error">错误标签</Label>
            <Label variant="success">成功标签</Label>
            <Label variant="muted">弱化标签</Label>
        </div>

        <div class="flex flex-col gap-3">
            <p class="text-sm font-bold tracking-wide">尺寸</p>
            <div class="flex flex-wrap items-center gap-4">
                <Label size="sm">小号</Label>
                <Label size="default">默认</Label>
                <Label size="lg">大号</Label>
            </div>
        </div>

        <div class="flex flex-col gap-3">
            <p class="text-sm font-bold tracking-wide">必填</p>
            <div class="flex flex-col gap-2">
                <Label for="demo-username" required>用户名</Label>
                <Input id="demo-username" placeholder="请输入用户名" />
                <Label for="demo-email" required variant="error">邮箱</Label>
                <Input id="demo-email" placeholder="you@example.com" />
            </div>
        </div>
    </div>
</template>
