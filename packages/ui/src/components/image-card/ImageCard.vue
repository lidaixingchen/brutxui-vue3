<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { cn } from '@/lib/utils'
import { imageCardVariants, imageCardImageVariants, imageCardFooterVariants } from './image-card-variants'

type ImageCardAspect = '4/3' | 'video' | 'square'
type ImageCardAccent = 'primary' | 'secondary' | 'accent' | 'destructive' | 'success' | 'info' | 'muted'

interface ImageCardProps {
    /** 图片地址 */
    src: string
    /** 图片替代文本，空字符串表示纯装饰图 */
    alt?: string
    /** 图片区宽高比 */
    aspect?: ImageCardAspect
    /** 底栏主题色族 */
    accent?: ImageCardAccent
    /** 底栏标题（等宽大写工控排版） */
    title?: string
    /** 底栏描述文本 */
    description?: string
    /** 自定义 CSS 类名 */
    class?: string
}

const props = withDefaults(defineProps<ImageCardProps>(), {
    alt: '',
    aspect: undefined,
    accent: undefined,
    title: undefined,
    description: undefined,
    class: undefined,
})

const classes = computed(() => cn(imageCardVariants(), props.class))

const imageClasses = computed(() =>
    cn(imageCardImageVariants({ aspect: props.aspect })),
)

const footerClasses = computed(() =>
    cn(imageCardFooterVariants({ accent: props.accent })),
)

const hasFooter = computed(() =>
    Boolean(props.title || props.description || useSlots().default),
)
</script>

<template>
    <figure :class="classes">
        <img :src="props.src" :alt="props.alt" :class="imageClasses" loading="lazy">
        <figcaption v-if="hasFooter" :class="footerClasses">
            <slot>
                <div v-if="props.title" class="font-mono text-sm font-bold uppercase tracking-widest">
                    {{ props.title }}
                </div>
                <p v-if="props.description" class="mt-1 text-sm">
                    {{ props.description }}
                </p>
            </slot>
        </figcaption>
    </figure>
</template>
