<script setup lang="ts">
import { computed } from 'vue'
import { RotateCw, X } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'
import Button from '../button/Button.vue'
import Result from '../result/Result.vue'

interface ErrorCardProps {
    title?: string
    description?: string
    retryText?: string
    class?: string
    iconSize?: IconSize
}

const props = withDefaults(defineProps<ErrorCardProps>(), {
    title: undefined,
    description: undefined,
    retryText: undefined,
    class: undefined,
    iconSize: 'lg',
})

const { t } = useLocale()

const emit = defineEmits<{
    retry: []
    close: []
}>()

const rootClasses = computed(() => cn('w-full max-w-md', props.class))

const resolvedTitle = computed(() => props.title ?? t('errorCard.defaultTitle'))
const resolvedDescription = computed(() => props.description ?? t('errorCard.defaultDescription'))
const resolvedRetryText = computed(() => props.retryText ?? t('errorCard.defaultRetryText'))

const buttonIconClasses = cn(iconSizeVariants({ size: 'default' }), 'mr-1 stroke-[3]')
</script>

<template>
    <Result
        status="error"
        :title="resolvedTitle"
        :sub-title="resolvedDescription"
        :icon-size="iconSize"
        :class="rootClasses"
    >
        <template #extra>
            <Button variant="ghost" size="sm" @click="emit('close')">
                <X :class="buttonIconClasses" />
                {{ t('errorCard.dismiss') }}
            </Button>
            <Button variant="primary" size="sm" @click="emit('retry')">
                <RotateCw :class="buttonIconClasses" />
                {{ resolvedRetryText }}
            </Button>
            <slot name="actions" />
        </template>
    </Result>
</template>
