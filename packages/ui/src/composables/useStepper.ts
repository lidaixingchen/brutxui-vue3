import { type Ref, ref, computed, type ComputedRef } from 'vue'

export interface Step {
    id: string | number
    title: string
    description?: string
}

export interface UseStepperOptions {
    steps: Ref<Step[]>
    initialStep?: number
    linear?: boolean
    onChange?: (step: number) => void
}

export interface UseStepperReturn {
    currentStep: Ref<number>
    totalSteps: ComputedRef<number>
    isFirstStep: ComputedRef<boolean>
    isLastStep: ComputedRef<boolean>
    goToStep: (index: number) => void
    nextStep: () => void
    previousStep: () => void
    handleKeydown: (e: KeyboardEvent) => void
}

export function useStepper(options: UseStepperOptions): UseStepperReturn {
    const currentStep = ref(options.initialStep ?? 0)
    const totalSteps = computed(() => options.steps.value.length)
    const isFirstStep = computed(() => currentStep.value === 0)
    const isLastStep = computed(() => currentStep.value === totalSteps.value - 1)

    function goToStep(index: number) {
        if (index < 0 || index >= totalSteps.value) return
        if (options.linear) {
            if (Math.abs(index - currentStep.value) > 1) return
        }
        currentStep.value = index
        options.onChange?.(index)
    }

    function nextStep() {
        if (isLastStep.value) return
        goToStep(currentStep.value + 1)
    }

    function previousStep() {
        if (isFirstStep.value) return
        goToStep(currentStep.value - 1)
    }

    function handleKeydown(e: KeyboardEvent) {
        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault()
                nextStep()
                break
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault()
                previousStep()
                break
            case 'Home':
                e.preventDefault()
                goToStep(0)
                break
            case 'End':
                e.preventDefault()
                goToStep(totalSteps.value - 1)
                break
        }
    }

    return {
        currentStep,
        totalSteps,
        isFirstStep,
        isLastStep,
        goToStep,
        nextStep,
        previousStep,
        handleKeydown,
    }
}
