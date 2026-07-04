<script setup lang="ts">
import { Backtop } from 'brutx-ui-vue'
</script>

<template>
    <div class="space-y-8">
        <div>
            <h3 class="text-sm font-black mb-3">基础用法</h3>
            <p class="text-xs font-bold opacity-60 mb-2">
                向下滚动本页，当滚动距离超过 200px 时，页面右下角会出现回到顶部按钮。
                Backtop 默认监听 window 滚动，使用 position: fixed 定位，无需额外配置。
            </p>
            <div class="border-3 border-brutal rounded-brutal p-4 bg-brutal-muted/30 shadow-brutal">
                <div class="text-xs font-bold space-y-1">
                    <p>Props 说明：</p>
                    <p>• <code class="bg-brutal-bg px-1 border border-brutal">visibility-height</code> — 触发显示的最小滚动距离（默认 200px）</p>
                    <p>• <code class="bg-brutal-bg px-1 border border-brutal">right / bottom</code> — 按钮距视口边缘的偏移（默认 40/40）</p>
                    <p>• <code class="bg-brutal-bg px-1 border border-brutal">target</code> — 可指定滚动容器选择器（默认 window）</p>
                </div>
            </div>
        </div>
        <Backtop :visibility-height="200" />
    </div>
</template>
