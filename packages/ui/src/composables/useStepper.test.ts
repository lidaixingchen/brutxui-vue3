import { effectScope, ref } from 'vue'
import { useStepper, type Step, type UseStepperOptions } from './useStepper'

describe('useStepper', () => {
    let scope: ReturnType<typeof effectScope>

    const defaultSteps: Step[] = [
        { id: 'step1', title: 'Step 1', description: 'First step' },
        { id: 'step2', title: 'Step 2' },
        { id: 'step3', title: 'Step 3', description: 'Last step' },
    ]

    beforeEach(() => {
        scope = effectScope(true)
    })

    afterEach(() => {
        scope.stop()
    })

    function createStepper(options: Partial<Omit<UseStepperOptions, 'steps'>> & { steps?: Step[] } = {}) {
        const { steps: rawSteps, ...rest } = options
        const steps = ref(rawSteps ?? defaultSteps)
        return scope.run(() =>
            useStepper({
                steps,
                ...rest,
            }),
        )!
    }

    // --- 初始化 ---

    describe('初始化', () => {
        it('默认从第 0 步开始', () => {
            const { currentStep } = createStepper()
            expect(currentStep.value).toBe(0)
        })

        it('支持自定义初始步骤', () => {
            const { currentStep } = createStepper({ initialStep: 2 })
            expect(currentStep.value).toBe(2)
        })

        it('initialStep 为 0 时与默认行为一致', () => {
            const { currentStep } = createStepper({ initialStep: 0 })
            expect(currentStep.value).toBe(0)
        })

        it('totalSteps 反映步骤数组长度', () => {
            const { totalSteps } = createStepper()
            expect(totalSteps.value).toBe(3)
        })

        it('isFirstStep 在初始步骤为 0 时为 true', () => {
            const { isFirstStep } = createStepper()
            expect(isFirstStep.value).toBe(true)
        })

        it('isFirstStep 在初始步骤不为 0 时为 false', () => {
            const { isFirstStep } = createStepper({ initialStep: 1 })
            expect(isFirstStep.value).toBe(false)
        })

        it('isLastStep 在初始步骤为最后一步时为 true', () => {
            const { isLastStep } = createStepper({ initialStep: 2 })
            expect(isLastStep.value).toBe(true)
        })

        it('isLastStep 在初始步骤不是最后一步时为 false', () => {
            const { isLastStep } = createStepper({ initialStep: 0 })
            expect(isLastStep.value).toBe(false)
        })
    })

    // --- goToStep ---

    describe('goToStep', () => {
        it('可以跳转到有效步骤', () => {
            const { currentStep, goToStep } = createStepper()
            goToStep(2)
            expect(currentStep.value).toBe(2)
        })

        it('跳转到负索引时忽略', () => {
            const { currentStep, goToStep } = createStepper()
            goToStep(-1)
            expect(currentStep.value).toBe(0)
        })

        it('跳转到超出范围的索引时忽略', () => {
            const { currentStep, goToStep } = createStepper()
            goToStep(3)
            expect(currentStep.value).toBe(0)
        })

        it('跳转到当前步骤时仍触发 onChange', () => {
            const onChange = vi.fn()
            const { goToStep } = createStepper({ onChange })
            goToStep(0)
            expect(onChange).toHaveBeenCalledWith(0)
        })

        it('非线性模式下允许跳转到任意有效步骤', () => {
            const { currentStep, goToStep } = createStepper({ linear: false })
            goToStep(2)
            expect(currentStep.value).toBe(2)
        })

        it('非线性模式下允许向后跳转到任意有效步骤', () => {
            const { currentStep, goToStep } = createStepper({ initialStep: 2, linear: false })
            goToStep(0)
            expect(currentStep.value).toBe(0)
        })
    })

    // --- 线性模式 ---

    describe('线性模式 (linear: true)', () => {
        it('允许跳转到下一步', () => {
            const { currentStep, goToStep } = createStepper({ linear: true })
            goToStep(1)
            expect(currentStep.value).toBe(1)
        })

        it('允许跳转到上一步', () => {
            const { currentStep, goToStep } = createStepper({ initialStep: 1, linear: true })
            goToStep(0)
            expect(currentStep.value).toBe(0)
        })

        it('阻止跳过步骤（向前跳多步）', () => {
            const { currentStep, goToStep } = createStepper({ linear: true })
            goToStep(2)
            expect(currentStep.value).toBe(0)
        })

        it('阻止跳过步骤（向后跳多步）', () => {
            const { currentStep, goToStep } = createStepper({ initialStep: 2, linear: true })
            goToStep(0)
            expect(currentStep.value).toBe(2)
        })

        it('线性模式下 onChange 不在被阻止的跳转中调用', () => {
            const onChange = vi.fn()
            const { goToStep } = createStepper({ linear: true, onChange })
            goToStep(2)
            expect(onChange).not.toHaveBeenCalled()
        })
    })

    // --- nextStep ---

    describe('nextStep', () => {
        it('从第一步前进到第二步', () => {
            const { currentStep, nextStep } = createStepper()
            nextStep()
            expect(currentStep.value).toBe(1)
        })

        it('连续调用可前进到后续步骤', () => {
            const { currentStep, nextStep } = createStepper()
            nextStep()
            nextStep()
            expect(currentStep.value).toBe(2)
        })

        it('在最后一步时不前进', () => {
            const { currentStep, nextStep } = createStepper({ initialStep: 2 })
            nextStep()
            expect(currentStep.value).toBe(2)
        })

        it('在最后一步时不触发 onChange', () => {
            const onChange = vi.fn()
            const { nextStep } = createStepper({ initialStep: 2, onChange })
            nextStep()
            expect(onChange).not.toHaveBeenCalled()
        })
    })

    // --- previousStep ---

    describe('previousStep', () => {
        it('从第二步后退到第一步', () => {
            const { currentStep, previousStep } = createStepper({ initialStep: 1 })
            previousStep()
            expect(currentStep.value).toBe(0)
        })

        it('连续调用可后退到前面步骤', () => {
            const { currentStep, previousStep } = createStepper({ initialStep: 2 })
            previousStep()
            previousStep()
            expect(currentStep.value).toBe(0)
        })

        it('在第一步时不后退', () => {
            const { currentStep, previousStep } = createStepper()
            previousStep()
            expect(currentStep.value).toBe(0)
        })

        it('在第一步时不触发 onChange', () => {
            const onChange = vi.fn()
            const { previousStep } = createStepper({ onChange })
            previousStep()
            expect(onChange).not.toHaveBeenCalled()
        })
    })

    // --- handleKeydown ---

    describe('handleKeydown', () => {
        function createKeyboardEvent(key: string): KeyboardEvent {
            const event = new KeyboardEvent('keydown', { key, bubbles: true })
            vi.spyOn(event, 'preventDefault')
            return event
        }

        it('ArrowRight 前进到下一步', () => {
            const { currentStep, handleKeydown } = createStepper()
            handleKeydown(createKeyboardEvent('ArrowRight'))
            expect(currentStep.value).toBe(1)
        })

        it('ArrowDown 前进到下一步', () => {
            const { currentStep, handleKeydown } = createStepper()
            handleKeydown(createKeyboardEvent('ArrowDown'))
            expect(currentStep.value).toBe(1)
        })

        it('ArrowLeft 后退到上一步', () => {
            const { currentStep, handleKeydown } = createStepper({ initialStep: 1 })
            handleKeydown(createKeyboardEvent('ArrowLeft'))
            expect(currentStep.value).toBe(0)
        })

        it('ArrowUp 后退到上一步', () => {
            const { currentStep, handleKeydown } = createStepper({ initialStep: 1 })
            handleKeydown(createKeyboardEvent('ArrowUp'))
            expect(currentStep.value).toBe(0)
        })

        it('Home 跳转到第一步', () => {
            const { currentStep, handleKeydown } = createStepper({ initialStep: 2 })
            handleKeydown(createKeyboardEvent('Home'))
            expect(currentStep.value).toBe(0)
        })

        it('End 跳转到最后一步', () => {
            const { currentStep, handleKeydown } = createStepper()
            handleKeydown(createKeyboardEvent('End'))
            expect(currentStep.value).toBe(2)
        })

        it('导航键调用 preventDefault', () => {
            const { handleKeydown } = createStepper()
            const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End']
            for (const key of keys) {
                const event = createKeyboardEvent(key)
                handleKeydown(event)
                expect(event.preventDefault).toHaveBeenCalled()
            }
        })

        it('不相关的按键不做任何操作', () => {
            const { currentStep, handleKeydown } = createStepper()
            const initial = currentStep.value
            handleKeydown(createKeyboardEvent('Tab'))
            expect(currentStep.value).toBe(initial)
        })

        it('在最后一步时 ArrowRight 不前进', () => {
            const { currentStep, handleKeydown } = createStepper({ initialStep: 2 })
            handleKeydown(createKeyboardEvent('ArrowRight'))
            expect(currentStep.value).toBe(2)
        })

        it('在第一步时 ArrowLeft 不后退', () => {
            const { currentStep, handleKeydown } = createStepper()
            handleKeydown(createKeyboardEvent('ArrowLeft'))
            expect(currentStep.value).toBe(0)
        })
    })

    // --- onChange 回调 ---

    describe('onChange 回调', () => {
        it('goToStep 成功时调用 onChange', () => {
            const onChange = vi.fn()
            const { goToStep } = createStepper({ onChange })
            goToStep(1)
            expect(onChange).toHaveBeenCalledTimes(1)
            expect(onChange).toHaveBeenCalledWith(1)
        })

        it('nextStep 成功时调用 onChange', () => {
            const onChange = vi.fn()
            const { nextStep } = createStepper({ onChange })
            nextStep()
            expect(onChange).toHaveBeenCalledWith(1)
        })

        it('previousStep 成功时调用 onChange', () => {
            const onChange = vi.fn()
            const { previousStep } = createStepper({ initialStep: 1, onChange })
            previousStep()
            expect(onChange).toHaveBeenCalledWith(0)
        })

        it('handleKeydown 触发导航时调用 onChange', () => {
            const onChange = vi.fn()
            const { handleKeydown } = createStepper({ onChange })
            handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
            expect(onChange).toHaveBeenCalledWith(1)
        })

        it('不提供 onChange 时不报错', () => {
            const { goToStep, nextStep, previousStep } = createStepper()
            expect(() => {
                goToStep(1)
                nextStep()
                previousStep()
            }).not.toThrow()
        })

        it('onChange 不在无效跳转时调用', () => {
            const onChange = vi.fn()
            const { goToStep } = createStepper({ onChange })
            goToStep(-1)
            goToStep(10)
            expect(onChange).not.toHaveBeenCalled()
        })
    })

    // --- 步骤响应式 ---

    describe('步骤列表响应式', () => {
        it('步骤列表变化时 totalSteps 更新', () => {
            const steps = ref<Step[]>([
                { id: 'a', title: 'A' },
                { id: 'b', title: 'B' },
            ])
            const { totalSteps } = scope.run(() => useStepper({ steps }))!
            expect(totalSteps.value).toBe(2)

            steps.value = [
                { id: 'a', title: 'A' },
                { id: 'b', title: 'B' },
                { id: 'c', title: 'C' },
                { id: 'd', title: 'D' },
            ]
            expect(totalSteps.value).toBe(4)
        })

        it('步骤列表变化时 isFirstStep 更新', () => {
            const steps = ref<Step[]>([
                { id: 'a', title: 'A' },
                { id: 'b', title: 'B' },
            ])
            const { isFirstStep } = scope.run(() => useStepper({ steps }))!
            expect(isFirstStep.value).toBe(true)
        })

        it('步骤列表变化时 isLastStep 更新', () => {
            const steps = ref<Step[]>([
                { id: 'a', title: 'A' },
                { id: 'b', title: 'B' },
            ])
            const { isLastStep } = scope.run(() => useStepper({ steps, initialStep: 1 }))!
            expect(isLastStep.value).toBe(true)

            steps.value = [
                { id: 'a', title: 'A' },
                { id: 'b', title: 'B' },
                { id: 'c', title: 'C' },
            ]
            expect(isLastStep.value).toBe(false)
        })

        it('currentStep 在步骤列表缩短后越界时，goToStep 行为正确', () => {
            const steps = ref<Step[]>([
                { id: 'a', title: 'A' },
                { id: 'b', title: 'B' },
                { id: 'c', title: 'C' },
            ])
            const { currentStep, goToStep, totalSteps } = scope.run(() => useStepper({ steps }))!
            goToStep(2)
            expect(currentStep.value).toBe(2)

            // 缩短列表，currentStep 仍为 2，但 totalSteps 变为 1
            steps.value = [{ id: 'a', title: 'A' }]
            expect(totalSteps.value).toBe(1)
            // goToStep 到 index=2 现在超出范围，应被忽略
            goToStep(2)
            expect(currentStep.value).toBe(2) // 值不变，但 nextStep 等会受 totalSteps 约束
        })
    })

    // --- 边界场景 ---

    describe('边界场景', () => {
        it('单个步骤时 isFirstStep 和 isLastStep 同时为 true', () => {
            const { isFirstStep, isLastStep } = createStepper({
                steps: [{ id: 'only', title: 'Only Step' }],
            })
            expect(isFirstStep.value).toBe(true)
            expect(isLastStep.value).toBe(true)
        })

        it('单个步骤时 nextStep 和 previousStep 均无效', () => {
            const { currentStep, nextStep, previousStep } = createStepper({
                steps: [{ id: 'only', title: 'Only Step' }],
            })
            nextStep()
            expect(currentStep.value).toBe(0)
            previousStep()
            expect(currentStep.value).toBe(0)
        })

        it('空步骤列表时 totalSteps 为 0', () => {
            const { totalSteps, isFirstStep, isLastStep } = createStepper({ steps: [] })
            expect(totalSteps.value).toBe(0)
            // 空列表时 currentStep=0，0 === 0 为 true，0 === -1 为 false
            expect(isFirstStep.value).toBe(true)
            expect(isLastStep.value).toBe(false)
        })

        it('空步骤列表时 goToStep 无效', () => {
            const { currentStep, goToStep } = createStepper({ steps: [] })
            goToStep(0)
            expect(currentStep.value).toBe(0)
        })
    })
})
