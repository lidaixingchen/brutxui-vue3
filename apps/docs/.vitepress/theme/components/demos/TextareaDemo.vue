<script setup lang="ts">
import { ref } from 'vue'
import { Textarea } from 'brutx-ui-vue'

const value = ref('')
const errorValue = ref('')
const successValue = ref('')
const modelValue = ref('')
</script>

<template>
    <div class="space-y-6 w-full max-w-sm">
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">变体</p>
            <div class="flex flex-col gap-3">
                <Textarea v-model="value" placeholder="默认文本区域" />
                <Textarea v-model="errorValue" variant="error" placeholder="错误文本区域" />
                <Textarea v-model="successValue" variant="success" placeholder="成功文本区域" />
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">尺寸</p>
            <div class="flex flex-col gap-3">
                <Textarea textarea-size="sm" placeholder="小号文本区域" />
                <Textarea textarea-size="default" placeholder="默认文本区域" />
                <Textarea textarea-size="lg" placeholder="大号文本区域" />
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">状态</p>
            <div class="flex flex-col gap-3">
                <Textarea disabled placeholder="禁用文本区域" />
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">v-model 绑定</p>
            <div class="flex flex-col gap-2">
                <Textarea v-model="modelValue" placeholder="请输入内容..." />
                <p class="text-xs font-medium text-brutal-fg">值：{{ modelValue }}</p>
            </div>
        </div>
    </div>
</template>
