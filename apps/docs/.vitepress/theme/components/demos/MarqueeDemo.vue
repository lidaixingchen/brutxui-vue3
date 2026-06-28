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
    </div>
</template>
