<script setup lang="ts">
import { Button } from 'brutx-ui-vue'
import { useMessage } from 'brutx-ui-vue'

const { info, success, warning, error, show } = useMessage()

function handleCustomDuration() {
    show({
        type: 'warning',
        title: '长时长提示',
        description: '此条消息将在 8 秒后自动关闭。',
        duration: 8000,
    })
}

function handlePersistent() {
    show({
        type: 'error',
        title: '持续提示',
        description: '这是一条不自动关闭的消息，需要用户手动点击关闭。',
        duration: 0,
    })
}
</script>

<template>
    <div class="space-y-6">
        <div>
            <h4 class="text-sm font-black mb-3 text-brutal-fg">四种消息类型</h4>
            <div class="flex flex-wrap gap-2">
                <Button variant="secondary" @click="info('提示', '这是一条普通信息提示。')">提示</Button>
                <Button variant="success" @click="success('成功', '操作已成功完成。')">成功</Button>
                <Button variant="primary" @click="warning('警告', '请注意检查输入内容。')">警告</Button>
                <Button variant="danger" @click="error('错误', '操作失败，请重试。')">错误</Button>
            </div>
        </div>

        <div>
            <h4 class="text-sm font-black mb-3 text-brutal-fg">高级配置</h4>
            <div class="flex flex-wrap gap-2">
                <Button variant="outline" @click="handleCustomDuration">自定义时长 (8秒)</Button>
                <Button variant="outline" @click="handlePersistent">不自动关闭 (常驻)</Button>
            </div>
        </div>
    </div>
</template>
