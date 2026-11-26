<script lang="ts">
import { formWizardContextKey } from './form-context'
import type { FormStep, FormWizardContext, FormWizardProps } from './form-wizard-types'

export { formWizardContextKey }
export type { FormStep, FormWizardContext, FormWizardProps }
export { useFormWizard } from './form-wizard-utils'
</script>

<script setup lang="ts">
import { ref, computed, nextTick, onBeforeUnmount, provide, watch } from 'vue'
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

interface ValuePatch {
    values: Record<string, unknown>
    stepId: string | undefined
}

interface ValueBatch {
    patches: ValuePatch[]
    actions: Array<() => void>
    sourceStepId?: string
}

let pendingValueBatch: ValueBatch | undefined

function clampStepIndex(index: number, length: number) {
    return Math.min(Math.max(index, 0), Math.max(length - 1, 0))
}

const stepIds = computed(() => props.steps.map(step => step.id))
const activeStepId = ref(props.steps[clampStepIndex(props.initialStep, props.steps.length)]?.id)
const completedSteps = ref(new Set<string>())
const stepErrors = ref(new Map<string, Record<string, string>>())
const currentStep = computed({
    get: () => activeStepId.value === undefined ? 0 : Math.max(stepIds.value.indexOf(activeStepId.value), 0),
    set: (index) => {
        const step = props.steps[index]
        if (step) activeStepId.value = step.id
    },
})

const stepperSteps = computed<StepperStep[]>(() =>
    props.steps.map((step) => ({
        id: step.id,
        title: step.title,
        description: step.description,
    }))
)

const isFirstStep = computed(() => currentStep.value === 0)
const isLastStep = computed(() => currentStep.value === props.steps.length - 1)
const currentStepConfig = computed(() => props.steps.find(step => step.id === activeStepId.value))
const currentStepErrors = computed(() => activeStepId.value === undefined ? undefined : stepErrors.value.get(activeStepId.value))
const canGoNext = computed(() => !props.linear || !props.validateOnNext || !currentStepErrors.value)

watch(stepIds, (ids, previousIds) => {
    const existingIds = new Set(ids)
    for (const id of previousIds) {
        if (existingIds.has(id)) continue
        completedSteps.value.delete(id)
        stepErrors.value.delete(id)
    }

    const activeId = activeStepId.value
    if (activeId !== undefined && existingIds.has(activeId)) return
    const previousIndex = activeId === undefined ? 0 : previousIds.indexOf(activeId)
    activeStepId.value = ids[clampStepIndex(previousIndex, ids.length)]
})

watch(() => props.modelValue, () => {
    // 同批回退时，仍从发起编辑的步骤清除该步骤及后续步骤的校验结论。
    const sourceId = pendingValueBatch?.sourceStepId
    const sourceIndex = sourceId === undefined ? -1 : stepIds.value.indexOf(sourceId)
    for (const id of stepIds.value.slice(sourceIndex < 0 ? currentStep.value : sourceIndex)) {
        completedSteps.value.delete(id)
        stepErrors.value.delete(id)
    }
}, { deep: true })

function validateStep(step: FormStep, index: number, values: Record<string, unknown>): boolean {
    if (!step.validator) return true

    const result = step.validator(values)
    if (!result.valid) {
        completedSteps.value.delete(step.id)
        stepErrors.value.set(step.id, result.errors)
        emit('validation-error', index, result.errors)
        return false
    }

    stepErrors.value.delete(step.id)
    return true
}

// 跳转步骤的统一入口：goToStep（线性拦截后）与 complete（失败回跳）共用，
// 避免跳转语义在两处漂移
function setCurrentStep(step: number) {
    const previousStep = currentStep.value
    currentStep.value = step
    emit('step-change', step, previousStep)
}

function navigateToStep(step: number) {
    if (!props.steps[step]) return

    if (props.linear && step > currentStep.value) {
        for (let i = 0; i < step; i++) {
            const prerequisite = props.steps[i]
            if (!prerequisite.optional && !completedSteps.value.has(prerequisite.id)) {
                emit('navigation-blocked', step, i)
                return
            }
        }
    }

    setCurrentStep(step)
}

function goToStep(step: number) {
    const targetId = stepIds.value[step]
    if (targetId === undefined) return

    if (props.linear && step > currentStep.value) {
        withConfirmedValues(() => navigateToStep(stepIds.value.indexOf(targetId)))
    } else {
        navigateToStep(step)
    }
}

function nextStep() {
    if (!currentStepConfig.value || isLastStep.value) return

    withConfirmedValues(() => {
        const step = currentStepConfig.value
        if (!step || isLastStep.value) return
        if (props.validateOnNext && !validateStep(step, currentStep.value, props.modelValue)) return

        completedSteps.value.add(step.id)
        navigateToStep(currentStep.value + 1)
    })
}

function previousStep() {
    if (isFirstStep.value) return
    navigateToStep(currentStep.value - 1)
}

function complete() {
    withConfirmedValues(() => {
        const values = props.modelValue
        if (props.validateOnNext) {
            for (const [index, step] of props.steps.entries()) {
                if (!step.validator) continue
                if (!validateStep(step, index, values)) {
                    if (step.id !== activeStepId.value) setCurrentStep(index)
                    return
                }
                completedSteps.value.add(step.id)
            }
        }
        emit('complete', values)
    })
}

onBeforeUnmount(() => {
    pendingValueBatch = undefined
})

function updateValues(values: Record<string, unknown>) {
    const patch = { values: { ...values }, stepId: activeStepId.value }
    if (pendingValueBatch) {
        pendingValueBatch.patches.push(patch)
        return
    }

    const batch: ValueBatch = { patches: [], actions: [] }
    pendingValueBatch = batch
    void dispatchValueUpdates(batch, patch)
}

async function dispatchValueUpdates(batch: ValueBatch, firstPatch: ValuePatch) {
    let patch: ValuePatch | undefined = firstPatch
    while (patch) {
        batch.sourceStepId = patch.stepId
        emit('update:modelValue', { ...props.modelValue, ...patch.values })

        // 每个补丁都等待父组件回传本次更新，下一次合并使用回传后的值。
        await Promise.resolve()
        await nextTick()
        if (pendingValueBatch !== batch) return
        patch = batch.patches.shift()
    }

    pendingValueBatch = undefined
    for (const action of batch.actions) action()
}

function withConfirmedValues(action: () => void) {
    if (!pendingValueBatch) {
        action()
        return
    }

    const stepId = activeStepId.value
    pendingValueBatch.actions.push(() => {
        if (stepId === activeStepId.value) action()
    })
}

function getStepErrors(step: number): Record<string, string> | undefined {
    const id = stepIds.value[step]
    return id === undefined ? undefined : stepErrors.value.get(id)
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
                <div v-show="step.id === activeStepId" role="tabpanel" :aria-label="step.title">
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
        <div v-if="currentStepErrors" :class="errorPanelClasses">
            <p :class="errorTitleClasses">
                {{ t('formWizard.validationErrors') }}
            </p>
            <ul class="mt-2 list-disc list-inside">
                <li v-for="(error, field) in currentStepErrors" :key="field">
                    {{ error }}
                </li>
            </ul>
        </div>
    </div>
</template>
