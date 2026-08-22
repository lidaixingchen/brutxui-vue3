<script setup lang="ts">
import { computed } from 'vue'
import { DialogOverlay as DialogOverlayPrimitive } from 'reka-ui'
import { cn } from '@/lib/utils'
import { overlayVariants } from '@/lib/modal-variants'

interface DialogOverlayProps {
    class?: string
    /** 保持挂载以播放退出动画（reka-ui overlay 关闭时默认立即卸载） */
    forceMount?: boolean
    asChild?: boolean
    /** 遮罩叠加半色调点阵纹理（蓝图滤镜质感） */
    pattern?: boolean
}

const props = withDefaults(defineProps<DialogOverlayProps>(), {
    class: undefined,
    forceMount: undefined,
    asChild: false,
    pattern: false,
})

const classes = computed(() =>
    cn(overlayVariants(), props.pattern && 'bg-pattern-dots', props.class)
)
</script>

<template>
    <DialogOverlayPrimitive
        :class="classes"
        :force-mount="props.forceMount"
        :as-child="props.asChild"
    >
        <slot />
    </DialogOverlayPrimitive>
</template>
