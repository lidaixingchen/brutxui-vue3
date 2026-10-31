<script setup lang="ts">
import { ref } from 'vue'
import { Button } from 'brutx-ui-vue'
import { Carousel, CarouselItem } from 'brutx-ui-vue/carousel'

const slides = [
    { bg: 'bg-brutal-primary', foreground: 'text-brutal-primary-foreground', label: '🔥 新粗野主义', desc: '大胆边框 + 硬朗阴影' },
    { bg: 'bg-brutal-secondary', foreground: 'text-brutal-secondary-foreground', label: '💡 简洁至上', desc: '去掉多余的装饰' },
    { bg: 'bg-brutal-accent', foreground: 'text-brutal-accent-foreground', label: '⚡ 高对比度', desc: '清晰的视觉层次感' },
]

const carouselRef = ref()
</script>

<template>
    <div class="w-full max-w-xl mx-auto space-y-6">
        <Carousel :loop="true" :autoplay="true" :autoplay-delay="2500" size="md">
            <CarouselItem v-for="slide in slides" :key="slide.label">
                <div :class="['w-full h-full flex flex-col items-center justify-center gap-2 border-3 border-brutal px-12', slide.bg, slide.foreground]">
                    <p class="w-full text-balance text-center break-words text-xl font-black tracking-tight sm:text-2xl">{{ slide.label }}</p>
                    <p class="w-full text-balance text-center break-words text-xs font-bold sm:text-sm">{{ slide.desc }}</p>
                </div>
            </CarouselItem>
        </Carousel>

        <div class="space-y-2">
            <p class="text-sm font-bold tracking-wide">程序化控制</p>
            <Carousel ref="carouselRef" :loop="true" size="md">
                <CarouselItem v-for="(slide, i) in slides" :key="slide.label">
                    <div :class="['w-full h-full flex flex-col items-center justify-center gap-2 border-3 border-brutal px-12', slide.bg, slide.foreground]">
                        <p class="w-full text-balance text-center break-words text-xl font-black tracking-tight sm:text-2xl">{{ i + 1 }} / {{ slides.length }}</p>
                        <p class="w-full text-balance text-center break-words text-xs font-bold sm:text-sm">{{ slide.label }}</p>
                    </div>
                </CarouselItem>
            </Carousel>
            <div class="flex items-center justify-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" @click="carouselRef?.scrollPrev()">
                    上一张
                </Button>
                <Button variant="outline" size="sm" @click="carouselRef?.scrollNext()">
                    下一张
                </Button>
                <Button variant="accent" size="sm" @click="carouselRef?.scrollTo(0)">
                    回到首张
                </Button>
            </div>
        </div>

        <p class="text-xs leading-relaxed text-brutal-muted-foreground">
            提示：本组件尊重系统的「减少动态效果」设置。启用后将停止自动播放并禁用幻灯片切换的过渡动画。
        </p>
    </div>
</template>
