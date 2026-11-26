import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import FormWizard from './FormWizard.vue'
import { useFormWizard } from './form-wizard-utils'
import type { FormStep } from './form-wizard-types'

const globalProvide = { provide: { [LOCALE_INJECTION_KEY]: en } }

const testSteps: FormStep[] = [
    { id: 'step1', title: 'Personal Info' },
    { id: 'step2', title: 'Address' },
    { id: 'step3', title: 'Review' },
]

describe('FormWizard', () => {
    it('renders with steps', () => {
        const wrapper = mount(FormWizard, {
            props: {
                steps: testSteps,
            },
            global: globalProvide,
        })
        expect(wrapper.find('[role="form"]').exists()).toBe(true)
    })

    it('renders step indicator', () => {
        const wrapper = mount(FormWizard, {
            props: {
                steps: testSteps,
                showIndicator: true,
            },
            global: globalProvide,
        })
        expect(wrapper.find('[role="list"]').exists()).toBe(true)
    })

    it('hides step indicator when showIndicator is false', () => {
        const wrapper = mount(FormWizard, {
            props: {
                steps: testSteps,
                showIndicator: false,
            },
            global: globalProvide,
        })
        expect(wrapper.find('[role="list"]').exists()).toBe(false)
    })

    it('shows first step by default', () => {
        const wrapper = mount(FormWizard, {
            props: {
                steps: testSteps,
            },
            global: globalProvide,
            slots: {
                'step-step1': '<div class="step-1">Step 1 Content</div>',
            },
        })
        expect(wrapper.find('.step-1').exists()).toBe(true)
    })

    it('shows next and complete buttons', () => {
        const wrapper = mount(FormWizard, {
            props: {
                steps: testSteps,
            },
            global: globalProvide,
        })
        expect(wrapper.text()).toContain('Next')
        expect(wrapper.text()).not.toContain('Previous')
    })

    it('emits stepChange when navigating', async () => {
        const wrapper = mount(FormWizard, {
            props: {
                steps: testSteps,
            },
            global: globalProvide,
        })
        const nextButton = wrapper.findAll('button').find(b => b.text() === 'Next')
        await nextButton!.trigger('click')
        expect(wrapper.emitted('step-change')).toBeTruthy()
        expect(wrapper.emitted('step-change')![0]).toEqual([1, 0])
    })

    it('shows previous button after navigating', async () => {
        const wrapper = mount(FormWizard, {
            props: {
                steps: testSteps,
            },
            global: globalProvide,
        })
        const nextButton = wrapper.findAll('button').find(b => b.text() === 'Next')
        await nextButton!.trigger('click')
        expect(wrapper.text()).toContain('Previous')
    })

    it('emits complete on last step', async () => {
        const wrapper = mount(FormWizard, {
            props: {
                steps: testSteps,
                validateOnNext: false,
            },
            global: globalProvide,
        })
        const nextButton = wrapper.findAll('button').find(b => b.text() === 'Next')
        await nextButton!.trigger('click')
        await nextButton!.trigger('click')
        const completeButton = wrapper.findAll('button').find(b => b.text() === 'Complete')
        await completeButton!.trigger('click')
        expect(wrapper.emitted('complete')).toBeTruthy()
    })

    it('shows step count', () => {
        const wrapper = mount(FormWizard, {
            props: {
                steps: testSteps,
            },
            global: globalProvide,
        })
        expect(wrapper.text()).toContain('Step 1 of 3')
    })

    it('applies custom class', () => {
        const wrapper = mount(FormWizard, {
            props: {
                steps: testSteps,
                class: 'custom-wizard',
            },
            global: globalProvide,
        })
        expect(wrapper.classes()).toContain('custom-wizard')
    })

    it('validates step when validateOnNext is true', async () => {
        const stepsWithValidation: FormStep[] = [
            {
                id: 'step1',
                title: 'Step 1',
                validator: () => ({ valid: false, errors: { name: 'Name is required' } }),
            },
            { id: 'step2', title: 'Step 2' },
        ]

        const wrapper = mount(FormWizard, {
            props: {
                steps: stepsWithValidation,
                validateOnNext: true,
            },
            global: globalProvide,
        })
        const nextButton = wrapper.findAll('button').find(b => b.text() === 'Next')
        await nextButton!.trigger('click')
        expect(wrapper.emitted('validation-error')).toBeTruthy()
        expect(wrapper.text()).toContain('Name is required')
    })

    it('navigates to specific step when clicking indicator', async () => {
        const wrapper = mount(FormWizard, {
            props: {
                steps: testSteps,
                validateOnNext: false,
                linear: false,
            },
            global: globalProvide,
        })
        const stepButtons = wrapper.findAll('[role="listitem"] button')
        await stepButtons[2].trigger('click')
        expect(wrapper.emitted('step-change')).toBeTruthy()
    })

    it('clears completedSteps of downstream steps when modelValue changes', async () => {
        // 测试流程：
        // 1. 完成步骤 0、1（completedSteps={0,1}）
        // 2. 返回步骤 0，修改 modelValue，应清除 0 及下游 1、2（completedSteps={}）
        // 3. 点击 Next 完成步骤 0（completedSteps={0}，currentStep=1）
        // 4. linear 模式跳到步骤 2 时，因步骤 1 未完成应被 navigation-blocked 阻止
        const wrapper = mount(FormWizard, {
            props: {
                steps: testSteps,
                validateOnNext: false,
                linear: true,
                modelValue: { name: 'Alice' },
            },
            global: globalProvide,
        })

        const nextButton = () => wrapper.findAll('button').find(b => b.text() === 'Next')!
        const prevButton = () => wrapper.findAll('button').find(b => b.text() === 'Previous')!

        // 前进两步：0 → 1 → 2，completedSteps={0,1}
        await nextButton().trigger('click')
        await nextButton().trigger('click')

        // 返回步骤 0
        await prevButton().trigger('click') // 2 → 1
        await prevButton().trigger('click') // 1 → 0

        // 修改 modelValue：应清除 0、1、2 的 completedSteps
        await wrapper.setProps({ modelValue: { name: 'Bob' } })

        // 点击 Next 完成步骤 0，currentStep → 1
        await nextButton().trigger('click')

        // 记录当前 navigation-blocked 与 step-change 事件次数
        const blockedBefore = wrapper.emitted('navigation-blocked')?.length ?? 0
        const stepChangeBefore = wrapper.emitted('step-change')?.length ?? 0

        // linear 跳到步骤 2：应阻塞（步骤 1 不在 completedSteps）
        const stepButtons = wrapper.findAll('[role="listitem"] button')
        await stepButtons[2].trigger('click')

        const blockedAfter = wrapper.emitted('navigation-blocked')?.length ?? 0
        const stepChangeAfter = wrapper.emitted('step-change')?.length ?? 0

        // navigation-blocked 次数增加，step-change 次数不变
        expect(blockedAfter).toBeGreaterThan(blockedBefore)
        expect(stepChangeAfter).toBe(stepChangeBefore)
    })

    describe('currentStep clamping', () => {
        it('does not crash when steps is empty', () => {
            const wrapper = mount(FormWizard, {
                props: { steps: [] },
                global: globalProvide,
            })
            expect(wrapper.find('[role="form"]').exists()).toBe(true)
        })

        it('clamps negative initialStep to zero', () => {
            const wrapper = mount(FormWizard, {
                props: { steps: testSteps, initialStep: -3 },
                global: globalProvide,
            })
            expect(wrapper.text()).toContain('Step 1 of 3')
        })

        it('clamps out-of-bounds initialStep to last step', () => {
            const wrapper = mount(FormWizard, {
                props: { steps: testSteps, initialStep: 99 },
                global: globalProvide,
            })
            expect(wrapper.text()).toContain('Step 3 of 3')
        })

        it('re-clamps currentStep when steps shrink dynamically', async () => {
            const wrapper = mount(FormWizard, {
                props: { steps: testSteps, initialStep: 2 },
                global: globalProvide,
            })
            expect(wrapper.text()).toContain('Step 3 of 3')

            // 动态收窄为 1 步：currentStep 应被 watch 重新钳制到 0
            await wrapper.setProps({ steps: [testSteps[0]] })
            expect(wrapper.text()).toContain('Step 1 of 1')
        })
    })

    describe('dynamic step identity', () => {
        it('keeps the active step and its errors through insertion and reorder', async () => {
            const errors = { address: 'Address is required' }
            const address = { ...testSteps[1], validator: () => ({ valid: false, errors }) }
            const steps = [testSteps[0], address, testSteps[2]]
            const wrapper = mount(FormWizard, { props: { steps }, global: globalProvide })
            const nextButton = () => wrapper.findAll('button').find(button => button.text() === 'Next')!
            const activePanel = () => wrapper.findAll<HTMLElement>('[role="tabpanel"]')
                .find(panel => panel.element.style.display !== 'none')

            await nextButton().trigger('click')
            await nextButton().trigger('click')
            expect(wrapper.emitted('validation-error')).toEqual([[1, errors]])

            const extra = { id: 'extra', title: 'Extra', optional: true }
            await wrapper.setProps({ steps: [extra, ...steps] })
            expect(activePanel()?.attributes('aria-label')).toBe(address.title)
            expect(wrapper.text()).toContain(errors.address)
            expect(nextButton().attributes('disabled')).toBeDefined()

            await wrapper.setProps({ steps: [address, extra, steps[0], steps[2]] })
            expect(activePanel()?.attributes('aria-label')).toBe(address.title)
            expect(wrapper.emitted('step-change')).toEqual([[1, 0]])

            await wrapper.setProps({ steps: [extra, steps[0], steps[2]] })
            expect(activePanel()?.attributes('aria-label')).toBe(extra.title)
            expect(wrapper.text()).not.toContain(errors.address)
            await wrapper.setProps({ steps: [extra, address, steps[0], steps[2]] })
            await nextButton().trigger('click')
            expect(activePanel()?.attributes('aria-label')).toBe(address.title)
            expect(nextButton().attributes('disabled')).toBeUndefined()
            await nextButton().trigger('click')
            expect(wrapper.emitted('validation-error')).toEqual([[1, errors], [1, errors]])
        })

        it('rechecks required predecessors after a completed step is replaced', async () => {
            const wrapper = mount(FormWizard, { props: { steps: testSteps }, global: globalProvide })
            const nextButton = () => wrapper.findAll('button').find(button => button.text() === 'Next')!
            const replacement = { id: 'replacement', title: 'Replacement' }

            await nextButton().trigger('click')
            await wrapper.setProps({ steps: [replacement, ...testSteps.slice(1)] })
            await nextButton().trigger('click')
            expect(wrapper.emitted('navigation-blocked')).toEqual([[2, 0]])
            expect(wrapper.emitted('step-change')).toEqual([[1, 0]])

            await wrapper.setProps({ steps: [{ ...replacement, optional: true }, ...testSteps.slice(1)] })
            await wrapper.findAll('[role="listitem"] button')[2].trigger('click')
            expect(wrapper.emitted('step-change')).toEqual([[1, 0], [2, 1]])
        })
    })

    describe('model update and navigation', () => {
        it.each(['accept', 'normalize-first', 'reject-first'] as const)('merges consecutive proposals against the committed model (%s)', async (policy) => {
            const Consumer = defineComponent({
                setup() {
                    const { updateValues, complete } = useFormWizard()
                    return () => h('button', {
                        onClick: () => {
                            updateValues({ b: 'B' })
                            updateValues({ c: 'C' })
                            complete()
                        },
                    }, 'Save both')
                },
            })
            const initialValues = { a: 'A' }
            const committedAfterFirst = policy === 'reject-first'
                ? initialValues
                : { ...initialValues, b: policy === 'normalize-first' ? 'Normalized' : 'B' }
            const finalValues = { ...committedAfterFirst, c: 'C' }
            const Host = defineComponent({
                setup() {
                    const modelValue = ref<Record<string, unknown>>(initialValues)
                    return () => h(FormWizard, {
                        steps: testSteps,
                        modelValue: modelValue.value,
                        'onUpdate:modelValue': (values) => {
                            if ('c' in values || policy === 'accept') modelValue.value = values
                            else if (policy === 'normalize-first') modelValue.value = { ...values, b: 'Normalized' }
                        },
                    }, { 'step-step1': () => h(Consumer) })
                },
            })
            const host = mount(Host, { global: globalProvide })
            const wizard = host.getComponent(FormWizard)
            const click = host.findAll('button').find(button => button.text() === 'Save both')!.trigger('click')
            expect(wizard.emitted('update:modelValue')?.[0]).toEqual([{ ...initialValues, b: 'B' }])
            await click
            await flushPromises()

            expect(wizard.emitted('update:modelValue')).toEqual([[{ ...initialValues, b: 'B' }], [finalValues]])
            expect(wizard.emitted('complete')).toEqual([[finalValues]])
        })

        it.each([true, false])('checks completion after a model proposal during a direct forward jump (accepted: %s)', async (accept) => {
            const readBackwardIndex = vi.fn()
            const steps = [
                { ...testSteps[0], validator: (values: Record<string, unknown>) => ({ valid: Boolean(values.name), errors: { name: 'Required' } }) },
                { ...testSteps[1], optional: true },
                testSteps[2],
            ]
            const FirstStep = defineComponent({
                setup() {
                    const { updateValues, goToStep } = useFormWizard()
                    return () => [
                        h('button', { id: 'jump', onClick: () => goToStep(2) }, 'Jump'),
                        h('button', {
                            id: 'clear-and-jump',
                            onClick: () => {
                                updateValues({ name: '' })
                                goToStep(2)
                            },
                        }, 'Clear and jump'),
                    ]
                },
            })
            const OptionalStep = defineComponent({
                setup() {
                    const { currentStep, updateValues, previousStep } = useFormWizard()
                    return () => h('button', {
                        id: 'save-and-back',
                        onClick: () => {
                            updateValues({ optional: 'Saved' })
                            previousStep()
                            readBackwardIndex(currentStep.value)
                        },
                    }, 'Save and back')
                },
            })
            const Host = defineComponent({
                setup() {
                    const modelValue = ref<Record<string, unknown>>({ name: 'A' })
                    return () => h(FormWizard, {
                        steps,
                        modelValue: modelValue.value,
                        'onUpdate:modelValue': (values) => {
                            if (accept || values.name) modelValue.value = values
                        },
                    }, { 'step-step1': () => h(FirstStep), 'step-step2': () => h(OptionalStep) })
                },
            })
            const host = mount(Host, { global: globalProvide })
            const wizard = host.getComponent(FormWizard)
            const navButton = (text: string) => host.findAll('button').find(button => button.text() === text)!
            await navButton('Next').trigger('click')
            await host.get('#save-and-back').trigger('click')
            await flushPromises()
            expect(readBackwardIndex).toHaveBeenCalledExactlyOnceWith(0)

            const jump = host.get('#jump').trigger('click')
            expect(wizard.emitted('step-change')?.at(-1)).toEqual([2, 0])
            await jump
            await navButton('Previous').trigger('click')
            await navButton('Previous').trigger('click')
            await host.get('#clear-and-jump').trigger('click')
            await flushPromises()

            expect(wizard.emitted('navigation-blocked')).toEqual(accept ? [[2, 0]] : undefined)
            expect(wizard.emitted('step-change')?.at(-1)).toEqual(accept ? [0, 1] : [2, 0])
        })

        it.each([
            { accept: true, action: 'nextStep' },
            { accept: false, action: 'nextStep' },
            { accept: true, action: 'complete' },
            { accept: false, action: 'complete' },
        ] as const)('$action validates the actual model value after an update (accepted: $accept)', async ({ accept, action }) => {
            const errors = { name: 'Name is required' }
            const validator = vi.fn((values: Record<string, unknown>) => ({ valid: Boolean(values.name), errors }))
            const steps = [{ ...testSteps[0], validator }, testSteps[1]]
            const confirmedValues = { name: 'Accepted' }
            const Consumer = defineComponent({
                setup() {
                    const wizard = useFormWizard()
                    return () => h('button', {
                        onClick: () => {
                            wizard.updateValues({ name: 'Proposed' })
                            wizard[action]()
                        },
                    }, 'Save')
                },
            })
            const Host = defineComponent({
                setup() {
                    const modelValue = ref<Record<string, unknown>>({})
                    return () => h(FormWizard, {
                        steps,
                        modelValue: modelValue.value,
                        'onUpdate:modelValue': () => {
                            if (accept) modelValue.value = confirmedValues
                        },
                    }, { 'step-step1': () => h(Consumer) })
                },
            })
            const host = mount(Host, { global: globalProvide })
            const wizard = host.getComponent(FormWizard)

            await host.findAll('button').find(button => button.text() === 'Save')!.trigger('click')
            await flushPromises()

            expect(wizard.emitted('update:modelValue')).toEqual([[{ name: 'Proposed' }]])
            expect(validator).toHaveBeenCalledExactlyOnceWith(accept ? confirmedValues : {})
            expect(wizard.emitted('step-change')).toEqual(accept && action === 'nextStep' ? [[1, 0]] : undefined)
            expect(wizard.emitted('complete')).toEqual(accept && action === 'complete' ? [[confirmedValues]] : undefined)
            expect(wizard.emitted('validation-error')).toEqual(accept ? undefined : [[0, errors]])
        })

        it('discards queued advancement when its originating step is replaced', async () => {
            const validator = vi.fn(() => ({ valid: true, errors: {} }))
            const Consumer = defineComponent({
                setup() {
                    const { updateValues, nextStep } = useFormWizard()
                    return () => h('button', {
                        onClick: () => {
                            updateValues({ name: 'Proposed' })
                            nextStep()
                        },
                    }, 'Save and next')
                },
            })
            const Host = defineComponent({
                setup() {
                    const steps = ref(testSteps)
                    return () => h(FormWizard, {
                        steps: steps.value,
                        'onUpdate:modelValue': () => {
                            steps.value = [{ id: 'replacement', title: 'Replacement', validator }, ...testSteps.slice(1)]
                        },
                    }, { 'step-step1': () => h(Consumer) })
                },
            })
            const host = mount(Host, { global: globalProvide })

            await host.findAll('button').find(button => button.text() === 'Save and next')!.trigger('click')
            await flushPromises()

            expect(host.text()).toContain('Step 1 of 3')
            expect(validator).not.toHaveBeenCalled()
            expect(host.getComponent(FormWizard).emitted('step-change')).toBeUndefined()
        })
    })

    describe('complete 全量校验与错误保留', () => {
        it('complete 校验失败时跳转到第一个失败步骤', async () => {
            const steps: FormStep[] = [
                { id: 's1', title: 'S1', validator: () => ({ valid: false, errors: { n: 'Err' } }) },
                { id: 's2', title: 'S2' },
            ]
            const wrapper = mount(FormWizard, {
                props: { steps, validateOnNext: true, linear: false },
                global: globalProvide,
            })

            // 经指示器直接跳到最后一步（linear=false 不检查 completedSteps）
            const stepButtons = wrapper.findAll('[role="listitem"] button')
            await stepButtons[1].trigger('click')
            const completeButton = wrapper.findAll('button').find(b => b.text() === 'Complete')
            await completeButton!.trigger('click')

            // 步骤 0 校验失败 → 不 emit complete，跳回步骤 0
            expect(wrapper.emitted('complete')).toBeFalsy()
            expect(wrapper.emitted('step-change')!.slice(-1)[0]).toEqual([0, 1])
        })

        it('返回再进入校验失败的步骤时错误保留、Next 保持禁用', async () => {
            const steps: FormStep[] = [
                { id: 's1', title: 'S1', validator: () => ({ valid: true, errors: {} }) },
                {
                    id: 's2',
                    title: 'S2',
                    validator: () => ({ valid: false, errors: { n: 'Req' } }),
                },
                { id: 's3', title: 'S3' },
            ]
            const wrapper = mount(FormWizard, {
                props: { steps, validateOnNext: true, linear: true, modelValue: {} },
                global: globalProvide,
            })

            // 前进到步骤 1（index 1）：离开步骤 0 时校验通过
            let nextButton = wrapper.findAll('button').find(b => b.text() === 'Next')!
            await nextButton.trigger('click')
            // 尝试离开步骤 1：校验失败 → 停留，错误记录，Next 禁用
            nextButton = wrapper.findAll('button').find(b => b.text() === 'Next')!
            await nextButton.trigger('click')
            expect(wrapper.text()).toContain('Req')
            expect((nextButton.element as HTMLButtonElement).disabled).toBe(true)

            // 返回步骤 0 再重新进入步骤 1：错误保留（不随进入步骤被清除），Next 仍禁用
            const prevButton = wrapper.findAll('button').find(b => b.text() === 'Previous')!
            await prevButton.trigger('click')
            nextButton = wrapper.findAll('button').find(b => b.text() === 'Next')!
            await nextButton.trigger('click')
            nextButton = wrapper.findAll('button').find(b => b.text() === 'Next')!
            await nextButton.trigger('click')
            expect(wrapper.text()).toContain('Req')
            expect((nextButton.element as HTMLButtonElement).disabled).toBe(true)
        })

        it('updateValues 浅合并而非覆盖既有字段', async () => {
            const Consumer = {
                template: '<button @click="merge">merge</button>',
                setup() {
                    const { updateValues } = useFormWizard()
                    return { merge: () => updateValues({ b: 2 }) }
                },
            }
            const wrapper = mount(FormWizard, {
                props: { steps: testSteps, modelValue: { a: 1 }, validateOnNext: false },
                global: globalProvide,
                slots: {
                    'step-step1': () => h(Consumer),
                },
            })

            await wrapper.findAll('button').find(b => b.text() === 'merge')!.trigger('click')
            const emitted = wrapper.emitted('update:modelValue')!
            expect(emitted[0][0]).toEqual({ a: 1, b: 2 })
        })
    })
})
