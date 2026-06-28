<script setup lang="ts">
import { ref } from 'vue'
import { TreeView } from 'brutx-ui-vue'
import type { TreeNode } from 'brutx-ui-vue'

const nodes: TreeNode[] = [
    {
        id: 'src',
        label: 'src',
        children: [
            {
                id: 'components',
                label: 'components',
                children: [
                    { id: 'button', label: 'Button.vue' },
                    { id: 'input', label: 'Input.vue' },
                ],
            },
            {
                id: 'composables',
                label: 'composables',
                children: [
                    { id: 'useToast', label: 'useToast.ts' },
                ],
            },
            { id: 'index', label: 'index.ts' },
        ],
    },
    {
        id: 'public',
        label: 'public',
        children: [
            { id: 'favicon', label: 'favicon.ico' },
        ],
    },
    { id: 'pkg', label: 'package.json' },
]

const selected = ref<string | null>('button')

const checkboxNodes: TreeNode[] = [
    {
        id: 'docs',
        label: 'docs',
        children: [
            { id: 'guide', label: 'guide.md' },
            { id: 'api', label: 'api.md', disabled: true },
            { id: 'faq', label: 'faq.md' },
        ],
    },
    {
        id: 'assets',
        label: 'assets',
        children: [
            { id: 'logo', label: 'logo.svg' },
            { id: 'cover', label: 'cover.png' },
        ],
    },
]

const checkedIds = ref<string[]>(['guide'])
</script>

<template>
    <div class="w-full max-w-sm border-3 border-brutal shadow-brutal rounded-brutal p-3 bg-brutal-bg">
        <TreeView
            v-model="selected"
            :nodes="nodes"
            :default-expanded="['src', 'components']"
        />
        <p v-if="selected" class="mt-3 text-xs font-bold border-t-3 border-brutal pt-2 opacity-60">
            已选择：{{ selected }}
        </p>
    </div>

    <div class="w-full max-w-sm border-3 border-brutal shadow-brutal rounded-brutal p-3 bg-brutal-bg mt-6">
        <p class="text-sm font-bold tracking-wide mb-2">复选模式</p>
        <TreeView
            v-model:checked-ids="checkedIds"
            :nodes="checkboxNodes"
            selection-mode="checkbox"
            :default-expanded="['docs', 'assets']"
        />
        <p class="mt-3 text-xs font-bold border-t-3 border-brutal pt-2 opacity-60">
            已勾选：{{ checkedIds.length }} 项
        </p>
    </div>
</template>
