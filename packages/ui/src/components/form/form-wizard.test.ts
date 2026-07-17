import { mount } from '@vue/test-utils'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import FormWizard from './FormWizard.vue'
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
        // 区分修复前后行为的关键场景：
        // 1. 完成步骤 0、1（completedSteps={0,1}）
        // 2. 返回步骤 0，修改 modelValue
        //    - 修复版：清除 0 及下游 1、2 → completedSteps={}
        //    - 未修复：仅清除 0 → completedSteps={1}
        // 3. 点击 Next 完成步骤 0（completedSteps={0}，currentStep=1）
        // 4. linear 跳到步骤 2：
        //    - 修复版：i=1 不在 completedSteps → navigation-blocked
        //    - 未修复：i=1 在 completedSteps → 通过 step-change
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

        // 修改 modelValue：修复版应清除 0、1、2 的 completedSteps
        await wrapper.setProps({ modelValue: { name: 'Bob' } })

        // 点击 Next 完成步骤 0，currentStep → 1
        await nextButton().trigger('click')

        // 记录当前 navigation-blocked 与 step-change 事件次数
        const blockedBefore = wrapper.emitted('navigation-blocked')?.length ?? 0
        const stepChangeBefore = wrapper.emitted('step-change')?.length ?? 0

        // linear 跳到步骤 2：修复版应阻塞（步骤 1 不在 completedSteps）
        const stepButtons = wrapper.findAll('[role="listitem"] button')
        await stepButtons[2].trigger('click')

        const blockedAfter = wrapper.emitted('navigation-blocked')?.length ?? 0
        const stepChangeAfter = wrapper.emitted('step-change')?.length ?? 0

        // 修复版：navigation-blocked 次数增加，step-change 次数不变
        expect(blockedAfter).toBeGreaterThan(blockedBefore)
        expect(stepChangeAfter).toBe(stepChangeBefore)
    })
})
