<script setup lang="ts">
import { ref } from 'vue'
import { Carousel, CarouselItem } from 'brutx-ui-vue/carousel'

const slides = [
    { bg: 'bg-brutal-primary', label: '🔥 新粗野主义', desc: '大胆边框 + 硬朗阴影' },
    { bg: 'bg-brutal-secondary', label: '💡 简洁至上', desc: '去掉多余的装饰' },
    { bg: 'bg-brutal-accent', label: '⚡ 高对比度', desc: '清晰的视觉层次感' },
]

const carouselRef = ref()
</script>

<template>
    <div class="w-full max-w-xl mx-auto space-y-6">
        <Carousel :loop="true" :autoplay="true" :autoplay-delay="2500" size="md">
            <CarouselItem v-for="slide in slides" :key="slide.label">
                <div :class="['w-full h-full flex flex-col items-center justify-center gap-2 border-3 border-brutal', slide.bg]">
                    <p class="text-2xl font-black tracking-tight">{{ slide.label }}</p>
                    <p class="text-sm font-bold opacity-70">{{ slide.desc }}</p>
                </div>
            </CarouselItem>
        </Carousel>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">程序化控制</p>
            <Carousel ref="carouselRef" :loop="true" size="md">
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
                    @click="carouselRef?.scrollPrev()"
                >
                    上一张
                </button>
                <button
                    type="button"
                    class="px-3 py-1.5 text-sm font-bold border-3 border-brutal bg-brutal-bg shadow-brutal-sm hover:shadow-brutal hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                    @click="carouselRef?.scrollNext()"
                >
                    下一张
                </button>
                <button
                    type="button"
                    class="px-3 py-1.5 text-sm font-bold border-3 border-brutal bg-brutal-accent shadow-brutal-sm hover:shadow-brutal hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                    @click="carouselRef?.scrollTo(0)"
                >
                    回到首张
                </button>
            </div>
        </div>

        <p class="text-xs opacity-60 leading-relaxed">
            提示：本组件尊重系统的「减少动态效果」设置。启用后将停止自动播放并禁用幻灯片切换的过渡动画。
        </p>
    </div>
</template>
