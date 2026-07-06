<script setup lang="ts">
import { ref } from 'vue'
import { FeedbackForm, Button } from 'brutx-ui-vue'

const loading = ref(false)
const success = ref(false)

async function handleSubmit() {
    loading.value = true
    await new Promise((resolve) => setTimeout(resolve, 1200))
    loading.value = false
    success.value = true
}

function handleSuccessConfirm() {
    success.value = false
}

const previewSuccess = ref(false)
</script>

<template>
    <div class="space-y-8">
        <FeedbackForm />

        <div class="space-y-3">
            <p class="text-sm font-bold tracking-wide">加载与成功状态</p>
            <p class="text-xs opacity-60">填写表单后点击提交，先进入 loading 态，请求完成后切换为成功状态。</p>
            <FeedbackForm
                :loading="loading"
                :success="success"
                success-title="反馈已收到"
                success-description="感谢您的反馈，我们会尽快处理"
                success-confirm-text="继续填写"
                @submit="handleSubmit"
                @success-confirm="handleSuccessConfirm"
            />
        </div>

        <div class="space-y-3">
            <p class="text-sm font-bold tracking-wide">预览成功状态</p>
            <div class="flex gap-2">
                <Button variant="outline" size="sm" @click="previewSuccess = !previewSuccess">
                    {{ previewSuccess ? '隐藏' : '显示' }}成功状态
                </Button>
            </div>
            <FeedbackForm
                v-if="previewSuccess"
                success
                success-title="操作成功"
                success-description="您的反馈已成功提交"
                success-confirm-text="确认"
                @success-confirm="previewSuccess = false"
            />
        </div>
    </div>
</template>
