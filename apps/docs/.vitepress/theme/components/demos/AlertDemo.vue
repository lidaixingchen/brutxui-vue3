<script setup lang="ts">
import { Alert, AlertTitle, AlertDescription } from 'brutx-ui-vue'
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
    </div>
</template>
