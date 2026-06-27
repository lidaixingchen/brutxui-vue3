<script setup lang="ts">
import { TypewriterText } from 'brutx-ui-vue'
</script>

<template>
    <div class="space-y-6 w-full">
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">基础用法</p>
            <TypewriterText text="欢迎使用 BrutxUI！" :speed="80" cursor />
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">循环播放</p>
            <TypewriterText text="持续打字效果..." :speed="60" :delay="1500" loop cursor />
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">尺寸与粗细</p>
            <div class="space-y-2">
                <TypewriterText text="大号粗体文本" size="xl" weight="bold" :speed="100" />
                <TypewriterText text="超大号黑体文本" size="2xl" weight="black" :speed="120" />
            </div>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">无光标</p>
            <TypewriterText text="不带光标的打字效果" :speed="70" :cursor="false" />
        </div>
    </div>
</template>
