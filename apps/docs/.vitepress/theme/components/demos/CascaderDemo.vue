<script setup lang="ts">
import { ref } from 'vue'
import { Cascader, Label } from 'brutx-ui-vue'

const singleVal = ref<string[]>([])
const multiVal = ref<string[][]>([])
const strictlyVal = ref<string[]>([])

const options = [
    {
        value: 'guide',
        label: '指南',
        children: [
            {
                value: 'design',
                label: '设计原则',
                children: [
                    { value: 'consistent', label: '一致性' },
                    { value: 'feedback', label: '反馈' },
                    { value: 'efficiency', label: '效率' },
                ],
            },
            {
                value: 'navigation',
                label: '导航',
                children: [
                    { value: 'side', label: '侧栏导航' },
                    { value: 'top', label: '顶部导航' },
                ],
            },
        ],
    },
    {
        value: 'component',
        label: '组件',
        children: [
            {
                value: 'basic',
                label: '基础组件',
                children: [
                    { value: 'button', label: 'Button 按钮' },
                    { value: 'color', label: 'Color 色彩' },
                ],
            },
            {
                value: 'form',
                label: '表单组件',
                children: [
                    { value: 'input', label: 'Input 输入框' },
                    { value: 'select', label: 'Select 选择器' },
                    { value: 'cascader', label: 'Cascader 级联选择' },
                ],
            },
        ],
    },
]
</script>

<template>
    <div class="flex flex-col gap-6 w-full max-w-md mx-auto p-6 bg-brutal-bg border-3 border-brutal rounded-brutal shadow-brutal text-brutal-fg">
        <div class="flex flex-col gap-2">
            <Label for="cascader-single" class="font-bold text-sm">基础单选</Label>
            <Cascader
                id="cascader-single"
                v-model="singleVal"
                :options="options"
                placeholder="请选择"
                clearable
            />
            <div class="text-xs font-mono opacity-80 mt-1">
                当前值: {{ singleVal.length > 0 ? singleVal.join(' / ') : '空' }}
            </div>
        </div>

        <div class="flex flex-col gap-2">
            <Label for="cascader-multi" class="font-bold text-sm">多选模式</Label>
            <Cascader
                id="cascader-multi"
                v-model="multiVal"
                :options="options"
                placeholder="多选模式"
                multiple
                clearable
            />
            <div class="text-xs font-mono opacity-80 mt-1">
                当前值: {{ multiVal.length > 0 ? JSON.stringify(multiVal) : '空' }}
            </div>
        </div>

        <div class="flex flex-col gap-2">
            <Label for="cascader-strictly" class="font-bold text-sm">父子节点独立选择 (checkStrictly)</Label>
            <Cascader
                id="cascader-strictly"
                v-model="strictlyVal"
                :options="options"
                placeholder="可选择任意一级"
                check-strictly
                clearable
            />
            <div class="text-xs font-mono opacity-80 mt-1">
                当前值: {{ strictlyVal.length > 0 ? strictlyVal.join(' / ') : '空' }}
            </div>
        </div>
    </div>
</template>
