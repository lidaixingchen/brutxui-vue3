<script setup lang="ts">
import { ref } from 'vue'
import {
    Button,
    MessageBox,
    showConfirm,
    showAlert,
    showPrompt,
    useMessageBox,
    type MessageBoxType,
} from 'brutx-ui-vue'

// 声明式弹框状态
const isDeclarativeOpen = ref(false)
const declarativeType = ref<MessageBoxType>('warning')
const lastActionLog = ref<string>('尚未触发任何弹窗')

function openDeclarative(type: MessageBoxType) {
    declarativeType.value = type
    isDeclarativeOpen.value = true
}

function onDeclarativeConfirm(val?: string) {
    lastActionLog.value = `[声明式 MessageBox] 用户确认${val ? `，输入值: ${val}` : ''}`
}

function onDeclarativeCancel() {
    lastActionLog.value = '[声明式 MessageBox] 用户取消 / 关闭'
}

// 命令式便捷方法
async function handleShowConfirm() {
    lastActionLog.value = '正在等待 showConfirm 用户决策...'
    const isConfirmed = await showConfirm('确定要同步所有环境配置吗？此操作无法撤销。', {
        title: '环境同步警示',
    })
    lastActionLog.value = `[showConfirm] 返回结果: ${isConfirmed ? '已确认 (true)' : '已取消 (false)'}`
}

async function handleShowAlert() {
    lastActionLog.value = '正在展示 showAlert...'
    await showAlert('系统配置文件已成功更新并部署至全部节点。', {
        title: '同步成功',
        type: 'success',
    })
    lastActionLog.value = '[showAlert] 提示已关闭'
}

async function handleShowPrompt() {
    lastActionLog.value = '正在等待 showPrompt 用户输入...'
    const result = await showPrompt('请输入新的分支名称：', {
        title: '创建新分支',
        inputValue: 'feature/brutx-v2',
        inputPlaceholder: '例如: feat/awesome-module',
        inputPattern: /^[a-zA-Z0-9_\-/]+$/,
        inputErrorMessage: '分支名仅支持英文字母、数字、下划线、短横线与斜杠',
    })

    if (result.action === 'confirm') {
        lastActionLog.value = `[showPrompt] 确认提交，输入值: "${result.value}"`
    } else {
        lastActionLog.value = `[showPrompt] 已取消输入 (action: ${result.action})`
    }
}

// Composable 用法
const { confirm: composableConfirm } = useMessageBox()

async function handleComposableConfirm() {
    lastActionLog.value = '正在等待 useMessageBox.confirm 决策...'
    const confirmed = await composableConfirm('是否清空当前构建缓存？', {
        title: '清空缓存',
        type: 'error',
        confirmButtonText: '确定清空',
        cancelButtonText: '暂不清空',
    })
    lastActionLog.value = `[useMessageBox] 返回值: ${confirmed}`
}
</script>

<template>
    <div class="space-y-6">
        <!-- 声明式组件 -->
        <div>
            <h4 class="text-sm font-black mb-3 text-brutal-fg">1. 声明式组件 (MessageBox)</h4>
            <div class="flex flex-wrap gap-2">
                <Button variant="secondary" @click="openDeclarative('info')">信息 (info)</Button>
                <Button variant="success" @click="openDeclarative('success')">成功 (success)</Button>
                <Button variant="primary" @click="openDeclarative('warning')">警告 (warning)</Button>
                <Button variant="danger" @click="openDeclarative('error')">错误 (error)</Button>
            </div>
        </div>

        <!-- 命令式便捷函数 -->
        <div>
            <h4 class="text-sm font-black mb-3 text-brutal-fg">2. 命令式便捷方法 (Functional Helpers)</h4>
            <div class="flex flex-wrap gap-2">
                <Button variant="outline" @click="handleShowConfirm">showConfirm</Button>
                <Button variant="outline" @click="handleShowAlert">showAlert</Button>
                <Button variant="outline" @click="handleShowPrompt">showPrompt (输入校验)</Button>
                <Button variant="outline" @click="handleComposableConfirm">useMessageBox (Composable)</Button>
            </div>
        </div>

        <!-- 交互日志回显面板 -->
        <div class="p-3 border-2 border-brutal bg-brutal-muted text-xs font-mono">
            <span class="font-bold mr-2 text-brutal-fg">最新交互状态:</span>
            <span class="text-brutal-primary font-semibold">{{ lastActionLog }}</span>
        </div>

        <!-- 声明式 MessageBox 挂载 -->
        <MessageBox
            v-model:open="isDeclarativeOpen"
            :title="`声明式 ${declarativeType.toUpperCase()} 对话框`"
            message="这是通过模板中声明的 MessageBox 组件展示的消息正文。"
            :type="declarativeType"
            @confirm="onDeclarativeConfirm"
            @cancel="onDeclarativeCancel"
        />
    </div>
</template>
