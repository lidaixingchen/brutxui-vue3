import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref, type Component, type VNode } from 'vue'
import { mount } from '@/test/browser-mount'
import '../../../dist/styles.css'
import Menu from './Menu.vue'
import MenuItem from './MenuItem.vue'
import SubMenu from './SubMenu.vue'

let host: HTMLDivElement | null = null
let wrapper: ReturnType<typeof mount> | null = null

beforeEach(() => {
    host = document.createElement('div')
    document.body.appendChild(host)
})

afterEach(() => {
    if (wrapper) {
        wrapper.unmount()
        wrapper = null
    }
    if (host?.parentNode) {
        host.parentNode.removeChild(host)
    }
    host = null
})

function getElement(root: ParentNode, selector: string): HTMLElement {
    const element = root.querySelector(selector)
    if (!(element instanceof HTMLElement)) {
        throw new Error(`Expected an HTMLElement for selector: ${selector}`)
    }
    return element
}

function createSingleMenuFixture(): Component {
    return defineComponent({
        name: 'SubMenuSingleBrowserFixture',
        setup(): () => VNode {
            return () => h('div', [
                h('input', { id: 'outside' }),
                h(Menu, { mode: 'horizontal' }, {
                    default: () => [
                        h(SubMenu, {
                            index: 'products',
                            title: 'Products',
                            id: 'products-menu',
                        }, {
                            default: () => [
                                h(MenuItem, { index: 'products-one', id: 'products-one' }, {
                                    default: () => 'One',
                                }),
                            ],
                        }),
                    ],
                }),
            ])
        },
    })
}

