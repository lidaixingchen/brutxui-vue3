import { type Ref, ref, readonly, computed, watch, type ComputedRef } from 'vue'

export interface Step {
    id: string | number
    title: string
    description?: string
}

export interface UseStepperOptions {
    steps: Ref<Step[]>
    initialStep?: number
    /**
     * 线性模式：仅限制相邻步骤跳转（跨多步被阻止，`force` 参数可绕过），
     * 不校验前置步骤的完成状态，也不阻止任意回退。
     * 如需完整的线性流程约束（如未完成前置步骤不可前进），请在调用方侧校验。
     */
    linear?: boolean
    /**
     * 步骤导航通知：任意导航路径（goToStep/nextStep/previousStep/键盘操作）成功后触发。
     * 语义为「导航意图通知」而非「步骤变化通知」——目标步与当前步相同时也会触发，
     * 调用方如需去重应自行比较，或由外部状态管理做幂等处理。
     */
    onChange?: (step: number) => void
}

export interface UseStepperReturn {
    /** 只读视图：修改请经 goToStep / nextStep / previousStep */
    currentStep: Readonly<Ref<number>>
    totalSteps: ComputedRef<number>
    isFirstStep: ComputedRef<boolean>
    isLastStep: ComputedRef<boolean>
    goToStep: (index: number, force?: boolean) => void
    nextStep: () => void
    previousStep: () => void
    handleKeydown: (e: KeyboardEvent) => void
}

export function useStepper(options: UseStepperOptions): UseStepperReturn {
    // 步骤索引收敛到有效范围，供初始化与 watch 钳制共用
    const clampStep = (index: number) =>
        Math.min(Math.max(index, 0), Math.max(options.steps.value.length - 1, 0))
    const currentStep = ref(clampStep(options.initialStep ?? 0))
    const totalSteps = computed(() => options.steps.value.length)
    const isFirstStep = computed(() => currentStep.value === 0)
    const isLastStep = computed(() => currentStep.value === totalSteps.value - 1)

    // steps 动态变化（缩减/清空）时收敛 currentStep 到有效范围，避免 isLastStep/导航状态失真；
    // 钳制后同步触发 onChange，保证依赖回调同步外部状态的使用方不失步
    watch(totalSteps, () => {
        if (currentStep.value > totalSteps.value - 1) {
            currentStep.value = clampStep(currentStep.value)
            options.onChange?.(currentStep.value)
        }
    })

    function goToStep(index: number, force = false) {
        if (index < 0 || index >= totalSteps.value) return
        if (options.linear && !force) {
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
        // 忽略带修饰键的按键：避免拦截浏览器全局快捷键（Alt+方向键前进后退、
        // Ctrl+Home/End、Shift+滚动等），也避免误处理输入框内的组合键
        if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
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
                goToStep(0, true)
                break
            case 'End':
                e.preventDefault()
                goToStep(totalSteps.value - 1, true)
                break
        }
    }

    return {
        currentStep: readonly(currentStep),
        totalSteps,
        isFirstStep,
        isLastStep,
        goToStep,
        nextStep,
        previousStep,
        handleKeydown,
    }
}
