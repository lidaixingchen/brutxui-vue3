<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'
import Stepper from '../stepper/Stepper.vue'
import Button from '../button/Button.vue'
import Card from '../card/Card.vue'
import EmptyState from '../empty-state/EmptyState.vue'

export interface StepperStepItem {
    title: string
    description?: string
}

interface StepperSectionProps {
    title?: string
    steps?: StepperStepItem[]
    modelValue?: number
    class?: string
    iconSize?: IconSize
}

const props = withDefaults(defineProps<StepperSectionProps>(), {
    title: undefined,
    steps: () => [],
    modelValue: 0,
    class: undefined,
    iconSize: 'default',
})

const emit = defineEmits<{
    'update:modelValue': [step: number]
    'step-click': [index: number]
}>()

const { t } = useLocale()

const resolvedTitle = computed(() => props.title ?? t('stepperSection.defaultTitle'))
const resolvedPrevious = computed(() => t('stepperSection.previous'))
const resolvedNext = computed(() => t('stepperSection.next'))

const stepperSteps = computed(() =>
    props.steps.map((step, index) => ({
        id: index,
        title: step.title,
        description: step.description,
    }))
)

const activeStep = computed(() => props.modelValue)
const canGoPrevious = computed(() => activeStep.value > 0)
const canGoNext = computed(() => activeStep.value < props.steps.length - 1)

const rootClasses = computed(() => cn('w-full max-w-3xl mx-auto', props.class))

const previousIconClasses = computed(() =>
    cn(iconSizeVariants({ size: props.iconSize }), 'mr-1')
)

const nextIconClasses = computed(() =>
    cn(iconSizeVariants({ size: props.iconSize }), 'ml-1')
)

function handleStepClick(index: number) {
    emit('update:modelValue', index)
    emit('step-click', index)
}

function handlePrevious() {
    if (canGoPrevious.value) {
        const prev = activeStep.value - 1
        emit('update:modelValue', prev)
        emit('step-click', prev)
    }
}

function handleNext() {
    if (canGoNext.value) {
        const next = activeStep.value + 1
        emit('update:modelValue', next)
        emit('step-click', next)
    }
}
</script>

<template>
    <div :class="rootClasses">
        <slot name="header">
            <div class="text-center mb-8">
                <h2 class="text-3xl font-black tracking-tight">
                    {{ resolvedTitle }}
                </h2>
            </div>
        </slot>

        <template v-if="steps.length > 0">
            <Stepper
                :steps="stepperSteps"
                :model-value="activeStep"
                orientation="horizontal"
                @step-click="handleStepClick"
            />

            <Card variant="default" class="mt-6">
                <div class="p-6">
                    <slot name="default" />
                </div>
            </Card>

            <div class="flex items-center justify-between mt-6">
                <Button
                    variant="outline"
                    :disabled="!canGoPrevious"
                    @click="handlePrevious"
                >
                    <ChevronLeft :class="previousIconClasses" />
                    {{ resolvedPrevious }}
                </Button>
                <Button
                    variant="primary"
                    :disabled="!canGoNext"
                    @click="handleNext"
                >
                    {{ resolvedNext }}
                    <ChevronRight :class="nextIconClasses" />
                </Button>
            </div>
        </template>
        <EmptyState v-else :title="t('stepperSection.emptyTitle')" />

        <slot name="footer" />
    </div>
</template>
