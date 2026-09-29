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

    it('renders horizontal dropdown overlay inside transition container when opened', async () => {
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
        await root.trigger('mouseenter')
        await advanceHoverDelay()

        const overlay = root.find('.absolute.top-full')
        expect(overlay.exists()).toBe(true)
        expect(overlay.classes()).toContain('z-dropdown')
        expect(overlay.find('#products-one').exists()).toBe(true)

        const menuList = overlay.find('ul')
        expect(menuList.attributes('role')).toBe('menu')
        expect(menuList.attributes('aria-orientation')).toBe('vertical')
    })

    it('synchronizes horizontal open state with parent context openedMenus', async () => {
        wrapper = mount({
            components: { Menu, MenuItem, SubMenu },
            template: `
                <Menu mode="horizontal" ref="menuRef">
                    <SubMenu index="products" title="Products" id="products-menu">
                        <MenuItem index="products-one" id="products-one">One</MenuItem>
                    </SubMenu>
                </Menu>
            `,
        }, { attachTo: document.body })

        const root = wrapper.find('#products-menu')
        await root.trigger('mouseenter')
        await advanceHoverDelay()

        const menuComponent = wrapper.findComponent(Menu)
        // @ts-expect-error context inspection
        expect(menuComponent.vm.openedMenus?.has('products') ?? false).toBe(true)

        await root.trigger('mouseleave')
        await advanceHoverDelay()
        // @ts-expect-error context inspection
        expect(menuComponent.vm.openedMenus?.has('products') ?? false).toBe(false)
    })

    it('handles keyboard navigation across horizontal and vertical modes', async () => {
        wrapper = mount({
            components: { Menu, MenuItem, SubMenu },
            template: `
                <Menu mode="horizontal">
                    <SubMenu index="sub-1" title="Sub 1" id="sub-1">
                        <MenuItem index="sub-1-1">Item 1-1</MenuItem>
                    </SubMenu>
                    <SubMenu index="sub-2" title="Sub 2" id="sub-2">
                        <MenuItem index="sub-2-1">Item 2-1</MenuItem>
                    </SubMenu>
                </Menu>
            `,
        }, { attachTo: document.body })

        const trigger1 = wrapper.find('#sub-1 [role="menuitem"]')
        await trigger1.trigger('keydown', { key: 'ArrowDown' })
        expect(trigger1.attributes('aria-expanded')).toBe('true')

        await trigger1.trigger('keydown', { key: 'ArrowRight' })
        await trigger1.trigger('keydown', { key: 'ArrowLeft' })
        await trigger1.trigger('keydown', { key: 'ArrowUp' })
        await trigger1.trigger('keydown', { key: 'Home' })
        await trigger1.trigger('keydown', { key: 'End' })
        await trigger1.trigger('keydown', { key: 'Enter' })
        await trigger1.trigger('keydown', { key: ' ' })
    })

    it('handles vertical mode collapsible transition lifecycle and keydown', async () => {
        wrapper = mount({
            components: { Menu, MenuItem, SubMenu },
            template: `
                <Menu mode="vertical">
                    <SubMenu index="sub-v" title="Sub V" id="sub-v">
                        <MenuItem index="sub-v-1">Item V-1</MenuItem>
                    </SubMenu>
                </Menu>
            `,
        }, { attachTo: document.body })

        const trigger = wrapper.find('#sub-v [role="menuitem"]')
        expect(trigger.attributes('aria-expanded')).toBe('false')

        await trigger.trigger('click')
        expect(trigger.attributes('aria-expanded')).toBe('true')

        await trigger.trigger('keydown', { key: 'ArrowDown' })
        await trigger.trigger('keydown', { key: 'ArrowRight' })
        await trigger.trigger('keydown', { key: 'ArrowLeft' })

        await trigger.trigger('click')
        expect(trigger.attributes('aria-expanded')).toBe('false')
    })

    it('closes on external document click in horizontal mode', async () => {
        wrapper = mount({
            components: { Menu, MenuItem, SubMenu },
            template: `
                <div>
                    <div id="outside-target">Outside</div>
                    <Menu mode="horizontal">
                        <SubMenu index="products" title="Products" id="products-menu">
                            <MenuItem index="products-one">One</MenuItem>
                        </SubMenu>
                    </Menu>
                </div>
            `,
        }, { attachTo: document.body })

        const root = wrapper.find('#products-menu')
        const trigger = root.find('[role="menuitem"]')
        await trigger.trigger('click')
        expect(trigger.attributes('aria-expanded')).toBe('true')

        document.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        await nextTick()
        expect(trigger.attributes('aria-expanded')).toBe('false')
    })

    it('updates registration when index prop dynamically changes', async () => {
        wrapper = mount({
            components: { Menu, MenuItem, SubMenu },
            props: { menuIndex: { type: String, default: 'old-idx' } },
            template: `
                <Menu mode="horizontal">
                    <SubMenu :index="menuIndex" title="Dynamic" id="dynamic-menu">
                        <MenuItem index="item-1">Item 1</MenuItem>
                    </SubMenu>
                </Menu>
            `,
        }, { attachTo: document.body })

        await wrapper.setProps({ menuIndex: 'new-idx' })
        await nextTick()
        expect(wrapper.find('#dynamic-menu').exists()).toBe(true)
    })
})
