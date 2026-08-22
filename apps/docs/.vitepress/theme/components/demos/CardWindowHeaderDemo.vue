<script setup lang="ts">
import { CardWindowHeader, Button } from 'brutx-ui-vue'
</script>

<template>
    <div class="space-y-8">
        <div>
            <h3 class="text-sm font-black mb-3">默认窗口控制符</h3>
            <div class="border-3 border-brutal rounded-brutal bg-brutal-bg shadow-brutal overflow-hidden">
                <CardWindowHeader title="System Monitor v2.0" />
                <div class="p-4 font-mono text-xs font-bold leading-relaxed">
                    <p>&gt; CPU ██████████░░░░ 68%</p>
                    <p>&gt; MEM ███████░░░░░░░ 47%</p>
                    <p class="text-brutal-success">&gt; STATUS: ALL SYSTEMS NOMINAL</p>
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
                    &gt; actions 插槽替换默认 [ _ ] [ X ] 控制符，可放置任意操作按钮。
                </div>
            </div>
        </div>
    </div>
</template>
