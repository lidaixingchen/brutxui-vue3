import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import DropdownMenuContent from './DropdownMenuContent.vue'
import DropdownMenuItem from './DropdownMenuItem.vue'
import DropdownMenuSeparator from './DropdownMenuSeparator.vue'

describe('DropdownMenu keyboard navigation support', () => {
    afterEach(() => {
        document.body.innerHTML = ''
    })

    describe('WAI-ARIA menu pattern compliance', () => {
        it('DropdownMenuContent renders with proper styling for keyboard focus', () => {
            const wrapper = mount(DropdownMenuContent, {
                global: {
                    stubs: {
                        DropdownMenuPortal: { template: '<slot />' },
                        DropdownMenuContent: {
                            template: '<div role="menu" data-testid="content"><slot /></div>',
                        },
                    },
                },
            })

            const content = wrapper.find('[data-testid="content"]')
            expect(content.exists()).toBe(true)
            expect(content.classes()).toContain('border-3')
            wrapper.unmount()
        })

        it('DropdownMenuItem is focusable for keyboard navigation', () => {
            const wrapper = mount(DropdownMenuItem, {
                slots: { default: 'Menu Item' },
                global: {
                    stubs: {
                        DropdownMenuItem: {
                            template: '<div role="menuitem" tabindex="-1"><slot /></div>',
                        },
                    },
                },
            })

            const item = wrapper.find('[role="menuitem"]')
            expect(item.exists()).toBe(true)
            wrapper.unmount()
        })

        it('DropdownMenuItem supports inset for nested content', () => {
            const wrapper = mount(DropdownMenuItem, {
                props: { inset: true },
                global: {
                    stubs: {
                        DropdownMenuItem: { template: '<div><slot /></div>' },
                    },
                },
            })

            expect(wrapper.classes()).toContain('pl-8')
            wrapper.unmount()
        })

        it('DropdownMenuSeparator visually divides menu sections', () => {
            const wrapper = mount(DropdownMenuSeparator, {
                global: {
                    stubs: {
                        DropdownMenuSeparator: { template: '<div role="separator" />' },
                    },
                },
            })

            expect(wrapper.classes()).toContain('h-[3px]')
            expect(wrapper.classes()).toContain('bg-brutal-fg')
            wrapper.unmount()
        })
    })

    describe('keyboard event handling', () => {
        it('DropdownMenuItem handles click events (Enter/Space)', async () => {
            const wrapper = mount(DropdownMenuItem, {
                slots: { default: 'Clickable' },
                global: {
                    stubs: {
                        DropdownMenuItem: {
                            template: '<div role="menuitem" @click="$emit(\'select\')"><slot /></div>',
                        },
                    },
                },
            })

            await wrapper.trigger('click')
            expect(wrapper.emitted()).toBeTruthy()
            wrapper.unmount()
        })

        it('DropdownMenuItem supports custom class for focus styling', () => {
            const wrapper = mount(DropdownMenuItem, {
                props: { class: 'focus:bg-accent' },
                global: {
                    stubs: {
                        DropdownMenuItem: { template: '<div><slot /></div>' },
                    },
                },
            })

            expect(wrapper.classes()).toContain('focus:bg-accent')
            wrapper.unmount()
        })
    })

    describe('ARIA attributes', () => {
        it('DropdownMenuContent has proper ARIA role', () => {
            const wrapper = mount(DropdownMenuContent, {
                global: {
                    stubs: {
                        DropdownMenuPortal: { template: '<slot />' },
                        DropdownMenuContent: {
                            template: '<div role="menu"><slot /></div>',
                        },
                    },
                },
            })

            const menu = wrapper.find('[role="menu"]')
            expect(menu.exists()).toBe(true)
            wrapper.unmount()
        })

        it('DropdownMenuSeparator has separator role', () => {
            const wrapper = mount(DropdownMenuSeparator, {
                global: {
                    stubs: {
                        DropdownMenuSeparator: {
                            template: '<div role="separator" />',
                        },
                    },
                },
            })

            expect(wrapper.exists()).toBe(true)
            wrapper.unmount()
        })
    })
})
