<script setup lang="ts">
import { ref } from 'vue'
import { useToast, ToastContainer, Toast, Button } from 'brutx-ui-vue'

const { toasts, removeToast, addToast, success, error, warning, info } = useToast()

const pauseOnHover = ref(true)
</script>

<template>
    <div class="space-y-6">
        <div class="space-y-2">
            <p class="font-black text-sm">变体</p>
            <div class="flex flex-wrap items-center gap-3">
                <Button @click="addToast({ variant: 'default', title: '默认', description: '这是一条默认提示。' })">默认</Button>
                <Button variant="success" @click="success('成功', '操作已成功完成。')">成功</Button>
                <Button variant="danger" @click="error('错误', '发生了一些错误。')">错误</Button>
                <Button variant="primary" @click="warning('警告', '请小心操作。')">警告</Button>
                <Button variant="secondary" @click="info('提示', '这是一条有用的信息。')">提示</Button>
            </div>
        </div>

        <div class="space-y-2">
            <p class="font-black text-sm">尺寸</p>
            <div class="flex flex-wrap items-center gap-3">
                <Button variant="outline" size="sm" @click="addToast({ variant: 'success', size: 'sm', title: '小', description: '紧凑型提示。' })">小</Button>
                <Button variant="outline" size="default" @click="addToast({ variant: 'success', size: 'default', title: '默认', description: '标准提示。' })">默认</Button>
                <Button variant="outline" size="lg" @click="addToast({ variant: 'success', size: 'lg', title: '大', description: '宽敞型提示。' })">大</Button>
            </div>
        </div>

        <div class="space-y-2">
            <p class="font-black text-sm">悬停暂停（pauseOnHover）</p>
            <p class="text-xs opacity-70 leading-relaxed">
                将鼠标悬停在提示上可暂停倒计时与进度条，移出后从剩余时间继续。点击下方按钮显示一条 10 秒提示进行体验，可切换开关对比行为。
            </p>
            <div class="flex flex-wrap items-center gap-3">
                <Button variant="accent" @click="addToast({ variant: 'info', title: '悬停我', description: '把鼠标移到这条提示上，倒计时会暂停。', duration: 10000 })">
                    显示 10 秒提示
                </Button>
                <Button
                    :variant="pauseOnHover ? 'default' : 'outline'"
                    @click="pauseOnHover = !pauseOnHover"
                >
                    pauseOnHover: {{ pauseOnHover }}
                </Button>
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
                :pause-on-hover="pauseOnHover"
                @close="removeToast(toast.id)"
            />
        </ToastContainer>
    </div>
</template>