function createNestedMenuFixture(): Component {
    return defineComponent({
        name: 'SubMenuNestedBrowserFixture',
        setup(): () => VNode {
            return () => h(Menu, { mode: 'horizontal' }, {
                default: () => [
                    h(SubMenu, {
                        index: 'products',
                        title: 'Products',
                        id: 'products-menu',
                    }, {
                        default: () => [
                            h(SubMenu, {
                                index: 'products-more',
                                title: 'More',
                                id: 'more-menu',
                            }, {
                                default: () => [
                                    h(MenuItem, { index: 'products-more-one', id: 'products-more-one' }, {
                                        default: () => 'One',
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            })
        },
    })
}

describe('SubMenu Browser Integration (Chromium)', () => {
    it('opens on a real pointer hover and stays open while entering the content', async () => {
        wrapper = mount(createSingleMenuFixture(), { attachTo: host! })

        const root = getElement(host!, '#products-menu')
        const trigger = getElement(root, '[role="menuitem"]')
        expect(trigger.getAttribute('aria-expanded')).toBe('false')

        await userEvent.hover(trigger)

        await expect.poll(() => trigger.getAttribute('aria-expanded')).toBe('true')
        const contentItem = getElement(root, '#products-one')
        await userEvent.hover(contentItem)
        expect(root.contains(contentItem)).toBe(true)

        await userEvent.unhover(root)
        await expect.poll(() => trigger.getAttribute('aria-expanded')).toBe('false')
        await expect.poll(() => root.querySelector('#products-one')).toBeNull()
    })

    it('keeps input focus through pointer hover and Escape, then focuses the child for keyboard opening', async () => {
        wrapper = mount(createSingleMenuFixture(), { attachTo: host! })
        const outside = getElement(host!, '#outside')
        const root = getElement(host!, '#products-menu')
        const trigger = getElement(root, '[aria-haspopup]')
        outside.focus()

        await userEvent.hover(trigger)
        await expect.poll(() => trigger.getAttribute('aria-expanded')).toBe('true')
        expect(document.activeElement).toBe(outside)

        await userEvent.keyboard('[Escape]')
        await expect.poll(() => trigger.getAttribute('aria-expanded')).toBe('false')
        expect(document.activeElement).toBe(outside)

        trigger.focus()
        await userEvent.keyboard('[ArrowDown]')
        expect(document.activeElement).toBe(getElement(root, '#products-one'))
        await userEvent.keyboard('[Escape]')
        expect(trigger.getAttribute('aria-expanded')).toBe('false')
        expect(document.activeElement).toBe(trigger)
    })

    it.each([false, true])('closes the focused sibling after Escape regardless of DOM order (reordered: %s)', async (reorder) => {
        const order = ref(['first', 'second'])
        wrapper = mount(defineComponent({
            setup: () => () => h(Menu, { mode: 'horizontal' }, {
                default: () => order.value.map(index => h(SubMenu, { key: index, index, title: index, id: index }, {
                    default: () => h(MenuItem, { index: `${index}-child`, id: `${index}-child` }, () => index),
                })),
            }),
        }), { attachTo: host! })
        const first = getElement(host!, '#first [aria-haspopup]')
        const second = getElement(host!, '#second [aria-haspopup]')

        await userEvent.click(second)
        expect(second.getAttribute('aria-expanded')).toBe('true')
        expect(document.activeElement).toBe(second)
        await userEvent.hover(first)
        await expect.poll(() => first.getAttribute('aria-expanded')).toBe('true')
        if (reorder) {
            order.value = [...order.value].reverse()
            await nextTick()
            expect(getElement(host!, '[aria-haspopup]')).toBe(second)
        }
        getElement(host!, '#first-child').focus()

        await userEvent.keyboard('[Escape]')

        expect(first.getAttribute('aria-expanded')).toBe('false')
        expect(second.getAttribute('aria-expanded')).toBe('true')
        expect(document.activeElement).toBe(first)
    })

    it('dismisses successive submenu levels from the focused child', async () => {
        wrapper = mount(createNestedMenuFixture(), { attachTo: host! })
        const outerTrigger = getElement(host!, '#products-menu [aria-haspopup]')
        outerTrigger.focus()
        await userEvent.keyboard('[ArrowDown]')
        const innerTrigger = getElement(host!, '#more-menu [aria-haspopup]')
        expect(document.activeElement).toBe(innerTrigger)
        await userEvent.keyboard('[Enter]')
        expect(document.activeElement).toBe(getElement(host!, '#products-more-one'))

        await userEvent.keyboard('[Escape]')
        expect(innerTrigger.getAttribute('aria-expanded')).toBe('false')
        expect(outerTrigger.getAttribute('aria-expanded')).toBe('true')
        expect(document.activeElement).toBe(innerTrigger)

        await userEvent.keyboard('[Escape]')
        expect(outerTrigger.getAttribute('aria-expanded')).toBe('false')
        expect(document.activeElement).toBe(outerTrigger)
    })

    it('scopes Escape to the focused Menu instance even when indexes are shared', async () => {
        wrapper = mount(defineComponent({
            setup: () => () => h('div', ['first', 'second'].map(id => h(Menu, { mode: 'horizontal', id }, {
                default: () => h(SubMenu, { index: 'shared', title: id }, {
                    default: () => h(MenuItem, { index: 'child', id: `${id}-child` }, () => id),
                }),
            }))),
        }), { attachTo: host! })
        const first = getElement(host!, '#first [aria-haspopup]')
        const second = getElement(host!, '#second [aria-haspopup]')
        first.focus()
        await userEvent.keyboard('[ArrowDown]')
        second.focus()
        await userEvent.keyboard('[ArrowDown]')
        expect(document.activeElement).toBe(getElement(host!, '#second-child'))
        expect(first.getAttribute('aria-expanded')).toBe('true')

        await userEvent.keyboard('[Escape]')

        expect(first.getAttribute('aria-expanded')).toBe('true')
        expect(second.getAttribute('aria-expanded')).toBe('false')
        expect(document.activeElement).toBe(second)
    })

    it('opens nested submenus along the real pointer path and closes the branch on exit', async () => {
        wrapper = mount(createNestedMenuFixture(), { attachTo: host! })

        const outerRoot = getElement(host!, '#products-menu')
        const outerTrigger = getElement(outerRoot, '[role="menuitem"]')
        await userEvent.hover(outerTrigger)
        await expect.poll(() => outerTrigger.getAttribute('aria-expanded')).toBe('true')

        const innerRoot = getElement(outerRoot, '#more-menu')
        const innerTrigger = getElement(innerRoot, '[role="menuitem"]')
        await userEvent.hover(innerTrigger)

        expect(outerTrigger.getAttribute('aria-expanded')).toBe('true')
        await expect.poll(() => innerTrigger.getAttribute('aria-expanded')).toBe('true')
        expect(getElement(innerRoot, '#products-more-one')).toBeInstanceOf(HTMLElement)

        await userEvent.unhover(outerRoot)
        await expect.poll(() => outerTrigger.getAttribute('aria-expanded')).toBe('false')
        await expect.poll(() => host!.querySelector('#more-menu')).toBeNull()
    })
})
