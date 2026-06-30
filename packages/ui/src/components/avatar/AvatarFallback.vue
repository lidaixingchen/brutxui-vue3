<script setup lang="ts">
import { computed, inject } from 'vue'
import { AvatarFallback as AvatarFallbackPrimitive } from 'reka-ui'
import { cn } from '@/lib/utils'
import { avatarFallbackVariants } from './avatar-variants'
import { avatarKey } from './avatar-key'

interface AvatarFallbackProps {
    class?: string
}

const props = defineProps<AvatarFallbackProps>()

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
    <AvatarFallbackPrimitive :class="classes">
        <slot />
    </AvatarFallbackPrimitive>
</template>
