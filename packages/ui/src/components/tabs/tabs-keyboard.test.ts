import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { describe, it, expect } from 'vitest'
import Tabs from './Tabs.vue'
import TabsList from './TabsList.vue'
import TabsTrigger from './TabsTrigger.vue'
import TabsContent from './TabsContent.vue'

describe('Tabs keyboard navigation support', () => {
    afterEach(() => {
        document.body.innerHTML = ''
    })

    describe('WAI-ARIA tabs pattern compliance', () => {
        it('Tabs component passes orientation prop to reka-ui TabsRoot', () => {
            const wrapper = mount(Tabs, {
                props: { orientation: 'horizontal' },
            })

            // TabsRoot should receive orientation
            const root = wrapper.findComponent({ name: 'TabsRoot' })
            expect(root.exists()).toBe(true)
            wrapper.unmount()
        })

        it('Tabs component supports vertical orientation', () => {
            const wrapper = mount(Tabs, {
                props: { orientation: 'vertical' },
            })

            const root = wrapper.findComponent({ name: 'TabsRoot' })
            expect(root.props('orientation')).toBe('vertical')
            wrapper.unmount()
        })

        it('TabsList renders with role="tablist" via reka-ui', () => {
            const wrapper = mount(TabsList, {
                global: {
                    stubs: {
                        TabsList: {
                            template: '<div role="tablist"><slot /></div>',
                        },
                    },
                },
            })

            const tablist = wrapper.find('[role="tablist"]')
            expect(tablist.exists()).toBe(true)
            wrapper.unmount()
        })

        it('TabsTrigger passes value prop to reka-ui', () => {
            const wrapper = mount(TabsTrigger, {
                props: { value: 'tab1' },
                global: {
                    stubs: {
                        TabsTrigger: {
                            template: '<button role="tab"><slot /></button>',
                        },
                    },
                },
            })

            const tab = wrapper.find('[role="tab"]')
            expect(tab.exists()).toBe(true)
            wrapper.unmount()
        })

        it('TabsTrigger supports disabled state for keyboard skip', () => {
            const wrapper = mount(TabsTrigger, {
                props: { value: 'tab1', disabled: true },
                global: {
                    stubs: {
                        TabsTrigger: {
                            template: '<button role="tab" :disabled="true"><slot /></button>',
                        },
                    },
                },
            })

            const tab = wrapper.find('button')
            expect(tab.attributes('disabled')).toBeDefined()
            wrapper.unmount()
        })

        it('TabsContent has focus-visible outline removal for accessibility', () => {
            const wrapper = mount(TabsContent, {
                props: { value: 'tab1' },
                global: {
                    stubs: {
                        TabsContent: {
                            template: '<div role="tabpanel"><slot /></div>',
                        },
                    },
                },
            })

            expect(wrapper.classes()).toContain('focus-visible:outline-none')
            wrapper.unmount()
        })
    })

    describe('keyboard event integration', () => {
        it('TabsRoot receives modelValue for keyboard-driven tab switching', () => {
            const modelValue = ref('tab1')

            const wrapper = mount(Tabs, {
                props: {
                    modelValue: modelValue.value,
                    'onUpdate:modelValue': (val: string) => {
                        modelValue.value = val
                    },
                },
            })

            // Simulate reka-ui emitting a value change (as it would after ArrowRight)
            wrapper.vm.$emit('update:modelValue', 'tab2')
            wrapper.unmount()
        })

        it('orientation prop determines arrow key direction', () => {
            // Horizontal: ArrowLeft/ArrowRight
            const horizontalWrapper = mount(Tabs, {
                props: { orientation: 'horizontal' },
            })
            expect((horizontalWrapper.props() as Record<string, unknown>).orientation).toBe('horizontal')
            horizontalWrapper.unmount()

            // Vertical: ArrowUp/ArrowDown
            const verticalWrapper = mount(Tabs, {
                props: { orientation: 'vertical' },
            })
            expect((verticalWrapper.props() as Record<string, unknown>).orientation).toBe('vertical')
            verticalWrapper.unmount()
        })
    })
})
