<script setup lang="ts">
import { computed, provide } from 'vue'
import { AvatarRoot } from 'reka-ui'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { useLocale } from '@/composables/useLocale'
import { avatarVariants } from './avatar-variants'
import { avatarKey } from './avatar-key'

type AvatarVariantProps = VariantProps<typeof avatarVariants>

type AvatarStatus = 'online' | 'offline' | 'busy' | 'none'

interface AvatarProps {
    variant?: NonNullable<AvatarVariantProps['variant']>
    size?: NonNullable<AvatarVariantProps['size']>
    shape?: NonNullable<AvatarVariantProps['shape']>
    status?: AvatarStatus
    class?: string
}

const props = withDefaults(defineProps<AvatarProps>(), {
    variant: 'default',
    size: 'default',
    shape: 'square',
    status: 'none',
    class: undefined,
})

const statusColorMap: Record<Exclude<AvatarStatus, 'none'>, string> = {
    online: 'bg-brutal-success',
    offline: 'bg-brutal-muted',
    busy: 'bg-brutal-destructive',
}

const statusLocaleKeyMap: Record<Exclude<AvatarStatus, 'none'>, string> = {
    online: 'avatar.statusOnline',
    offline: 'avatar.statusOffline',
    busy: 'avatar.statusBusy',
}

const { t } = useLocale()

const statusLabel = computed(() => {
    if (props.status === 'none') return ''
    return t(statusLocaleKeyMap[props.status])
})

const classes = computed(() =>
    cn(
        avatarVariants({
            variant: props.variant,
            size: props.size,
            shape: props.shape,
        }),
        props.class,
    ),
)

const statusClasses = computed(() => {
    if (props.status === 'none') return ''
    return cn(
        'absolute bottom-0 right-0 w-3 h-3 rounded-full border-3 border-brutal-bg',
        statusColorMap[props.status],
    )
})

provide(avatarKey, {
    variant: computed(() => props.variant),
})
</script>

<template>
    <span class="relative inline-block">
        <AvatarRoot :class="classes">
            <slot />
        </AvatarRoot>
        <span v-if="status !== 'none'" :class="statusClasses" role="status" :aria-label="statusLabel" />
    </span>
</template>
