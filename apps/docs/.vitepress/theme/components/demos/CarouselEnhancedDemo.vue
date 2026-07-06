<script setup lang="ts">
import { ref } from 'vue'
import { Carousel, CarouselItem } from 'brutx-ui-vue/carousel'

const slides = [
    { bg: 'bg-brutal-primary', label: '缩略图导航', desc: '底部缩略图快速跳转' },
    { bg: 'bg-brutal-secondary', label: '进度指示器', desc: '顶部进度条显示播放进度' },
    { bg: 'bg-brutal-accent', label: '视差效果', desc: '缩放 + 透明度动画' },
    { bg: 'bg-brutal-success', label: '循环播放', desc: '首尾无缝衔接' },
]

const enhancedRef = ref()
</script>

<template>
    <div class="w-full max-w-xl mx-auto space-y-6">
        <Carousel
            :loop="true"
            :autoplay="true"
            :autoplay-delay="3000"
            size="md"
            :thumbnails="{ show: true, position: 'bottom', size: 'sm', gap: 8, highlightCurrent: true }"
            :autoplay-indicator="{ type: 'progress', position: 'top', pauseOnHover: true }"
            :parallax="{ enabled: true, scale: 1.05, opacity: true, duration: 400 }"
        >
            <CarouselItem v-for="slide in slides" :key="slide.label">
                <div :class="['w-full h-full flex flex-col items-center justify-center gap-2 border-3 border-brutal', slide.bg]">
                    <p class="text-2xl font-black tracking-tight">{{ slide.label }}</p>
                    <p class="text-sm font-bold opacity-70">{{ slide.desc }}</p>
                </div>
            </CarouselItem>
        </Carousel>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">程序化控制</p>
            <Carousel ref="enhancedRef" :loop="true" size="md" :thumbnails="{ show: true, position: 'bottom', size: 'sm' }">
                <CarouselItem v-for="(slide, i) in slides" :key="slide.label">
                    <div :class="['w-full h-full flex flex-col items-center justify-center gap-2 border-3 border-brutal', slide.bg]">
                        <p class="text-2xl font-black tracking-tight">{{ i + 1 }} / {{ slides.length }}</p>
                        <p class="text-sm font-bold opacity-70">{{ slide.label }}</p>
                    </div>
                </CarouselItem>
            </Carousel>
            <div class="flex items-center justify-center gap-2 flex-wrap">
                <button
                    type="button"
                    class="px-3 py-1.5 text-sm font-bold border-3 border-brutal bg-brutal-bg shadow-brutal-sm hover:shadow-brutal hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                    @click="enhancedRef?.scrollPrev()"
                >
                    上一张
                </button>
                <button
                    type="button"
                    class="px-3 py-1.5 text-sm font-bold border-3 border-brutal bg-brutal-bg shadow-brutal-sm hover:shadow-brutal hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                    @click="enhancedRef?.scrollNext()"
                >
                    下一张
                </button>
                <button
                    type="button"
                    class="px-3 py-1.5 text-sm font-bold border-3 border-brutal bg-brutal-accent shadow-brutal-sm hover:shadow-brutal hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                    @click="enhancedRef?.scrollTo(0)"
                >
                    回到首张
                </button>
            </div>
        </div>

        <p class="text-xs opacity-60 leading-relaxed">
            提示：这些增强能力已经并入 Carousel；CarouselEnhanced 仅作为兼容入口保留。
        </p>
    </div>
</template>
