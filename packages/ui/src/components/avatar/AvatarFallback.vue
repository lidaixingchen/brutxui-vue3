<script setup lang="ts">
import { computed, inject } from 'vue'
import { AvatarFallback as AvatarFallbackPrimitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { avatarFallbackVariants } from './avatar-variants'
import { avatarKey } from './avatar-key'

interface AvatarFallbackProps extends PrimitiveProps {
    /** 图片加载期间回退内容延迟出现的时长；不传则立即渲染（reka 默认行为） */
    delayMs?: number
    class?: string
}

const props = withDefaults(defineProps<AvatarFallbackProps>(), {
    as: 'span',
    asChild: undefined,
    delayMs: undefined,
    class: undefined,
})

const avatarContext = inject(avatarKey, {
    variant: computed(() => 'default' as const),
})

const classes = computed(() =>
    cn(
        avatarFallbackVariants({ variant: avatarContext.variant.value }),
        props.class,
    )
)
</script>

<template>
    <AvatarFallbackPrimitive :as="props.as" :as-child="props.asChild" :delay-ms="props.delayMs" :class="classes">
        <slot />
    </AvatarFallbackPrimitive>
</template>
