<script setup lang="ts">
import { ref } from 'vue'
import { CardWindowHeader, Button } from 'brutx-ui-vue'

const isCollapsed = ref(false)
const isClosed = ref(false)
const lastAction = ref<string>('等待操作...')

function handleClose() {
    isClosed.value = true
    lastAction.value = '触发关闭动作 (@close)'
}

function handleMinimize() {
    isCollapsed.value = !isCollapsed.value
    lastAction.value = isCollapsed.value ? '触发折叠/最小化 (@minimize)' : '已恢复展开'
}

function handleMaximize() {
    lastAction.value = '触发最大化/全屏 (@maximize)'
}

function resetWindow() {
    isClosed.value = false
    isCollapsed.value = false
    lastAction.value = '窗口已重置'
}
</script>

<template>
    <div class="space-y-8">
        <div>
            <h3 class="text-sm font-black mb-3">交互控制模式（工控实体按钮）</h3>
            <div v-if="!isClosed" class="border-3 border-brutal rounded-brutal bg-brutal-bg shadow-brutal overflow-hidden">
                <CardWindowHeader
                    title="Control_Terminal_v3.0"
                    closable
                    minimizable
                    maximizable
                    interactive-lamps
                    @close="handleClose"
                    @minimize="handleMinimize"
                    @maximize="handleMaximize"
                />
                <div v-show="!isCollapsed" class="p-4 font-mono text-xs font-bold leading-relaxed space-y-2">
                    <p>&gt; LAST_EVENT: <span class="text-brutal-primary font-black">{{ lastAction }}</span></p>
                    <p>&gt; 点击右侧 [ _ ] [ □ ] [ X ] 或左侧红黄绿指示灯可直接触发动作并支持 Tab 聚焦。</p>
                </div>
            </div>
            <div v-else class="p-4 border-3 border-dashed border-brutal rounded-brutal text-center space-y-2">
                <p class="font-mono text-xs font-bold text-brutal-destructive">&gt; 窗口已关闭 (CLOSED)</p>
                <Button size="sm" variant="outline" @click="resetWindow">重新打开窗口</Button>
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">默认静态装饰模式</h3>
            <div class="border-3 border-brutal rounded-brutal bg-brutal-bg shadow-brutal overflow-hidden">
                <CardWindowHeader title="System Monitor v2.0" />
                <div class="p-4 font-mono text-xs font-bold leading-relaxed">
                    <p>&gt; CPU ██████████░░░░ 68%</p>
                    <p>&gt; MEM ███████░░░░░░░ 47%</p>
                    <p class="text-brutal-status-success">&gt; STATUS: ALL SYSTEMS NOMINAL (静态展示，无 a11y 负担)</p>
                </div>
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">隐藏控制符（纯标题栏）</h3>
            <div class="border-3 border-brutal rounded-brutal bg-brutal-bg shadow-brutal overflow-hidden">
                <CardWindowHeader title="Read Only Panel" :show-controls="false" />
                <div class="p-4 text-sm font-bold opacity-80">
                    showControls 为 false 时右侧不渲染 ASCII 控制符，适合静态展示面板。
                </div>
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">自定义操作区插槽</h3>
            <div class="border-3 border-brutal rounded-brutal bg-brutal-bg shadow-brutal overflow-hidden">
                <CardWindowHeader title="Config Editor">
                    <template #actions>
                        <Button size="sm" variant="accent" class="h-5 px-2 text-[10px]">SAVE</Button>
                    </template>
                </CardWindowHeader>
                <div class="p-4 font-mono text-xs font-bold">
                    &gt; actions 插槽优先级最高，可放置任意操作按钮。
                </div>
            </div>
        </div>
    </div>
</template>

