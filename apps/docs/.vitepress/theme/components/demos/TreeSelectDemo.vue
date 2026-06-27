<script setup lang="ts">
import { ref } from 'vue'
import { TreeSelect } from 'brutx-ui-vue'
import type { TreeSelectTreeNode } from 'brutx-ui-vue'

const nodes: TreeSelectTreeNode[] = [
    {
        id: 'docs',
        label: '文档',
        children: [
            { id: 'guide', label: '指南' },
            { id: 'api', label: 'API 参考' },
        ],
    },
    {
        id: 'src',
        label: '源码',
        children: [
            {
                id: 'components',
                label: '组件',
                children: [
                    { id: 'button', label: 'Button.vue' },
                    { id: 'input', label: 'Input.vue' },
                ],
            },
            { id: 'utils', label: '工具函数' },
        ],
    },
]

const selected = ref<string | undefined>(undefined)
const selectedMultiple = ref<string[]>([])
</script>

<template>
    <div class="space-y-6 w-full">
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">单选 + 搜索</p>
            <TreeSelect
                v-model="selected"
                :nodes="nodes"
                placeholder="选择文件..."
                searchable
                clearable
            />
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">多选模式</p>
            <TreeSelect
                v-model="selectedMultiple"
                :nodes="nodes"
                multiple
                searchable
                clearable
                placeholder="选择多个文件..."
            />
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">禁用状态</p>
            <TreeSelect
                :nodes="nodes"
                disabled
                placeholder="禁用状态..."
            />
        </div>
    </div>
</template>
