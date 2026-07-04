<script setup lang="ts">
import { Backtop } from 'brutx-ui-vue'
</script>

<template>
    <div class="space-y-8">
        <div>
            <h3 class="text-sm font-black mb-3">区域容器内滚动回到顶部演示</h3>
            <p class="text-xs font-bold opacity-60 mb-2">
                请向下滚动下方黄色硬边框容器。当滚动高度超过 100 像素时，容器右下角会出现回到顶部的按钮（本 Demo 的 Backtop 的 target 属性指向该滚动容器 ID）。
            </p>
            
            <div 
                id="backtop-scroll-container" 
                class="relative border-3 border-brutal rounded-brutal h-[220px] overflow-y-auto bg-brutal-bg p-4 shadow-brutal"
            >
                <div class="space-y-4 py-2">
                    <div class="h-20 border-2 border-dashed border-brutal px-3 py-2 text-xs font-black bg-brutal-muted">
                        滚动容器顶部 ↑
                    </div>
                    <div v-for="i in 10" :key="i" class="h-10 border-2 border-brutal-black bg-white rounded-brutal flex items-center px-4 text-xs font-bold">
                        内容列表第 {{ i }} 行
                    </div>
                    <div class="h-20 border-2 border-dashed border-brutal px-3 py-2 text-xs font-black bg-brutal-muted">
                        到底啦 ↓
                    </div>
                </div>

                <!-- 回到顶部组件部署在这 -->
                <Backtop 
                    target="#backtop-scroll-container" 
                    :visibility-height="100" 
                    :right="20"
                    :bottom="20"
                    class="absolute!" 
                />
            </div>
        </div>
    </div>
</template>

<style scoped>
/* 避免 Demo 的绝对定位把页面撑开 */
.absolute\! {
    position: absolute !important;
}
</style>
