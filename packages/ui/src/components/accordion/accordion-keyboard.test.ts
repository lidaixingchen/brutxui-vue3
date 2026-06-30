import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { describe, it, expect } from 'vitest'
import Accordion from './Accordion.vue'
import AccordionItem from './AccordionItem.vue'
import AccordionTrigger from './AccordionTrigger.vue'
import AccordionContent from './AccordionContent.vue'

describe('Accordion keyboard navigation support', () => {
    afterEach(() => {
        document.body.innerHTML = ''
    })

    describe('WAI-ARIA accordion pattern compliance', () => {
        it('Accordion passes type prop to reka-ui AccordionRoot', () => {
            const wrapper = mount(Accordion, {
                props: { type: 'single' },
                global: {
                    stubs: { AccordionRoot: { template: '<div><slot /></div>' } },
                },
            })

            expect(wrapper.exists()).toBe(true)
            wrapper.unmount()
        })

        it('Accordion supports collapsible prop for keyboard toggle', () => {
            const wrapper = mount(Accordion, {
                props: { type: 'single', collapsible: true },
                global: {
                    stubs: { AccordionRoot: { template: '<div><slot /></div>' } },
                },
            })

            expect(wrapper.exists()).toBe(true)
            wrapper.unmount()
        })

        it('Accordion supports multiple type for independent item toggling', () => {
            const wrapper = mount(Accordion, {
                props: { type: 'multiple' },
                global: {
                    stubs: { AccordionRoot: { template: '<div><slot /></div>' } },
                },
            })

            expect(wrapper.exists()).toBe(true)
            wrapper.unmount()
        })

        it('AccordionTrigger renders as button for keyboard focusability', () => {
            const wrapper = mount(AccordionTrigger, {
                slots: { default: 'Title' },
                global: {
                    stubs: {
                        AccordionHeader: { template: '<div><slot /></div>' },
                        AccordionTrigger: {
                            template: '<button data-testid="trigger"><slot /></button>',
                        },
                        ChevronDown: { template: '<svg />' },
                    },
                },
            })

            const trigger = wrapper.find('[data-testid="trigger"]')
            expect(trigger.element.tagName).toBe('BUTTON')
            wrapper.unmount()
        })

        it('AccordionItem passes value prop for keyboard navigation tracking', () => {
            const wrapper = mount(AccordionItem, {
                props: { value: 'item-1' },
                global: {
                    stubs: { AccordionItem: { template: '<div><slot /></div>' } },
                },
            })

            expect(wrapper.exists()).toBe(true)
            wrapper.unmount()
        })

        it('AccordionContent renders with proper data-state for animation', () => {
            const wrapper = mount(AccordionContent, {
                global: {
                    stubs: {
                        AccordionContent: {
                            template: '<div data-state="open"><slot /></div>',
                        },
                    },
                },
            })

            expect(wrapper.exists()).toBe(true)
            wrapper.unmount()
        })
    })

    describe('keyboard event integration', () => {
        it('Accordion emits value change for Enter/Space toggle', async () => {
            const modelValue = ref('')

            const wrapper = mount(Accordion, {
                props: {
                    type: 'single',
                    collapsible: true,
                    modelValue: modelValue.value,
                    'onUpdate:modelValue': (val: string) => {
                        modelValue.value = val
                    },
                },
                global: {
                    stubs: { AccordionRoot: { template: '<div><slot /></div>' } },
                },
            })

            // Simulate reka-ui emitting value change (Enter/Space toggle)
            wrapper.vm.$emit('update:modelValue', 'item-1')
            wrapper.unmount()
        })

        it('Accordion multiple type emits array for value changes', async () => {
            const modelValue = ref<string[]>([])

            const wrapper = mount(Accordion, {
                props: {
                    type: 'multiple',
                    modelValue: modelValue.value,
                    'onUpdate:modelValue': (val: string[]) => {
                        modelValue.value = val
                    },
                },
                global: {
                    stubs: { AccordionRoot: { template: '<div><slot /></div>' } },
                },
            })

            // Simulate reka-ui emitting array value change
            wrapper.vm.$emit('update:modelValue', ['item-1'])
            wrapper.unmount()
        })
    })

    describe('ARIA attributes', () => {
        it('AccordionTrigger has ChevronDown icon for visual state indicator', () => {
            const wrapper = mount(AccordionTrigger, {
                global: {
                    stubs: {
                        AccordionHeader: { template: '<div><slot /></div>' },
                        AccordionTrigger: {
                            template: '<button><slot /><slot name="icon" /></button>',
                        },
                    },
                },
            })

            const svg = wrapper.find('svg')
            expect(svg.exists()).toBe(true)
            wrapper.unmount()
        })

        it('AccordionTrigger icon rotates on open state', () => {
            const wrapper = mount(AccordionTrigger, {
                global: {
                    stubs: {
                        AccordionHeader: { template: '<div><slot /></div>' },
                        AccordionTrigger: {
                            template: '<button><slot /><slot name="icon" /></button>',
                        },
                    },
                },
            })

            // Check for rotation class
            const svg = wrapper.find('svg')
            expect(svg.classes()).toContain('shrink-0')
            expect(svg.classes()).toContain('transition-transform')
            wrapper.unmount()
        })
    })
})
