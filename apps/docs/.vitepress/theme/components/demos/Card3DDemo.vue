<script setup lang="ts">
import { Card3D } from 'brutx-ui-vue'
</script>

<template>
    <div class="flex flex-col gap-8 items-center">
        <Card3D class="w-full max-w-sm">
            <div class="p-6">
                <h3 class="text-lg font-black mb-2">3D 悬浮卡片</h3>
                <p class="text-sm">将鼠标移入卡片，体验 3D 物理偏转与反向阴影投影效果。</p>
            </div>
        </Card3D>

        <Card3D shadow="lg" class="w-full max-w-sm">
            <div class="p-6">
                <h3 class="text-lg font-black mb-2">大阴影变体</h3>
                <p class="text-sm">shadow="lg" 提供更大的偏移阴影。</p>
            </div>
        </Card3D>

        <Card3D shadow="xl" class="w-full max-w-sm">
            <div class="p-6">
                <h3 class="text-lg font-black mb-2">超大阴影变体</h3>
                <p class="text-sm">shadow="xl" 提供最大的偏移阴影。</p>
            </div>
        </Card3D>

        <Card3D :max-rotation="30" class="w-full max-w-sm">
            <div class="p-6">
                <h3 class="text-lg font-black mb-2">最大旋转角度 (maxRotation=30)</h3>
                <p class="text-sm">更大的旋转幅度，偏转效果更夸张。</p>
            </div>
        </Card3D>

        <Card3D :perspective="500" class="w-full max-w-sm">
            <div class="p-6">
                <h3 class="text-lg font-black mb-2">透视距离 (perspective=500)</h3>
                <p class="text-sm">更近的透视距离，3D 纵深感更强。</p>
            </div>
        </Card3D>

        <Card3D :scale="1.1" class="w-full max-w-sm">
            <div class="p-6">
                <h3 class="text-lg font-black mb-2">缩放比例 (scale=1.1)</h3>
                <p class="text-sm">悬停时放大至 1.1 倍，视觉冲击更强。</p>
            </div>
        </Card3D>

        <Card3D :disabled="true" class="w-full max-w-sm">
            <div class="p-6">
                <h3 class="text-lg font-black mb-2">禁用状态 (disabled=true)</h3>
                <p class="text-sm">禁用 3D 效果，卡片不会响应鼠标移动。</p>
            </div>
        </Card3D>
    </div>
</template>
