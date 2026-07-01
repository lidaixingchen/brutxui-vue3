<script setup lang="ts">
import { Popconfirm, Button } from 'brutx-ui-vue'

function handleConfirm(): void {
    alert('操作已确认！')
}

function handleCancel(): void {
    console.log('操作已取消')
}
</script>

<template>
    <div class="flex flex-wrap items-center gap-6 p-4">
        <!-- 基础用法 -->
        <Popconfirm
            title="确定要删除此项吗？"
            @confirm="handleConfirm"
            @cancel="handleCancel"
        >
            <Button variant="danger">删除数据</Button>
        </Popconfirm>

        <!-- 自定义按钮文字 -->
        <Popconfirm
            title="您想保存当前草稿吗？"
            confirm-button-text="保存"
            cancel-button-text="不保存"
            @confirm="handleConfirm"
            @cancel="handleCancel"
        >
            <Button variant="outline">保存草稿</Button>
        </Popconfirm>

        <!-- 危险操作（无取消按钮） -->
        <Popconfirm
            title="警告：此操作将永久清空回收站，且不可撤销。"
            confirm-button-type="destructive"
            :cancelable="false"
            @confirm="handleConfirm"
        >
            <Button variant="danger">清空回收站</Button>
        </Popconfirm>
    </div>
</template>
