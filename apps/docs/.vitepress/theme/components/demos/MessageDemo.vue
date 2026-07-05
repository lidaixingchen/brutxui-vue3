<script setup lang="ts">
import { Button } from 'brutx-ui-vue'
import { useMessage, useDialog, useMessageBox } from 'brutx-ui-vue'

const { info, success, warning, error } = useMessage()
const dialog = useDialog()
const messageBox = useMessageBox()

function handleDialog() {
    dialog.show({
        title: '函数式对话框',
        content: '这是通过 useDialog() 命令式打开的对话框。',
    })
}

async function handleConfirm() {
    try {
        await messageBox.show({
            title: '确认操作',
            message: '确定要执行此操作吗？',
            showCancelButton: true,
        }).promise
        success('操作已确认')
    } catch {
        info('已取消')
    }
}
</script>

<template>
    <div class="space-y-8">
        <div>
            <h3 class="text-sm font-black mb-3">useMessage 四种类型</h3>
            <div class="flex flex-wrap gap-3">
                <Button variant="secondary" @click="info('提示', '这是一条普通信息提示。')">Info</Button>
                <Button variant="success" @click="success('成功', '操作已成功完成。')">Success</Button>
                <Button variant="primary" @click="warning('警告', '请注意检查输入内容。')">Warning</Button>
                <Button variant="danger" @click="error('错误', '操作失败，请重试。')">Error</Button>
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">useDialog 函数式对话框</h3>
            <Button variant="default" @click="handleDialog">打开对话框</Button>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">useMessageBox 确认框</h3>
            <Button variant="default" @click="handleConfirm">确认操作</Button>
        </div>
    </div>
</template>
