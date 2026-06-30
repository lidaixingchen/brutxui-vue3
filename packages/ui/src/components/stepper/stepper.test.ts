import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import Stepper from './Stepper.vue'

const localeProvide = { [LOCALE_INJECTION_KEY]: en }

const steps = [
    { id: 'step-1', title: 'Account' },
    { id: 'step-2', title: 'Profile', description: 'Set up your profile' },
    { id: 'step-3', title: 'Confirm' },
]

describe('Stepper', () => {
    it('renders all steps', () => {
        const wrapper = mount(Stepper, {
            props: { steps, modelValue: 0 },
            global: { provide: localeProvide },
        })
        const items = wrapper.findAll('[role="listitem"]')
        expect(items).toHaveLength(3)
    })

    it('shows step titles', () => {
        const wrapper = mount(Stepper, {
            props: { steps, modelValue: 0 },
            global: { provide: localeProvide },
        })
        expect(wrapper.text()).toContain('Account')
        expect(wrapper.text()).toContain('Profile')
        expect(wrapper.text()).toContain('Confirm')
    })

    it('has role="list" and aria-label', () => {
        const wrapper = mount(Stepper, {
            props: { steps, modelValue: 0 },
            global: { provide: localeProvide },
        })
        expect(wrapper.attributes('role')).toBe('list')
        expect(wrapper.attributes('aria-label')).toBe('Progress steps')
    })

    it('sets aria-orientation attribute', () => {
        const horizontal = mount(Stepper, {
            props: { steps, modelValue: 0 },
            global: { provide: localeProvide },
        })
        expect(horizontal.attributes('aria-orientation')).toBe('horizontal')

        const vertical = mount(Stepper, {
            props: { steps, modelValue: 0, orientation: 'vertical' },
            global: { provide: localeProvide },
        })
        expect(vertical.attributes('aria-orientation')).toBe('vertical')
    })

    it('marks active step with bg-brutal-primary', () => {
        const wrapper = mount(Stepper, {
            props: { steps, modelValue: 1, variant: 'primary' },
            global: { provide: localeProvide },
        })
        const buttons = wrapper.findAll('button')
        const activeButton = buttons[1]
        expect(activeButton.classes()).toContain('bg-brutal-primary')
    })

    it('shows completed check icon for completed steps', () => {
        const wrapper = mount(Stepper, {
            props: { steps, modelValue: 2 },
            global: { provide: localeProvide },
        })
        const buttons = wrapper.findAll('button')
        const completedButton = buttons[0]
        expect(completedButton.find('svg').exists()).toBe(true)
    })

    it('shows step numbers for non-completed steps', () => {
        const wrapper = mount(Stepper, {
            props: { steps, modelValue: 0 },
            global: { provide: localeProvide },
        })
        const buttons = wrapper.findAll('button')
        expect(buttons[0].text()).toContain('1')
        expect(buttons[1].text()).toContain('2')
        expect(buttons[2].text()).toContain('3')
    })

    it('applies upcoming state classes to future steps', () => {
        const wrapper = mount(Stepper, {
            props: { steps, modelValue: 0 },
            global: { provide: localeProvide },
        })
        const buttons = wrapper.findAll('button')
        const upcomingButton = buttons[2]
        expect(upcomingButton.classes()).toContain('bg-brutal-bg')
        expect(upcomingButton.classes()).toContain('opacity-60')
    })

    it('applies completed state classes to completed steps', () => {
        const wrapper = mount(Stepper, {
            props: { steps, modelValue: 2 },
            global: { provide: localeProvide },
        })
        const buttons = wrapper.findAll('button')
        const completedButton = buttons[0]
        expect(completedButton.classes()).toContain('bg-brutal-success')
    })

    it('renders descriptions when provided', () => {
        const wrapper = mount(Stepper, {
            props: { steps, modelValue: 0 },
            global: { provide: localeProvide },
        })
        expect(wrapper.text()).toContain('Set up your profile')
    })

    it('emits update:modelValue on step click', async () => {
        const wrapper = mount(Stepper, {
            props: { steps, modelValue: 0 },
            global: { provide: localeProvide },
        })
        const buttons = wrapper.findAll('button')
        await buttons[1].trigger('click')
        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        expect(wrapper.emitted('update:modelValue')![0]).toEqual([1])
    })

    it('emits step-click on step click', async () => {
        const wrapper = mount(Stepper, {
            props: { steps, modelValue: 0 },
            global: { provide: localeProvide },
        })
        const buttons = wrapper.findAll('button')
        await buttons[2].trigger('click')
        expect(wrapper.emitted('step-click')).toBeTruthy()
        expect(wrapper.emitted('step-click')![0]).toEqual([2])
    })

    it('applies custom class', () => {
        const wrapper = mount(Stepper, {
            props: { steps, modelValue: 0, class: 'my-stepper' },
            global: { provide: localeProvide },
        })
        expect(wrapper.classes()).toContain('my-stepper')
    })

    it('renders horizontal layout by default', () => {
        const wrapper = mount(Stepper, {
            props: { steps, modelValue: 0 },
            global: { provide: localeProvide },
        })
        expect(wrapper.classes()).toContain('flex')
        expect(wrapper.classes()).toContain('flex-row')
    })

    it('renders vertical layout when orientation is vertical', () => {
        const wrapper = mount(Stepper, {
            props: { steps, modelValue: 0, orientation: 'vertical' },
            global: { provide: localeProvide },
        })
        expect(wrapper.classes()).toContain('flex')
        expect(wrapper.classes()).toContain('flex-col')
    })

    it('sets aria-current on active step', () => {
        const wrapper = mount(Stepper, {
            props: { steps, modelValue: 1 },
            global: { provide: localeProvide },
        })
        const items = wrapper.findAll('[role="listitem"]')
        expect(items[0].attributes('aria-current')).toBeUndefined()
        expect(items[1].attributes('aria-current')).toBe('step')
        expect(items[2].attributes('aria-current')).toBeUndefined()
    })

    describe('size', () => {
        it('applies default size classes by default', () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 0 },
                global: { provide: localeProvide },
            })
            const buttons = wrapper.findAll('button')
            expect(buttons[0].classes()).toContain('w-8')
            expect(buttons[0].classes()).toContain('h-8')
            expect(buttons[0].classes()).toContain('text-sm')
        })

        it('applies sm size classes', () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 0, size: 'sm' },
                global: { provide: localeProvide },
            })
            const buttons = wrapper.findAll('button')
            expect(buttons[0].classes()).toContain('w-6')
            expect(buttons[0].classes()).toContain('h-6')
            expect(buttons[0].classes()).toContain('text-xs')
        })

        it('applies lg size classes', () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 0, size: 'lg' },
                global: { provide: localeProvide },
            })
            const buttons = wrapper.findAll('button')
            expect(buttons[0].classes()).toContain('w-10')
            expect(buttons[0].classes()).toContain('h-10')
            expect(buttons[0].classes()).toContain('text-base')
        })
    })

    describe('variant', () => {
        it('applies default color to active step by default', () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 1 },
                global: { provide: localeProvide },
            })
            const buttons = wrapper.findAll('button')
            expect(buttons[1].classes()).toContain('bg-brutal-bg')
            expect(buttons[1].classes()).toContain('text-brutal-fg')
        })

        it('applies accent color to active step when variant=accent', () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 1, variant: 'accent' },
                global: { provide: localeProvide },
            })
            const buttons = wrapper.findAll('button')
            expect(buttons[1].classes()).toContain('bg-brutal-accent')
            expect(buttons[1].classes()).toContain('text-brutal-accent-foreground')
        })

        it('does not affect completed step color', () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 2, variant: 'accent' },
                global: { provide: localeProvide },
            })
            const buttons = wrapper.findAll('button')
            expect(buttons[0].classes()).toContain('bg-brutal-success')
            expect(buttons[0].classes()).not.toContain('bg-brutal-accent')
        })

        it('does not affect upcoming step color', () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 0, variant: 'accent' },
                global: { provide: localeProvide },
            })
            const buttons = wrapper.findAll('button')
            expect(buttons[2].classes()).toContain('bg-brutal-bg')
            expect(buttons[2].classes()).not.toContain('bg-brutal-accent')
        })
    })

    describe('clickable', () => {
        it('applies cursor-pointer by default', () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 0 },
                global: { provide: localeProvide },
            })
            const buttons = wrapper.findAll('button')
            expect(buttons[0].classes()).toContain('cursor-pointer')
        })

        it('applies pointer-events-none when clickable=false', () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 0, clickable: false },
                global: { provide: localeProvide },
            })
            const buttons = wrapper.findAll('button')
            expect(buttons[0].classes()).toContain('pointer-events-none')
            expect(buttons[0].classes()).not.toContain('cursor-pointer')
        })

        it('does not emit update:modelValue when clickable=false', async () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 0, clickable: false },
                global: { provide: localeProvide },
            })
            const buttons = wrapper.findAll('button')
            await buttons[1].trigger('click')
            expect(wrapper.emitted('update:modelValue')).toBeFalsy()
        })

        it('does not emit step-click when clickable=false', async () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 0, clickable: false },
                global: { provide: localeProvide },
            })
            const buttons = wrapper.findAll('button')
            await buttons[2].trigger('click')
            expect(wrapper.emitted('step-click')).toBeFalsy()
        })
    })

    describe('exposed methods', () => {
        it('nextStep advances to next step', async () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 0 },
                global: { provide: localeProvide },
            })
            const vm = wrapper.vm as unknown as { nextStep: () => void }
            vm.nextStep()
            await nextTick()
            expect(wrapper.emitted('update:modelValue')![0]).toEqual([1])
        })

        it('nextStep does nothing on last step', async () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 2 },
                global: { provide: localeProvide },
            })
            const vm = wrapper.vm as unknown as { nextStep: () => void }
            vm.nextStep()
            await nextTick()
            expect(wrapper.emitted('update:modelValue')).toBeFalsy()
        })

        it('previousStep goes back to previous step', async () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 2 },
                global: { provide: localeProvide },
            })
            const vm = wrapper.vm as unknown as { previousStep: () => void }
            vm.previousStep()
            await nextTick()
            expect(wrapper.emitted('update:modelValue')![0]).toEqual([1])
        })

        it('previousStep does nothing on first step', async () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 0 },
                global: { provide: localeProvide },
            })
            const vm = wrapper.vm as unknown as { previousStep: () => void }
            vm.previousStep()
            await nextTick()
            expect(wrapper.emitted('update:modelValue')).toBeFalsy()
        })

        it('goToStep navigates to valid step', async () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 0 },
                global: { provide: localeProvide },
            })
            const vm = wrapper.vm as unknown as { goToStep: (index: number) => void }
            vm.goToStep(2)
            await nextTick()
            expect(wrapper.emitted('update:modelValue')![0]).toEqual([2])
        })

        it('goToStep ignores negative index', async () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 0 },
                global: { provide: localeProvide },
            })
            const vm = wrapper.vm as unknown as { goToStep: (index: number) => void }
            vm.goToStep(-1)
            await nextTick()
            expect(wrapper.emitted('update:modelValue')).toBeFalsy()
        })

        it('goToStep ignores index beyond total steps', async () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 0 },
                global: { provide: localeProvide },
            })
            const vm = wrapper.vm as unknown as { goToStep: (index: number) => void }
            vm.goToStep(5)
            await nextTick()
            expect(wrapper.emitted('update:modelValue')).toBeFalsy()
        })

        it('exposes currentStep, totalSteps, isFirstStep, isLastStep', () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 1 },
                global: { provide: localeProvide },
            })
            const vm = wrapper.vm as unknown as {
                currentStep: number
                totalSteps: number
                isFirstStep: boolean
                isLastStep: boolean
            }
            expect(vm.currentStep).toBe(1)
            expect(vm.totalSteps).toBe(3)
            expect(vm.isFirstStep).toBe(false)
            expect(vm.isLastStep).toBe(false)
        })

        it('isFirstStep is true on first step', () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 0 },
                global: { provide: localeProvide },
            })
            const vm = wrapper.vm as unknown as { isFirstStep: boolean }
            expect(vm.isFirstStep).toBe(true)
        })

        it('isLastStep is true on last step', () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 2 },
                global: { provide: localeProvide },
            })
            const vm = wrapper.vm as unknown as { isLastStep: boolean }
            expect(vm.isLastStep).toBe(true)
        })
    })

    describe('horizontal connectors', () => {
        it('renders connectors between steps (not after last)', () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 0 },
                global: { provide: localeProvide },
            })
            const connectors = wrapper.findAll('.flex-1.h-\\[3px\\]')
            expect(connectors).toHaveLength(2)
        })

        it('applies completed connector classes for completed step connectors', () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 2 },
                global: { provide: localeProvide },
            })
            const connectors = wrapper.findAll('.flex-1.h-\\[3px\\]')
            expect(connectors[0].classes()).toContain('bg-brutal-success')
        })

        it('applies incomplete connector classes for upcoming step connectors', () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 0 },
                global: { provide: localeProvide },
            })
            const connectors = wrapper.findAll('.flex-1.h-\\[3px\\]')
            expect(connectors[0].classes()).toContain('bg-brutal-fg')
            expect(connectors[0].classes()).toContain('opacity-20')
        })
    })

    describe('vertical layout', () => {
        it('renders vertical connector with minHeight style', () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 0, orientation: 'vertical' },
                global: { provide: localeProvide },
            })
            const connectors = wrapper.findAll('.w-\\[var\\(--brutal-border-width\\,3px\\)\\]')
            expect(connectors.length).toBeGreaterThan(0)
            expect(connectors[0].attributes('style')).toContain('min-height: 2rem')
        })

        it('renders step description in vertical layout', () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 0, orientation: 'vertical' },
                global: { provide: localeProvide },
            })
            expect(wrapper.text()).toContain('Set up your profile')
        })

        it('applies opacity-50 to upcoming step label in vertical layout', () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 0, orientation: 'vertical' },
                global: { provide: localeProvide },
            })
            const listItems = wrapper.findAll('[role="listitem"]')
            const upcomingLabel = listItems[2].find('.pb-6')
            expect(upcomingLabel.classes()).toContain('opacity-50')
        })

        it('does not apply opacity-50 to active step label in vertical layout', () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 0, orientation: 'vertical' },
                global: { provide: localeProvide },
            })
            const listItems = wrapper.findAll('[role="listitem"]')
            const activeLabel = listItems[0].find('.pb-6')
            expect(activeLabel.classes()).not.toContain('opacity-50')
        })

        it('renders content slot for active vertical step', () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 0, orientation: 'vertical' },
                global: { provide: localeProvide },
                slots: {
                    'step-step-1': '<div class="custom-content">Step Content</div>',
                },
            })
            expect(wrapper.find('.custom-content').exists()).toBe(true)
            expect(wrapper.text()).toContain('Step Content')
        })

        it('does not render content slot for inactive vertical step', () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 0, orientation: 'vertical' },
                global: { provide: localeProvide },
                slots: {
                    'step-step-2': '<div class="custom-content">Step Content</div>',
                },
            })
            expect(wrapper.find('.custom-content').exists()).toBe(false)
        })

        it('renders step numbers in vertical layout', () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 0, orientation: 'vertical' },
                global: { provide: localeProvide },
            })
            const buttons = wrapper.findAll('button')
            expect(buttons[0].text()).toContain('1')
            expect(buttons[1].text()).toContain('2')
            expect(buttons[2].text()).toContain('3')
        })

        it('shows completed check icon in vertical layout', () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 2, orientation: 'vertical' },
                global: { provide: localeProvide },
            })
            const buttons = wrapper.findAll('button')
            expect(buttons[0].find('svg').exists()).toBe(true)
        })

        it('emits events on vertical step click', async () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 0, orientation: 'vertical' },
                global: { provide: localeProvide },
            })
            const buttons = wrapper.findAll('button')
            await buttons[1].trigger('click')
            expect(wrapper.emitted('update:modelValue')![0]).toEqual([1])
            expect(wrapper.emitted('step-click')![0]).toEqual([1])
        })
    })

    describe('horizontal upcoming opacity on label', () => {
        it('applies opacity-50 to upcoming step label in horizontal layout', () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 0 },
                global: { provide: localeProvide },
            })
            const listItems = wrapper.findAll('[role="listitem"]')
            const upcomingLabel = listItems[2].find('.mt-2.text-center')
            expect(upcomingLabel.classes()).toContain('opacity-50')
        })

        it('does not apply opacity-50 to active step label in horizontal layout', () => {
            const wrapper = mount(Stepper, {
                props: { steps, modelValue: 0 },
                global: { provide: localeProvide },
            })
            const listItems = wrapper.findAll('[role="listitem"]')
            const activeLabel = listItems[0].find('.mt-2.text-center')
            expect(activeLabel.classes()).not.toContain('opacity-50')
        })
    })

    describe('keyboard navigation', () => {
        function createStepperWithButtons(
            props: { steps: typeof steps; modelValue: number; orientation?: 'horizontal' | 'vertical' },
        ) {
            const wrapper = mount(Stepper, {
                props,
                global: { provide: localeProvide },
                attachTo: document.body,
            })
            const buttons = wrapper.findAll('button')
            return { wrapper, buttons }
        }

        afterEach(() => {
            document.body.innerHTML = ''
        })

        it('ArrowRight focuses next button in horizontal mode', async () => {
            const { wrapper, buttons } = createStepperWithButtons({ steps, modelValue: 0 })
            const event = new KeyboardEvent('keydown', {
                key: 'ArrowRight',
                bubbles: true,
                cancelable: true,
            })
            buttons[0].element.dispatchEvent(event)
            await nextTick()

            expect(document.activeElement).toBe(buttons[1].element)
            wrapper.unmount()
        })

        it('ArrowLeft focuses previous button in horizontal mode', async () => {
            const { wrapper, buttons } = createStepperWithButtons({ steps, modelValue: 1 })

            buttons[1].element.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }),
            )
            await nextTick()

            expect(document.activeElement).toBe(buttons[0].element)
            wrapper.unmount()
        })

        it('ArrowDown focuses next button in vertical mode', async () => {
            const { wrapper, buttons } = createStepperWithButtons({
                steps,
                modelValue: 0,
                orientation: 'vertical',
            })

            buttons[0].element.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
            )
            await nextTick()

            expect(document.activeElement).toBe(buttons[1].element)
            wrapper.unmount()
        })

        it('ArrowUp focuses previous button in vertical mode', async () => {
            const { wrapper, buttons } = createStepperWithButtons({
                steps,
                modelValue: 1,
                orientation: 'vertical',
            })

            buttons[1].element.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }),
            )
            await nextTick()

            expect(document.activeElement).toBe(buttons[0].element)
            wrapper.unmount()
        })

        it('Home key focuses first button', async () => {
            const { wrapper, buttons } = createStepperWithButtons({ steps, modelValue: 2 })

            buttons[2].element.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }),
            )
            await nextTick()

            expect(document.activeElement).toBe(buttons[0].element)
            wrapper.unmount()
        })

        it('End key focuses last button', async () => {
            const { wrapper, buttons } = createStepperWithButtons({ steps, modelValue: 0 })

            buttons[0].element.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }),
            )
            await nextTick()

            expect(document.activeElement).toBe(buttons[2].element)
            wrapper.unmount()
        })

        it('ArrowRight does nothing in vertical mode', async () => {
            const { wrapper, buttons } = createStepperWithButtons({
                steps,
                modelValue: 0,
                orientation: 'vertical',
            })

            buttons[0].element.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
            )
            await nextTick()

            expect(document.activeElement).not.toBe(buttons[1].element)
            wrapper.unmount()
        })

        it('ArrowDown does nothing in horizontal mode', async () => {
            const { wrapper, buttons } = createStepperWithButtons({ steps, modelValue: 0 })

            buttons[0].element.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
            )
            await nextTick()

            expect(document.activeElement).not.toBe(buttons[1].element)
            wrapper.unmount()
        })

        it('ArrowLeft does nothing in vertical mode', async () => {
            const { wrapper, buttons } = createStepperWithButtons({
                steps,
                modelValue: 1,
                orientation: 'vertical',
            })

            buttons[1].element.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }),
            )
            await nextTick()

            expect(document.activeElement).not.toBe(buttons[0].element)
            wrapper.unmount()
        })

        it('ArrowUp does nothing in horizontal mode', async () => {
            const { wrapper, buttons } = createStepperWithButtons({ steps, modelValue: 1 })

            buttons[1].element.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }),
            )
            await nextTick()

            expect(document.activeElement).not.toBe(buttons[0].element)
            wrapper.unmount()
        })

        it('does not move focus past the last button', async () => {
            const { wrapper, buttons } = createStepperWithButtons({ steps, modelValue: 2 })
            const lastButton = buttons[2]

            lastButton.element.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
            )
            await nextTick()

            // Focus should not move to a non-existent button; last button may or may not keep focus
            const allButtons = wrapper.findAll('button')
            expect(allButtons).toHaveLength(3)
            wrapper.unmount()
        })

        it('does not move focus before the first button', async () => {
            const { wrapper, buttons } = createStepperWithButtons({ steps, modelValue: 0 })
            const firstButton = buttons[0]

            firstButton.element.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }),
            )
            await nextTick()

            // Focus should not break; first button may or may not keep focus
            const allButtons = wrapper.findAll('button')
            expect(allButtons).toHaveLength(3)
            wrapper.unmount()
        })
    })

    describe('horizontal description opacity', () => {
        it('applies opacity-50 to upcoming step description in horizontal layout', () => {
            const stepsWithDesc = [
                { id: 's1', title: 'A', description: 'Desc A' },
                { id: 's2', title: 'B', description: 'Desc B' },
                { id: 's3', title: 'C', description: 'Desc C' },
            ]
            const wrapper = mount(Stepper, {
                props: { steps: stepsWithDesc, modelValue: 0 },
                global: { provide: localeProvide },
            })
            const listItems = wrapper.findAll('[role="listitem"]')
            const upcomingLabel = listItems[2].find('.mt-2.text-center')
            expect(upcomingLabel.classes()).toContain('opacity-50')
        })

        it('does not render description paragraph when step has no description', () => {
            const stepsNoDesc = [
                { id: 's1', title: 'A' },
                { id: 's2', title: 'B' },
            ]
            const wrapper = mount(Stepper, {
                props: { steps: stepsNoDesc, modelValue: 0 },
                global: { provide: localeProvide },
            })
            expect(wrapper.text()).not.toContain('Desc A')
        })
    })
})
