<script setup lang="ts">
import { ref } from 'vue'
import { Input } from 'brutx-ui-vue'

const value = ref('')
const errorValue = ref('')
const successValue = ref('')
const modelValue = ref('')
const readonlyValue = ref('只读内容，可选中复制但不可编辑')
</script>

<template>
    <div class="space-y-6 w-full max-w-sm">
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">变体</p>
            <div class="flex flex-col gap-3">
                <Input v-model="value" placeholder="默认输入" />
                <Input v-model="errorValue" variant="error" placeholder="错误输入" />
                <Input v-model="successValue" variant="success" placeholder="成功输入" />
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">尺寸</p>
            <div class="flex flex-col gap-3">
                <Input size="sm" placeholder="小型输入" />
                <Input size="default" placeholder="默认输入" />
                <Input size="lg" placeholder="大型输入" />
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">状态</p>
            <div class="flex flex-col gap-3">
                <Input disabled placeholder="禁用输入" />
                <Input v-model="readonlyValue" readonly />
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">v-model 绑定</p>
            <div class="flex flex-col gap-2">
                <Input v-model="modelValue" placeholder="请输入内容..." />
                <p class="text-xs font-medium text-brutal-fg">值：{{ modelValue }}</p>
            </div>
        </div>
    </div>
</template>
