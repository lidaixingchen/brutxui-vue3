import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, type Component, type VNode } from 'vue'
import { mount } from '@/test/browser-mount'
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
            return () => h(Menu, { mode: 'horizontal' }, {
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
            })
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
        expect(root.querySelector('#products-one')).toBeNull()
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
        expect(host!.querySelector('#more-menu')).toBeNull()
    })
})
