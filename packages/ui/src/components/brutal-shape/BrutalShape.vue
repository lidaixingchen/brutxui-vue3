<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { brutalShapeVariants } from './brutal-shape-variants'
import { renderShapeSvg } from './shapes'

interface BrutalShapeProps {
    /** 图腾名称（见 shapes 图腾库清单） */
    name: string
    /** 渲染边长（px） */
    size?: number | string
    /** 填充色，默认引用语义令牌以联动主题预设与暗色 */
    color?: string
    /** 描边色，默认引用前景令牌 */
    stroke?: string
    /** 描边宽度（viewBox 100 坐标系单位） */
    strokeWidth?: number | string
    /** 纯装饰图形标记：true 时对读屏隐藏；语义场景由父级提供文本替代 */
    decorative?: boolean
    /** 自定义 CSS 类名 */
    class?: string
}

const props = withDefaults(defineProps<BrutalShapeProps>(), {
    size: 32,
    color: 'var(--brutal-accent)',
    stroke: 'var(--brutal-fg)',
    strokeWidth: 3,
    decorative: true,
    class: undefined,
})

const classes = computed(() => cn(brutalShapeVariants(), props.class))

const shapeSvg = computed(() => {
    const svg = renderShapeSvg(props.name)
    if (svg === null) {
        console.warn(`[BrutalShape] 未知图腾名称 "${props.name}"，已跳过渲染`)
        return ''
    }
    return svg
})

const hasSvg = computed(() => shapeSvg.value !== '')
</script>

<template>
    <svg
        v-if="hasSvg"
        :class="classes"
        :width="props.size"
        :height="props.size"
        viewBox="0 0 100 100"
        :fill="props.color"
        :stroke="props.stroke"
        :stroke-width="props.strokeWidth"
        stroke-linejoin="round"
        aria-hidden="true"
        focusable="false"
        v-html="shapeSvg"
    />
</template>
