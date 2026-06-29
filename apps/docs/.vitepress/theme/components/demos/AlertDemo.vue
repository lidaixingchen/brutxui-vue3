<script setup lang="ts">
import { ref } from 'vue'
import { Alert, AlertTitle, AlertDescription, Button } from 'brutx-ui-vue'

const closableVisible = ref(true)

function handleClose() {
    closableVisible.value = false
}
</script>

<template>
    <div class="flex flex-col gap-4 w-full max-w-lg">
        <Alert variant="default">
            <AlertTitle>默认</AlertTitle>
            <AlertDescription>这是一条默认提示信息。</AlertDescription>
        </Alert>
        <Alert variant="primary">
            <AlertTitle>主要</AlertTitle>
            <AlertDescription>这是一条重要提示信息。</AlertDescription>
        </Alert>
        <Alert variant="danger">
            <AlertTitle>危险</AlertTitle>
            <AlertDescription>这是一条危险警告信息。</AlertDescription>
        </Alert>

        <Alert v-if="closableVisible" variant="info" closable @close="handleClose">
            <AlertTitle>可关闭的提示</AlertTitle>
            <AlertDescription>点击右上角的 × 按钮可以关闭此提示。</AlertDescription>
        </Alert>

        <Alert variant="warning">
            <AlertTitle>存储空间不足</AlertTitle>
            <AlertDescription>您的存储空间已使用 90%，请及时清理或升级。</AlertDescription>
            <template #actions>
                <Button variant="primary" size="sm">立即升级</Button>
                <Button variant="outline" size="sm">稍后提醒</Button>
            </template>
        </Alert>
    </div>
</template>
