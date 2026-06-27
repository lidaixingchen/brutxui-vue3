<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { useLocale } from '@/composables/useLocale'
import Button from '../button/Button.vue'
import { buttonVariants } from '../button/button-variants'

type ButtonVariantProps = VariantProps<typeof buttonVariants>

interface SubmitButtonProps {
    variant?: NonNullable<ButtonVariantProps['variant']>
    size?: NonNullable<ButtonVariantProps['size']>
    pendingText?: string
    loading?: boolean
    disabled?: boolean
    class?: string
}

const props = withDefaults(defineProps<SubmitButtonProps>(), {
    variant: 'default',
    size: 'default',
    pendingText: undefined,
    loading: false,
    disabled: false,
    class: undefined,
})

const { t } = useLocale()

const resolvedPendingText = computed(() => props.pendingText ?? t('submitButton.submitting'))
</script>

<template>
    <Button
        type="submit"
        :variant="variant"
        :size="size"
        :loading="loading"
        :disabled="disabled"
        :class="props.class"
    >
        <template v-if="loading && resolvedPendingText">
            {{ resolvedPendingText }}
        </template>
        <slot v-else />
    </Button>
</template>
