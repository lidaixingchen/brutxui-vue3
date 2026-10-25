<script setup lang="ts">
import { ref } from 'vue'
import { Button, Stepper } from 'brutx-ui-vue'
import type { StepperStep } from 'brutx-ui-vue'

const steps: StepperStep[] = [
    { id: 1, title: '账户信息', description: '填写基本资料' },
    { id: 2, title: '安全设置', description: '设置密码与验证' },
    { id: 3, title: '偏好配置', description: '个性化设置' },
    { id: 4, title: '完成', description: '注册成功' },
]

const current = ref(0)

function prev() { if (current.value > 0) current.value-- }
function next() { if (current.value < steps.length - 1) current.value++ }
</script>

<template>
    <div class="flex flex-col gap-6 w-full max-w-2xl mx-auto">
        <!-- 水平步骤条 -->
        <div class="border-3 border-brutal shadow-brutal rounded-brutal p-5 bg-brutal-bg">
            <p class="text-xs font-bold opacity-50 mb-4 uppercase tracking-widest">水平</p>
            <Stepper v-model="current" :steps="steps" orientation="horizontal" />

            <div class="mt-6 flex flex-wrap justify-between gap-3">
                <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    :disabled="current === 0"
                    @click="prev"
                >
                    ← 上一步
                </Button>
                <Button
                    variant="primary"
                    size="sm"
                    type="button"
                    :disabled="current === steps.length - 1"
                    @click="next"
                >
                    下一步 →
                </Button>
            </div>
        </div>

        <!-- 垂直步骤条 -->
        <div class="border-3 border-brutal shadow-brutal rounded-brutal p-5 bg-brutal-bg">
            <p class="text-xs font-bold opacity-50 mb-4 uppercase tracking-widest">垂直</p>
            <Stepper v-model="current" :steps="steps" orientation="vertical" />
        </div>

        <!-- 变体 -->
        <div class="border-3 border-brutal shadow-brutal rounded-brutal p-5 bg-brutal-bg">
            <p class="text-xs font-bold opacity-50 mb-4 uppercase tracking-widest">变体 (accent)</p>
            <Stepper v-model="current" :steps="steps" orientation="horizontal" variant="accent" />
        </div>

        <!-- 尺寸 -->
        <div class="border-3 border-brutal shadow-brutal rounded-brutal p-5 bg-brutal-bg">
            <p class="text-xs font-bold opacity-50 mb-4 uppercase tracking-widest">尺寸 (lg)</p>
            <Stepper v-model="current" :steps="steps" orientation="horizontal" size="lg" />
        </div>

        <!-- 不可点击 -->
        <div class="border-3 border-brutal shadow-brutal rounded-brutal p-5 bg-brutal-bg">
            <p class="text-xs font-bold opacity-50 mb-4 uppercase tracking-widest">不可点击</p>
            <Stepper v-model="current" :steps="steps" orientation="horizontal" :clickable="false" />
        </div>
    </div>
</template>
