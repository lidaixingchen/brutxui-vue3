import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref, type Component, type Ref } from 'vue'
import { mount } from '@/test/browser-mount'
import Menu from './Menu.vue'
import MenuItem from './MenuItem.vue'
import SubMenu from './SubMenu.vue'

interface MenuControls {
    betaDisabled: Ref<boolean>
    betaVisible: Ref<boolean>
    itemsVisible: Ref<boolean>
}

interface SubMenuControls {
    submenuDisabled: Ref<boolean>
    submenuVisible: Ref<boolean>
}

let host: HTMLDivElement | null = null
let wrapper: ReturnType<typeof mount> | null = null

beforeEach(() => {
    host = document.createElement('div')
    document.body.appendChild(host)
})

afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    if (host?.parentNode) host.parentNode.removeChild(host)
    host = null
})

function getElement(root: ParentNode, selector: string): HTMLElement {
    const element = root.querySelector(selector)
    if (!(element instanceof HTMLElement)) {
        throw new Error(`Expected an HTMLElement for selector: ${selector}`)
    }
    return element
}

function createMenuFixture(options: { defaultActive?: string; allDisabled?: boolean } = {}): { component: Component; controls: MenuControls } {
    const controls: MenuControls = {
        betaDisabled: ref(false),
        betaVisible: ref(true),
        itemsVisible: ref(true),
    }

    const component = defineComponent({
        name: 'MenuFocusBrowserFixture',
        setup() {
            return () => h('div', [
                h('button', { id: 'before-menu' }, 'Before menu'),
                h(Menu, { defaultActive: options.defaultActive ?? 'alpha', mode: 'vertical' }, {
                    default: () => controls.itemsVisible.value ? [
                        h(MenuItem, { key: 'alpha', index: 'alpha', id: 'menu-alpha', disabled: options.allDisabled }, {
                            default: () => 'Alpha',
                        }),
                        controls.betaVisible.value && h(MenuItem, {
                            index: 'beta',
                            key: 'beta',
                            id: 'menu-beta',
                            disabled: options.allDisabled || controls.betaDisabled.value,
                        }, {
                            default: () => 'Beta',
                        }),
                        h(MenuItem, { key: 'gamma', index: 'gamma', id: 'menu-gamma', disabled: options.allDisabled }, {
                            default: () => 'Gamma',
                        }),
                    ].filter(Boolean) : [],
                }),
                h('button', { id: 'after-menu' }, 'After menu'),
            ])
        },
    })

    return { component, controls }
}

function createSubMenuFixture(): { component: Component; controls: SubMenuControls } {
    const controls: SubMenuControls = {
        submenuDisabled: ref(false),
        submenuVisible: ref(true),
    }
    const component = defineComponent({
        name: 'SubMenuFocusBrowserFixture',
        setup() {
            return () => h('div', [
                h('button', { id: 'before-menu' }, 'Before menu'),
                h(Menu, { defaultActive: 'submenu', mode: 'vertical' }, {
                    default: () => [
                        controls.submenuVisible.value && h(SubMenu, {
                            key: 'submenu',
                            index: 'submenu',
                            id: 'submenu',
                            title: 'Submenu',
                            disabled: controls.submenuDisabled.value,
                        }, {
                            default: () => h(MenuItem, { index: 'submenu-child' }, {
                                default: () => 'Submenu child',
                            }),
                        }),
                        h(MenuItem, { key: 'outside', index: 'outside', id: 'menu-outside' }, {
                            default: () => 'Outside submenu',
                        }),
                    ].filter(Boolean),
                }),
                h('button', { id: 'after-menu' }, 'After menu'),
            ])
        },
    })
    return { component, controls }
}

async function pressKey(item: HTMLElement, key: string): Promise<void> {
    expect(document.activeElement).toBe(item)
    await userEvent.keyboard(`[${key}]`)
    await nextTick()
}

