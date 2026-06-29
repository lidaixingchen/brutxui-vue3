<script setup lang="ts">
import { Marquee } from 'brutx-ui-vue'
</script>

<template>
    <div class="flex flex-col gap-4 w-full">
        <Marquee :speed="15" fade>
            <span>⚡️ 快速流畅</span>
            <span>💥 新野蛮主义</span>
            <span>🚀 VUE 3 + TAILWIND</span>
            <span>🔥 受 SHADCN 启发</span>
        </Marquee>
        <Marquee :speed="25" direction="right" class="bg-brutal-primary text-brutal-fg">
            <span>💻 代码与 BUG</span>
            <span>🛠️ 从构建到发布</span>
            <span>🌟 开源</span>
        </Marquee>

        <div class="space-y-2 pt-2">
            <p class="text-sm font-bold tracking-wide">变体</p>
            <Marquee :speed="20" variant="default">
                <span>默认变体</span>
                <span>DEFAULT</span>
            </Marquee>
            <Marquee :speed="20" variant="muted">
                <span>静音变体</span>
                <span>MUTED</span>
            </Marquee>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">尺寸</p>
            <Marquee :speed="20" size="sm">
                <span>小尺寸</span>
                <span>SMALL</span>
            </Marquee>
            <Marquee :speed="20" size="lg">
                <span>大尺寸</span>
                <span>LARGE</span>
            </Marquee>
        </div>

        <p class="text-xs opacity-60 pt-2 leading-relaxed">
            提示：本组件尊重系统的「减少动态效果」设置。启用后跑马灯将停止滚动并以静态形式展示内容。
        </p>
    </div>
</template>
