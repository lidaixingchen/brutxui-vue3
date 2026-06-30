<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, RotateCw, X } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'
import Card from '../card/Card.vue'
import CardContent from '../card/CardContent.vue'
import Button from '../button/Button.vue'
import Alert from '../alert/Alert.vue'
import AlertTitle from '../alert/AlertTitle.vue'
import AlertDescription from '../alert/AlertDescription.vue'

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

const iconClasses = computed(() =>
    cn(iconSizeVariants({ size: props.iconSize }))
)

const buttonIconClasses = cn(iconSizeVariants({ size: 'default' }), 'mr-1 stroke-[3]')
</script>

<template>
    <Card :class="rootClasses" variant="default">
        <Alert variant="danger" class="mb-4">
            <AlertTriangle :class="iconClasses" />
            <AlertTitle>{{ resolvedTitle }}</AlertTitle>
            <AlertDescription>{{ resolvedDescription }}</AlertDescription>
        </Alert>
        <CardContent>
            <div class="flex items-center justify-end gap-3">
                <Button variant="ghost" size="sm" @click="emit('close')">
                    <X :class="buttonIconClasses" />
                    {{ t('errorCard.dismiss') }}
                </Button>
                <Button variant="primary" size="sm" @click="emit('retry')">
                    <RotateCw :class="buttonIconClasses" />
                    {{ resolvedRetryText }}
                </Button>
            </div>
            <slot name="actions" />
        </CardContent>
    </Card>
</template>