describe('Menu roving focus browser integration', () => {
    it('moves focus and the tab stop when the focused item becomes disabled', async () => {
        const { component, controls } = createMenuFixture()
        wrapper = mount(component, { attachTo: host! })

        const before = getElement(host!, '#before-menu')
        const alpha = getElement(host!, '#menu-alpha')
        const beta = getElement(host!, '#menu-beta')
        const gamma = getElement(host!, '#menu-gamma')
        const after = getElement(host!, '#after-menu')

        before.focus()
        await userEvent.tab()
        expect(document.activeElement).toBe(alpha)
        await pressKey(alpha, 'ArrowDown')
        expect(document.activeElement).toBe(beta)

        controls.betaDisabled.value = true
        await nextTick()

        expect(document.activeElement).toBe(gamma)
        expect(beta.getAttribute('tabindex')).toBe('-1')
        expect(gamma.getAttribute('tabindex')).toBe('0')

        await pressKey(gamma, 'ArrowDown')
        expect(document.activeElement).toBe(alpha)
        await userEvent.tab()
        expect(document.activeElement).toBe(after)
        await userEvent.tab({ shift: true })
        expect(document.activeElement).toBe(alpha)
    })

    it('moves focus to a remaining item when the focused default-active item is removed', async () => {
        const { component, controls } = createMenuFixture({ defaultActive: 'beta' })
        wrapper = mount(component, { attachTo: host! })

        const before = getElement(host!, '#before-menu')
        before.focus()
        await userEvent.tab()
        const beta = getElement(host!, '#menu-beta')
        const gamma = getElement(host!, '#menu-gamma')
        expect(document.activeElement).toBe(beta)

        controls.betaVisible.value = false
        await nextTick()

        expect(host!.querySelector('#menu-beta')).toBeNull()
        expect(document.activeElement).toBe(gamma)
        expect(gamma.getAttribute('tabindex')).toBe('0')

        await pressKey(gamma, 'ArrowDown')
        expect(document.activeElement).toBe(getElement(host!, '#menu-alpha'))
    })

    it('keeps focus outside while providing an entry after the default-active item is removed', async () => {
        const { component, controls } = createMenuFixture({ defaultActive: 'beta' })
        wrapper = mount(component, { attachTo: host! })

        const before = getElement(host!, '#before-menu')
        const alpha = getElement(host!, '#menu-alpha')
        before.focus()

        controls.betaVisible.value = false
        await nextTick()

        expect(document.activeElement).toBe(before)
        expect(alpha.getAttribute('tabindex')).toBe('0')
        controls.betaVisible.value = true
        await nextTick()
        expect(getElement(host!, '#menu-beta').getAttribute('tabindex')).toBe('0')

        controls.betaVisible.value = false
        await nextTick()
        expect(alpha.getAttribute('tabindex')).toBe('0')
        await userEvent.tab()
        expect(document.activeElement).toBe(alpha)
    })

    it('keeps focus outside when the default-active item becomes disabled', async () => {
        const { component, controls } = createMenuFixture({ defaultActive: 'beta' })
        wrapper = mount(component, { attachTo: host! })

        const before = getElement(host!, '#before-menu')
        const alpha = getElement(host!, '#menu-alpha')
        before.focus()

        controls.betaDisabled.value = true
        await nextTick()

        expect(document.activeElement).toBe(before)
        expect(alpha.getAttribute('tabindex')).toBe('0')
        controls.betaDisabled.value = false
        await nextTick()
        expect(getElement(host!, '#menu-beta').getAttribute('tabindex')).toBe('0')
    })

    it('leaves disabled and empty menus without a tab stop', async () => {
        const { component, controls } = createMenuFixture({ allDisabled: true })
        wrapper = mount(component, { attachTo: host! })

        const before = getElement(host!, '#before-menu')
        before.focus()
        const items = Array.from(host!.querySelectorAll<HTMLElement>('[role="menuitem"]'))
        expect(items).toHaveLength(3)
        expect(items.every((item) => item.getAttribute('tabindex') === '-1')).toBe(true)

        controls.itemsVisible.value = false
        await nextTick()

        expect(host!.querySelectorAll('[role="menuitem"]')).toHaveLength(0)
        expect(document.activeElement).toBe(before)
    })

    it('recovers focus when a focused submenu trigger is disabled or removed', async () => {
        const { component, controls } = createSubMenuFixture()
        wrapper = mount(component, { attachTo: host! })

        const before = getElement(host!, '#before-menu')
        const trigger = getElement(host!, '#submenu [role="menuitem"]')
        const outside = getElement(host!, '#menu-outside')
        before.focus()
        await userEvent.tab()
        expect(document.activeElement).toBe(trigger)

        controls.submenuDisabled.value = true
        await nextTick()
        expect(document.activeElement).toBe(outside)
        expect(outside.getAttribute('tabindex')).toBe('0')

        controls.submenuDisabled.value = false
        await nextTick()
        trigger.focus()
        controls.submenuVisible.value = false
        await nextTick()
        expect(host!.querySelector('#submenu')).toBeNull()
        expect(document.activeElement).toBe(outside)
    })
})
