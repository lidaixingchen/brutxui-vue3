<script setup lang="ts">
import { ImageCard } from 'brutx-ui-vue'
</script>

<template>
    <div class="space-y-8">
        <div>
            <h3 class="text-sm font-black mb-3">基础拍立得相框</h3>
            <ImageCard
                class="max-w-xs"
                src="https://picsum.photos/seed/brutx-imagecard-basic/640/480"
                alt="基础拍立得相框示例"
                title="Field Record 001"
                description="悬浮时整卡上浮，投影保持硬边无模糊。"
            />
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">宽高比与底栏色族</h3>
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <ImageCard
                    src="https://picsum.photos/seed/brutx-imagecard-43/640/480"
                    alt="4:3 宽高比示例"
                    aspect="4/3"
                    accent="primary"
                    title="Aspect 4:3"
                />
                <ImageCard
                    src="https://picsum.photos/seed/brutx-imagecard-video/640/360"
                    alt="16:9 视频宽高比示例"
                    aspect="video"
                    accent="destructive"
                    title="Aspect Video"
                />
                <ImageCard
                    src="https://picsum.photos/seed/brutx-imagecard-square/480/480"
                    alt="1:1 方形宽高比示例"
                    aspect="square"
                    accent="success"
                    title="Aspect Square"
                />
            </div>
        </div>

        <div>
            <h3 class="text-sm font-black mb-3">自定义底栏插槽</h3>
            <ImageCard class="max-w-xs" src="https://picsum.photos/seed/brutx-imagecard-slot/640/480" alt="自定义底栏插槽示例">
                <div class="flex items-center justify-between gap-2 font-mono text-xs font-bold uppercase tracking-widest">
                    <span>Archive / 1998</span>
                    <span>[ CONFIDENTIAL ]</span>
                </div>
            </ImageCard>
        </div>
    </div>
</template>
