<script lang="ts">
import { formWizardContextKey } from './form-context'
import type { FormStep, FormWizardContext, FormWizardProps } from './form-wizard-types'

export { formWizardContextKey }
export type { FormStep, FormWizardContext, FormWizardProps }
export { useFormWizard } from './form-wizard-utils'
</script>

<script setup lang="ts">
import { ref, computed, provide, watch } from 'vue'
import { cn } from '@/lib/utils'
import { formWizardRootVariants, formWizardNavigationVariants, formWizardStepInfoVariants, formWizardStepCounterVariants, formWizardErrorPanelVariants, formWizardErrorTitleVariants } from './form-wizard-variants'
import Stepper from '../stepper/Stepper.vue'
import type { StepperStep } from '../stepper/Stepper.vue'
import Button from '../button/Button.vue'
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
    'step-change': [step: number, previousStep: number]
    complete: [values: Record<string, unknown>]
    'validation-error': [step: number, errors: Record<string, string>]
    'navigation-blocked': [targetStep: number, blockedStep: number]
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

watch(() => props.modelValue, () => {
    stepErrors.value.delete(currentStep.value)
}, { deep: true })

watch(currentStep, () => {
    stepErrors.value.delete(currentStep.value)
})

function validateCurrentStep(): boolean {
    if (!props.validateOnNext) return true

    const step = currentStepConfig.value
    if (!step.validator) return true

    const result = step.validator(props.modelValue)
    if (!result.valid) {
        stepErrors.value.set(currentStep.value, result.errors)
        emit('validation-error', currentStep.value, result.errors)
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
                emit('navigation-blocked', step, i)
                return
            }
        }
    }

    const previousStep = currentStep.value
    currentStep.value = step
    emit('step-change', step, previousStep)
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
    cn(formWizardRootVariants(), props.class)
)

const navigationClasses = formWizardNavigationVariants()
const stepInfoClasses = formWizardStepInfoVariants()
const stepCounterClasses = formWizardStepCounterVariants()
const errorPanelClasses = formWizardErrorPanelVariants()
const errorTitleClasses = formWizardErrorTitleVariants()
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
        <div :class="navigationClasses">
            <Button
                v-if="!isFirstStep"
                variant="default"
                type="button"
                @click="previousStep"
            >
                {{ t('formWizard.previousStep') }}
            </Button>
            <div v-else />

            <div :class="stepInfoClasses">
                <span :class="stepCounterClasses">
                    {{ t('formWizard.stepOf', { current: currentStep + 1, total: steps.length }) }}
                </span>
            </div>

            <Button
                v-if="!isLastStep"
                variant="primary"
                type="button"
                :disabled="!canGoNext"
                @click="nextStep"
            >
                {{ t('formWizard.nextStep') }}
            </Button>
            <Button
                v-else
                variant="success"
                type="button"
                @click="complete"
            >
                {{ t('formWizard.complete') }}
            </Button>
        </div>

        <!-- Error Display -->
        <div v-if="getStepErrors(currentStep)" :class="errorPanelClasses">
            <p :class="errorTitleClasses">
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
