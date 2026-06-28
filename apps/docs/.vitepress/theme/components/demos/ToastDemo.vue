<script setup lang="ts">
import { useToast, ToastContainer, Toast, Button } from 'brutx-ui-vue'

const { toasts, removeToast, addToast, success, error, warning, info } = useToast()
</script>

<template>
    <div class="space-y-6">
        <div class="space-y-2">
            <p class="font-black text-sm">变体</p>
            <div class="flex flex-wrap items-center gap-3">
                <Button @click="addToast({ variant: 'default', title: '默认', description: '这是一条默认提示。' })">默认</Button>
                <Button @click="success('成功', '操作已成功完成。')">成功</Button>
                <Button @click="error('错误', '发生了一些错误。')">错误</Button>
                <Button @click="warning('警告', '请小心操作。')">警告</Button>
                <Button @click="info('提示', '这是一条有用的信息。')">提示</Button>
            </div>
        </div>

        <div class="space-y-2">
            <p class="font-black text-sm">尺寸</p>
            <div class="flex flex-wrap items-center gap-3">
                <Button @click="addToast({ variant: 'success', size: 'sm', title: '小', description: '紧凑型提示。' })">小</Button>
                <Button @click="addToast({ variant: 'success', size: 'default', title: '默认', description: '标准提示。' })">默认</Button>
                <Button @click="addToast({ variant: 'success', size: 'lg', title: '大', description: '宽敞型提示。' })">大</Button>
            </div>
        </div>

        <ToastContainer position="bottom-right">
            <Toast
                v-for="toast in toasts"
                :key="toast.id"
                :variant="toast.variant"
                :size="toast.size"
                :title="toast.title"
                :description="toast.description"
                :duration="toast.duration"
                @close="removeToast(toast.id)"
            />
        </ToastContainer>
    </div>
</template>
