<script setup lang="ts">
import { NoiseBackground } from 'brutx-ui-vue'
</script>

<template>
    <div class="space-y-6 w-full">
        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">基础用法</p>
            <NoiseBackground :opacity="0.35" rounded="default">
                <div class="p-6">
                    <h3 class="text-lg font-black">带噪点背景的内容</h3>
                    <p class="text-sm opacity-70">噪点纹理为设计增添质感。</p>
                </div>
            </NoiseBackground>
        </div>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">动态噪点（animated）</p>
            <NoiseBackground :opacity="0.5" animated :animation-duration="3" :animation-range="0.3" rounded="default">
                <div class="p-6 text-center">
                    <h3 class="text-lg font-black">动态噪点背景</h3>
                </div>
            </NoiseBackground>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-2">
                <p class="text-sm font-bold tracking-wide">fractalNoise（默认）</p>
                <NoiseBackground type="fractalNoise" :frequency="0.65" :opacity="0.6" rounded="default">
                    <div class="p-4 text-sm font-bold">分形噪声</div>
                </NoiseBackground>
            </div>
            <div class="space-y-2">
                <p class="text-sm font-bold tracking-wide">turbulence</p>
                <NoiseBackground type="turbulence" :frequency="0.05" :opacity="0.6" rounded="default">
                    <div class="p-4 text-sm font-bold">湍流效果</div>
                </NoiseBackground>
            </div>
        </div>

        <p class="text-xs opacity-60 leading-relaxed">
            提示：动态噪点尊重系统的「减少动态效果」设置。启用后将停止 requestAnimationFrame 循环，仅保留一帧静态噪点纹理。
        </p>
    </div>
</template>
