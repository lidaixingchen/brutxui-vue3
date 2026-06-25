import { mount } from '@vue/test-utils'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import FormWizard from './FormWizard.vue'
import type { FormStep } from './FormWizard.vue'

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
        expect(wrapper.emitted('stepChange')).toBeTruthy()
        expect(wrapper.emitted('stepChange')![0]).toEqual([1, 0])
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
        expect(wrapper.emitted('validationError')).toBeTruthy()
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
        expect(wrapper.emitted('stepChange')).toBeTruthy()
    })
})
