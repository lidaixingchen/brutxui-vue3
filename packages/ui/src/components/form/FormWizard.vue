<script lang="ts">
import { inject } from 'vue'
import { formWizardContextKey } from './form-context'
import type { FormStep, FormWizardContext } from './form-wizard-types'

export { formWizardContextKey }
export type { FormStep, FormWizardContext }

export interface FormWizardProps {
    steps: FormStep[]
    initialStep?: number
    validateOnNext?: boolean
    showIndicator?: boolean
    linear?: boolean
    modelValue?: Record<string, unknown>
    class?: string
}

export function useFormWizard() {
    const context = inject(formWizardContextKey)
    if (!context) {
        throw new Error('[BrutxUI] useFormWizard() must be used within a FormWizard component.')
    }
    return context
}
</script>

<script setup lang="ts">
import { ref, computed, provide } from 'vue'
import { cn } from '../../lib/utils'
import { Stepper } from '../stepper'
import type { StepperStep } from '../stepper'
import { useLocale } from '@/composables/useLocale'

const { t } = useLocale()

const props = withDefaults(defineProps<FormWizardProps>(), {
    initialStep: 0,
    validateOnNext: true,
    showIndicator: true,
    linear: true,
    modelValue: () => ({}),
    class: undefined,
})

const emit = defineEmits<{
    'update:modelValue': [values: Record<string, unknown>]
    stepChange: [step: number, previousStep: number]
    complete: [values: Record<string, unknown>]
    validationError: [step: number, errors: Record<string, string>]
}>()

const currentStep = ref(props.initialStep)
const completedSteps = ref<Set<number>>(new Set())
const stepErrors = ref<Map<number, Record<string, string>>>(new Map())

const stepperSteps = computed<StepperStep[]>(() =>
    props.steps.map((step) => ({
        id: step.id,
        title: step.title,
        description: step.description,
    }))
)

const isFirstStep = computed(() => currentStep.value === 0)
const isLastStep = computed(() => currentStep.value === props.steps.length - 1)
const currentStepConfig = computed(() => props.steps[currentStep.value])

const canGoNext = computed(() => {
    if (!props.linear) return true
    return !stepErrors.value.has(currentStep.value)
})

function validateCurrentStep(): boolean {
    if (!props.validateOnNext) return true

    const step = currentStepConfig.value
    if (!step.validator) return true

    const result = step.validator(props.modelValue)
    if (!result.valid) {
        stepErrors.value.set(currentStep.value, result.errors)
        emit('validationError', currentStep.value, result.errors)
        return false
    }

    stepErrors.value.delete(currentStep.value)
    return true
}

function goToStep(step: number) {
    if (step < 0 || step >= props.steps.length) return

    if (props.linear && step > currentStep.value) {
        for (let i = 0; i < step; i++) {
            if (!completedSteps.value.has(i) && !props.steps[i].optional) {
                return
            }
        }
    }

    const previousStep = currentStep.value
    currentStep.value = step
    emit('stepChange', step, previousStep)
}

function nextStep() {
    if (isLastStep.value) return

    if (validateCurrentStep()) {
        completedSteps.value.add(currentStep.value)
        goToStep(currentStep.value + 1)
    }
}

function previousStep() {
    if (isFirstStep.value) return
    goToStep(currentStep.value - 1)
}

function complete() {
    if (validateCurrentStep()) {
        completedSteps.value.add(currentStep.value)
        emit('complete', props.modelValue)
    }
}

function updateValues(values: Record<string, unknown>) {
    emit('update:modelValue', values)
}

function getStepErrors(step: number): Record<string, string> | undefined {
    return stepErrors.value.get(step)
}

provide(formWizardContextKey, {
    currentStep,
    steps: computed(() => props.steps),
    values: computed(() => props.modelValue),
    updateValues,
    nextStep,
    previousStep,
    goToStep,
    complete,
    getStepErrors,
    isFirstStep,
    isLastStep,
    canGoNext,
})

const rootClasses = computed(() =>
    cn('flex flex-col gap-6', props.class)
)
</script>

<template>
    <div :class="rootClasses" role="form" :aria-label="t('formWizard.label')">
        <!-- Step Indicator -->
        <Stepper
            v-if="showIndicator"
            :steps="stepperSteps"
            :model-value="currentStep"
            @update:model-value="goToStep"
        />

        <!-- Step Content -->
        <div class="min-h-50">
            <template v-for="(step, index) in steps" :key="step.id">
                <div v-show="index === currentStep" role="tabpanel" :aria-label="step.title">
                    <slot :name="`step-${step.id}`" :step="step" :index="index" />
                </div>
            </template>
        </div>

        <!-- Navigation -->
        <div class="flex items-center justify-between gap-4 pt-4 border-t-3 border-brutal">
            <button
                v-if="!isFirstStep"
                type="button"
                class="px-6 py-3 border-3 border-brutal bg-brutal-bg text-brutal-fg font-bold hover:-translate-y-0.5 hover:shadow-brutal active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                @click="previousStep"
            >
                {{ t('formWizard.previousStep') }}
            </button>
            <div v-else />

            <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-brutal-fg/60">
                    {{ t('formWizard.stepOf', { current: currentStep + 1, total: steps.length }) }}
                </span>
            </div>

            <button
                v-if="!isLastStep"
                type="button"
                class="px-6 py-3 border-3 border-brutal bg-brutal-primary text-brutal-fg font-bold hover:-translate-y-0.5 hover:shadow-brutal active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="!canGoNext"
                @click="nextStep"
            >
                {{ t('formWizard.nextStep') }}
            </button>
            <button
                v-else
                type="button"
                class="px-6 py-3 border-3 border-brutal bg-brutal-success text-brutal-fg font-bold hover:-translate-y-0.5 hover:shadow-brutal active:translate-y-0 active:shadow-none transition-all"
                @click="complete"
            >
                {{ t('formWizard.complete') }}
            </button>
        </div>

        <!-- Error Display -->
        <div v-if="getStepErrors(currentStep)" class="p-4 border-3 border-brutal bg-brutal-destructive/10 text-brutal-destructive">
            <p class="font-bold">
                {{ t('formWizard.validationErrors') }}
            </p>
            <ul class="mt-2 list-disc list-inside">
                <li v-for="(error, field) in getStepErrors(currentStep)" :key="field">
                    {{ error }}
                </li>
            </ul>
        </div>
    </div>
</template>
