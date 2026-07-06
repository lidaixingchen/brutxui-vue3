<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import { type IconSize } from '@/lib/icon-size-variants'
import Button from '../button/Button.vue'
import Result from '../result/Result.vue'

interface SuccessCardProps {
    title?: string
    description?: string
    confirmText?: string
    class?: string
    iconSize?: IconSize
}

const props = withDefaults(defineProps<SuccessCardProps>(), {
    title: undefined,
    description: undefined,
    confirmText: undefined,
    class: undefined,
    iconSize: '2xl',
})

const { t } = useLocale()

const emit = defineEmits<{
    confirm: []
}>()

const rootClasses = computed(() => cn('w-full max-w-md', props.class))

const resolvedTitle = computed(() => props.title ?? t('successCard.defaultTitle'))
const resolvedDescription = computed(() => props.description ?? t('successCard.defaultDescription'))
const resolvedConfirmText = computed(() => props.confirmText ?? t('successCard.defaultConfirmText'))
</script>

<template>
    <Result
        status="success"
        :title="resolvedTitle"
        :sub-title="resolvedDescription"
        :icon-size="iconSize"
        :class="rootClasses"
    >
        <template #extra>
            <Button variant="primary" @click="emit('confirm')">
                {{ resolvedConfirmText }}
            </Button>
            <slot name="actions" />
        </template>
    </Result>
</template>
