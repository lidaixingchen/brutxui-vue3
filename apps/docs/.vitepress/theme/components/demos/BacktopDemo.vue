<script setup lang="ts">
import { Backtop } from 'brutx-ui-vue'
</script>

<template>
    <div class="space-y-8">
        <div>
            <h3 class="text-sm font-black mb-3">基础用法</h3>
            <p class="text-xs font-bold opacity-60 mb-2">
                向下滚动下方容器，当滚动距离超过 100px 时，容器右下角会出现回到顶部按钮。
                指定 target 后，Backtop 使用 absolute 定位，按钮会相对目标容器定位，不会逃出预览框。
            </p>
            <div class="relative">
                <div
                    id="backtop-scroll"
                    class="h-60 overflow-y-auto border-3 border-brutal rounded-brutal bg-brutal-muted/30 p-4"
                >
                    <div class="h-[800px] flex flex-col gap-2">
                        <p class="text-sm font-black">滚动内容</p>
                        <p class="text-xs opacity-60">向下滚动以触发回到顶部按钮</p>
                    </div>
                </div>
                <Backtop target="#backtop-scroll" :visibility-height="100" :right="20" :bottom="20" />
            </div>
        </div>
    </div>
</template>
