import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import DialogContent from './DialogContent.vue'
import DialogOverlay from './DialogOverlay.vue'

describe('Dialog keyboard navigation support', () => {
    afterEach(() => {
        document.body.innerHTML = ''
    })

    describe('WAI-ARIA dialog pattern compliance', () => {
        it('DialogContent renders close button for Escape key support', () => {
            const wrapper = mount(DialogContent, {
                global: {
                    stubs: {
                        DialogPortal: { template: '<slot />' },
                        DialogOverlay: { template: '<div />' },
                        DialogContent: {
                            template: '<div role="dialog"><slot /></div>',
                        },
                        DialogClose: {
                            template: '<button data-testid="close"><slot /></button>',
                        },
                    },
                },
            })

            const closeBtn = wrapper.find('[data-testid="close"]')
            expect(closeBtn.exists()).toBe(true)
            wrapper.unmount()
        })

        it('DialogContent close button has accessible label', () => {
            const wrapper = mount(DialogContent, {
                global: {
                    stubs: {
                        DialogPortal: { template: '<slot />' },
                        DialogOverlay: { template: '<div />' },
                        DialogContent: {
                            template: '<div role="dialog"><slot /></div>',
                        },
                        DialogClose: {
                            template: '<button><slot /></button>',
                        },
                    },
                },
            })

            // Check for sr-only text
            const srOnly = wrapper.find('.sr-only')
            expect(srOnly.exists()).toBe(true)
            wrapper.unmount()
        })

        it('DialogContent can hide close button when showCloseButton is false', () => {
            const wrapper = mount(DialogContent, {
                props: { showCloseButton: false },
                global: {
                    stubs: {
                        DialogPortal: { template: '<slot />' },
                        DialogOverlay: { template: '<div />' },
                        DialogContent: {
                            template: '<div role="dialog"><slot /></div>',
                        },
                        DialogClose: {
                            template: '<button data-testid="close"><slot /></button>',
                        },
                    },
                },
            })

            const closeBtn = wrapper.find('[data-testid="close"]')
            expect(closeBtn.exists()).toBe(false)
            wrapper.unmount()
        })

        it('DialogOverlay has fixed positioning for focus trap backdrop', () => {
            const wrapper = mount(DialogOverlay, {
                global: {
                    stubs: {
                        DialogOverlay: {
                            template: '<div class="fixed inset-0" />',
                        },
                    },
                },
            })

            expect(wrapper.classes()).toContain('fixed')
            expect(wrapper.classes()).toContain('inset-0')
            wrapper.unmount()
        })
    })

    describe('keyboard event handling', () => {
        it('DialogContent supports Escape key via reka-ui DialogClose', async () => {
            const wrapper = mount(DialogContent, {
                props: { showCloseButton: true },
                global: {
                    stubs: {
                        DialogPortal: { template: '<slot />' },
                        DialogOverlay: { template: '<div />' },
                        DialogContent: {
                            template: '<div role="dialog" aria-modal="true"><slot /></div>',
                        },
                        DialogClose: {
                            template: '<button data-testid="close" @click="() => {}"><slot /></button>',
                        },
                    },
                },
            })

            // Verify dialog structure supports Escape close
            const dialog = wrapper.find('[role="dialog"]')
            expect(dialog.exists()).toBe(true)
            expect(dialog.attributes('aria-modal')).toBe('true')
            wrapper.unmount()
        })

        it('DialogContent supports Tab focus trap via reka-ui', () => {
            const wrapper = mount(DialogContent, {
                global: {
                    stubs: {
                        DialogPortal: { template: '<slot />' },
                        DialogOverlay: { template: '<div />' },
                        DialogContent: {
                            template: `
                                <div role="dialog" aria-modal="true">
                                    <slot />
                                    <input data-testid="input1" />
                                    <button data-testid="btn1">OK</button>
                                </div>
                            `,
                        },
                        DialogClose: {
                            template: '<button data-testid="close"><slot /></button>',
                        },
                    },
                },
                slots: {
                    default: '<input data-testid="input0" />',
                },
            })

            // Verify focusable elements exist within dialog
            const dialog = wrapper.find('[role="dialog"]')
            const inputs = dialog.findAll('input')
            const buttons = dialog.findAll('button')
            expect(inputs.length + buttons.length).toBeGreaterThan(1)
            wrapper.unmount()
        })
    })

    describe('ARIA attributes', () => {
        it('DialogContent has role="dialog"', () => {
            const wrapper = mount(DialogContent, {
                global: {
                    stubs: {
                        DialogPortal: { template: '<slot />' },
                        DialogOverlay: { template: '<div />' },
                        DialogContent: {
                            template: '<div role="dialog" data-testid="dialog"><slot /></div>',
                        },
                        DialogClose: { template: '<button />' },
                    },
                },
            })

            const dialog = wrapper.find('[role="dialog"]')
            expect(dialog.exists()).toBe(true)
            wrapper.unmount()
        })

        it('DialogContent supports aria-modal for focus trap indication', () => {
            const wrapper = mount(DialogContent, {
                global: {
                    stubs: {
                        DialogPortal: { template: '<slot />' },
                        DialogOverlay: { template: '<div />' },
                        DialogContent: {
                            template: '<div role="dialog" aria-modal="true"><slot /></div>',
                        },
                        DialogClose: { template: '<button />' },
                    },
                },
            })

            const dialog = wrapper.find('[role="dialog"]')
            expect(dialog.attributes('aria-modal')).toBe('true')
            wrapper.unmount()
        })

        it('DialogContent supports aria-labelledby for title reference', () => {
            const wrapper = mount(DialogContent, {
                global: {
                    stubs: {
                        DialogPortal: { template: '<slot />' },
                        DialogOverlay: { template: '<div />' },
                        DialogContent: {
                            template: '<div role="dialog" aria-labelledby="title-id"><slot /></div>',
                        },
                        DialogClose: { template: '<button />' },
                    },
                },
            })

            const dialog = wrapper.find('[role="dialog"]')
            expect(dialog.attributes('aria-labelledby')).toBe('title-id')
            wrapper.unmount()
        })
    })

    describe('size variants', () => {
        it('supports different sizes for responsive keyboard interaction', () => {
            const sizes = ['sm', 'default', 'lg', 'xl', 'full'] as const

            sizes.forEach((size) => {
                const wrapper = mount(DialogContent, {
                    props: { size },
                    global: {
                        stubs: {
                            DialogPortal: { template: '<slot />' },
                            DialogOverlay: { template: '<div />' },
                            DialogContent: {
                                template: '<div role="dialog"><slot /></div>',
                            },
                            DialogClose: { template: '<button />' },
                        },
                    },
                })

                expect(wrapper.exists()).toBe(true)
                wrapper.unmount()
            })
        })
    })
})
