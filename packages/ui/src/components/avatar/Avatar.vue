<script setup lang="ts">
import { computed, provide } from 'vue'
import { AvatarRoot } from 'reka-ui'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
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
    /** 工牌吊孔装饰：顶部实体圆环挂孔（纯装饰层） */
    lanyard?: boolean
    class?: string
}

const props = withDefaults(defineProps<AvatarProps>(), {
    variant: 'default',
    size: 'default',
    shape: 'square',
    status: 'none',
    lanyard: false,
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
    const status = props.status
    if (status === 'none') return undefined
    return t(statusLocaleKeyMap[status])
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
    const status = props.status
    if (status === 'none') return ''
    return cn(
        'absolute bottom-0 right-0 w-3 h-3 rounded-full border-3 border-brutal-bg',
        statusColorMap[status],
    )
})

provide(avatarKey, {
    variant: computed(() => props.variant),
})
</script>

<template>
    <span class="relative inline-block">
        <!-- 工牌吊孔：顶部圆环挂孔（纯装饰层） -->
        <span
            v-if="lanyard"
            aria-hidden="true"
            class="absolute left-1/2 -translate-x-1/2 top-1 z-10 block size-2.5 rounded-full border-3 border-brutal bg-brutal-bg"
        />
        <AvatarRoot :class="classes">
            <slot />
        </AvatarRoot>
        <!-- role="status" 为 live region：读屏仅播报文本内容变化，故以 sr-only 文本承载 statusLabel，
             状态切换或语言切换时文本更新才会被播报（纯 aria-label 无内容则读屏不播报）。 -->
        <span v-if="status !== 'none'" :class="statusClasses" role="status">
            <span class="sr-only">{{ statusLabel }}</span>
        </span>
    </span>
</template>
