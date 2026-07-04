<script setup lang="ts">
import { ref } from 'vue'
import { Image } from 'brutx-ui-vue'

const previewList = [
    'https://picsum.photos/seed/brutx1/800/600',
    'https://picsum.photos/seed/brutx2/800/600',
    'https://picsum.photos/seed/brutx3/800/600',
]
</script>

<template>
    <div class="space-y-8">
        <div>
            <h3 class="text-sm font-black mb-3">基础用法</h3>
            <div class="max-w-sm mx-auto">
                <Image
                    src="https://picsum.photos/seed/brutx-basic/400/300"
                    alt="基础图片示例"
                    class="w-full"
                />
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">大图预览（点击放大）</h3>
            <div class="max-w-sm mx-auto">
                <Image
                    src="https://picsum.photos/seed/brutx-preview/400/300"
                    alt="点击预览图片"
                    preview
                    class="w-full"
                />
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">多图预览（左右切换）</h3>
            <div class="max-w-sm mx-auto">
                <Image
                    :src="previewList[0]"
                    :preview-src-list="previewList"
                    alt="多图预览"
                    preview
                    class="w-full"
                />
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">懒加载</h3>
            <div class="max-w-sm mx-auto">
                <Image
                    src="https://picsum.photos/seed/brutx-lazy/400/300"
                    alt="懒加载图片"
                    loading="lazy"
                    class="w-full"
                />
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">加载失败 + Fallback</h3>
            <div class="max-w-sm mx-auto">
                <Image
                    src="https://invalid-url.example/broken.jpg"
                    fallback="https://picsum.photos/seed/brutx-fallback/400/300"
                    alt="Fallback 图片"
                    class="w-full"
                />
            </div>
        </div>
    </div>
</template>
