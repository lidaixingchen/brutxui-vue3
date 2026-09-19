import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Menu from './Menu.vue'
import MenuItem from './MenuItem.vue'
import SubMenu from './SubMenu.vue'
import { SUB_MENU_HOVER_DELAY_MS } from './menu-types'

const TIMER_BOUNDARY_OFFSET_MS = 1

type MenuWrapper = ReturnType<typeof mount>

let wrapper: MenuWrapper | null = null

beforeEach(() => {
    vi.useFakeTimers()
})

afterEach(() => {
    if (wrapper) {
        wrapper.unmount()
        wrapper = null
    }
    vi.useRealTimers()
})

async function advanceHoverDelay(): Promise<void> {
    await vi.advanceTimersByTimeAsync(SUB_MENU_HOVER_DELAY_MS)
    await nextTick()
}

describe('SubMenu hover lifecycle', () => {
    it.each([false, true])('keeps the submenu closed after Escape cancels a pending hover (clicked: %s)', async (clicked: boolean) => {
        wrapper = mount({
            components: { Menu, MenuItem, SubMenu },
            template: `
                <Menu mode="horizontal">
                    <SubMenu index="products" title="Products" id="products-menu">
                        <MenuItem index="products-one">One</MenuItem>
                    </SubMenu>
                </Menu>
            `,
        }, { attachTo: document.body })

        const root = wrapper.find('#products-menu')
        const trigger = root.find('[role="menuitem"]')
        await root.trigger('mouseenter')
        if (clicked) {
            await trigger.trigger('click')
            expect(trigger.attributes('aria-expanded')).toBe('true')
        }

        await trigger.trigger('keydown', { key: 'Escape' })
        await advanceHoverDelay()
        expect(trigger.attributes('aria-expanded')).toBe('false')
    })

    it('cancels pending hover when the submenu becomes disabled', async () => {
        wrapper = mount({
            components: { Menu, MenuItem, SubMenu },
            props: { disabled: Boolean },
            template: `
                <Menu mode="horizontal">
                    <SubMenu index="products" title="Products" id="products-menu" :disabled="disabled">
                        <MenuItem index="products-one">One</MenuItem>
                    </SubMenu>
                </Menu>
            `,
        }, { attachTo: document.body })

        const root = wrapper.find('#products-menu')
        await root.trigger('mouseenter')
        await wrapper.setProps({ disabled: true })
        await advanceHoverDelay()
        expect(root.find('[role="menuitem"]').attributes('aria-expanded')).toBe('false')
        expect(vi.getTimerCount()).toBe(0)
    })

    it('opens and closes the horizontal submenu after the hover delay', async () => {
        wrapper = mount({
            components: { Menu, MenuItem, SubMenu },
            template: `
                <Menu mode="horizontal">
                    <SubMenu index="products" title="Products" id="products-menu">
                        <MenuItem index="products-one" id="products-one">One</MenuItem>
                    </SubMenu>
                </Menu>
            `,
        }, { attachTo: document.body })

        const root = wrapper.find('#products-menu')
        const trigger = root.find('[role="menuitem"]')

        expect(trigger.attributes('aria-expanded')).toBe('false')
        await root.trigger('mouseenter')
        await vi.advanceTimersByTimeAsync(SUB_MENU_HOVER_DELAY_MS - TIMER_BOUNDARY_OFFSET_MS)
        await nextTick()
        expect(trigger.attributes('aria-expanded')).toBe('false')

        await vi.advanceTimersByTimeAsync(TIMER_BOUNDARY_OFFSET_MS)
        await nextTick()
        expect(trigger.attributes('aria-expanded')).toBe('true')
        expect(root.find('#products-one').exists()).toBe(true)

        await root.trigger('mouseleave')
        expect(trigger.attributes('aria-expanded')).toBe('true')
        await advanceHoverDelay()
        expect(trigger.attributes('aria-expanded')).toBe('false')
        expect(root.find('#products-one').exists()).toBe(false)
    })

    it('cancels a pending transition during a quick hover round trip', async () => {
        wrapper = mount({
            components: { Menu, MenuItem, SubMenu },
            template: `
                <Menu mode="horizontal">
                    <SubMenu index="products" title="Products" id="products-menu">
                        <MenuItem index="products-one" id="products-one">One</MenuItem>
                    </SubMenu>
                </Menu>
            `,
        }, { attachTo: document.body })

        const root = wrapper.find('#products-menu')
        const trigger = root.find('[role="menuitem"]')

        await root.trigger('mouseenter')
        await vi.advanceTimersByTimeAsync(SUB_MENU_HOVER_DELAY_MS - TIMER_BOUNDARY_OFFSET_MS)
        await root.trigger('mouseleave')
        await advanceHoverDelay()
        expect(trigger.attributes('aria-expanded')).toBe('false')

        await root.trigger('mouseenter')
        await advanceHoverDelay()
        expect(trigger.attributes('aria-expanded')).toBe('true')

        await root.trigger('mouseleave')
        await vi.advanceTimersByTimeAsync(SUB_MENU_HOVER_DELAY_MS - TIMER_BOUNDARY_OFFSET_MS)
        await root.trigger('mouseenter')
        await advanceHoverDelay()
        expect(trigger.attributes('aria-expanded')).toBe('true')
    })

    it('keeps a submenu open while the pointer enters its content', async () => {
        wrapper = mount({
            components: { Menu, MenuItem, SubMenu },
            template: `
                <Menu mode="horizontal">
                    <SubMenu index="products" title="Products" id="products-menu">
                        <MenuItem index="products-one" id="products-one">One</MenuItem>
                    </SubMenu>
                </Menu>
            `,
        }, { attachTo: document.body })

        const root = wrapper.find('#products-menu')
        const trigger = root.find('[role="menuitem"]')

        await root.trigger('mouseenter')
        await advanceHoverDelay()
        const contentItem = root.find('#products-one')
        await contentItem.trigger('mouseenter')
        await nextTick()

        expect(trigger.attributes('aria-expanded')).toBe('true')
        expect(contentItem.isVisible()).toBe(true)
    })

    it('opens and closes nested submenus independently', async () => {
        wrapper = mount({
            components: { Menu, MenuItem, SubMenu },
            template: `
                <Menu mode="horizontal">
                    <SubMenu index="products" title="Products" id="products-menu">
                        <SubMenu index="products-more" title="More" id="more-menu">
                            <MenuItem index="products-more-one" id="products-more-one">One</MenuItem>
                        </SubMenu>
                    </SubMenu>
                </Menu>
            `,
        }, { attachTo: document.body })

        const outerRoot = wrapper.find('#products-menu')
        const outerTrigger = outerRoot.find('[role="menuitem"]')
        await outerRoot.trigger('mouseenter')
        await advanceHoverDelay()

        const innerRoot = wrapper.find('#more-menu')
        const innerTrigger = innerRoot.find('[role="menuitem"]')
        await innerRoot.trigger('mouseenter')
        await advanceHoverDelay()

        expect(outerTrigger.attributes('aria-expanded')).toBe('true')
        expect(innerTrigger.attributes('aria-expanded')).toBe('true')
        expect(innerRoot.find('#products-more-one').isVisible()).toBe(true)

        await outerRoot.trigger('mouseleave')
        await advanceHoverDelay()
        expect(outerTrigger.attributes('aria-expanded')).toBe('false')
        expect(wrapper.find('#more-menu').exists()).toBe(false)
    })

    it('does not open a disabled submenu from hover or click', async () => {
        wrapper = mount({
            components: { Menu, MenuItem, SubMenu },
            template: `
                <Menu mode="horizontal">
                    <SubMenu index="products" title="Products" id="products-menu" disabled>
                        <MenuItem index="products-one" id="products-one">One</MenuItem>
                    </SubMenu>
                </Menu>
            `,
        }, { attachTo: document.body })

        const root = wrapper.find('#products-menu')
        const trigger = root.find('[role="menuitem"]')
        await root.trigger('mouseenter')
        await advanceHoverDelay()
        await trigger.trigger('click')
        await nextTick()

        expect(trigger.attributes('aria-disabled')).toBe('true')
        expect(trigger.attributes('aria-expanded')).toBe('false')
        expect(root.find('#products-one').exists()).toBe(false)
    })

    it('clears a pending hover timer when unmounted', async () => {
        wrapper = mount({
            components: { Menu, MenuItem, SubMenu },
            template: `
                <Menu mode="horizontal">
                    <SubMenu index="products" title="Products" id="products-menu">
                        <MenuItem index="products-one" id="products-one">One</MenuItem>
                    </SubMenu>
                </Menu>
            `,
        }, { attachTo: document.body })

        await wrapper.find('#products-menu').trigger('mouseenter')
        expect(vi.getTimerCount()).toBe(1)

        wrapper.unmount()
        wrapper = null
        expect(vi.getTimerCount()).toBe(0)

        await vi.advanceTimersByTimeAsync(SUB_MENU_HOVER_DELAY_MS)
        expect(vi.getTimerCount()).toBe(0)
    })
})
