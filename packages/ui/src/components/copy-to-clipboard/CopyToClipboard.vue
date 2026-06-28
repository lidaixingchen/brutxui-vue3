<script setup lang="ts">
import { computed, toRef } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { Check, Copy } from '@lucide/vue'
import { useClipboard } from '../../composables/useClipboard'
import { useLocale } from '@/composables/useLocale'
import { cn } from '../../lib/utils'
import { copyToClipboardVariants } from './copy-to-clipboard-variants'
import { iconSizeVariants, type IconSize } from '../../lib/icon-size-variants'

type CopyToClipboardVariantProps = VariantProps<typeof copyToClipboardVariants>

const DEFAULT_COPY_DURATION = 2000

interface CopyToClipboardProps {
    text: string
    duration?: number
    variant?: NonNullable<CopyToClipboardVariantProps['variant']>
    size?: NonNullable<CopyToClipboardVariantProps['size']>
    class?: string
    iconSize?: IconSize
}

const props = withDefaults(defineProps<CopyToClipboardProps>(), {
    duration: DEFAULT_COPY_DURATION,
    variant: 'default',
    size: 'default',
    class: undefined,
    iconSize: 'default',
})

const { t } = useLocale()
const { copy, copied, isSupported } = useClipboard({ duration: toRef(props, 'duration') })

const handleCopy = () => {
    if (isSupported.value) {
        copy(props.text)
    }
}

const classes = computed(() =>
    cn(
        copyToClipboardVariants({
            variant: props.variant,
            size: props.size,
            state: copied.value ? 'copied' : 'idle',
        }),
        props.class
    )
)

const iconClasses = computed(() =>
    cn(iconSizeVariants({ size: props.iconSize }), 'stroke-[3]')
)
</script>

<template>
    <button
        type="button"
        :disabled="!isSupported"
        :class="classes"
        @click="handleCopy"
    >
        <slot :copied="copied">
            <template v-if="copied">
                <Check :class="iconClasses" />
                <span>{{ t('copyToClipboard.copied') }}</span>
            </template>
            <template v-else>
                <Copy :class="iconClasses" />
                <span>{{ t('copyToClipboard.copy') }}</span>
            </template>
        </slot>
    </button>
</template>
