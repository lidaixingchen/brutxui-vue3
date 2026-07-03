import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Menu from './Menu.vue'
import MenuItem from './MenuItem.vue'
import SubMenu from './SubMenu.vue'

let wrapper: ReturnType<typeof mount> | null = null

afterEach(() => {
    if (wrapper) {
        wrapper.unmount()
        wrapper = null
    }
})

describe('Menu', () => {
    it('renders menu container with children', () => {
        wrapper = mount({
            components: { Menu, MenuItem, SubMenu },
            template: `
                <Menu default-active="1">
                    <MenuItem index="1">Item 1</MenuItem>
                    <MenuItem index="2" disabled>Item 2</MenuItem>
                    <SubMenu index="3" title="Sub 3">
                        <MenuItem index="3-1">Item 3-1</MenuItem>
                    </SubMenu>
                </Menu>
            `
        })
        expect(wrapper.find('[role="menubar"]').exists()).toBe(true)
        const items = wrapper.findAll('[role="menuitem"]')
        expect(items.length).toBeGreaterThanOrEqual(3)
    })

    it('sets default active item and applies active classes', () => {
        wrapper = mount({
            components: { Menu, MenuItem },
            template: `
                <Menu default-active="2">
                    <MenuItem index="1">Item 1</MenuItem>
                    <MenuItem index="2">Item 2</MenuItem>
                </Menu>
            `
        })
        const items = wrapper.findAll('li')
        expect(items[0].classes()).not.toContain('bg-brutal-primary')
        expect(items[1].classes()).toContain('bg-brutal-primary')
    })

    it('updates selection on item click', async () => {
        wrapper = mount({
            components: { Menu, MenuItem },
            template: `
                <Menu default-active="1">
                    <MenuItem index="1">Item 1</MenuItem>
                    <MenuItem index="2" id="target-item">Item 2</MenuItem>
                </Menu>
            `
        })
        const target = wrapper.find('#target-item')
        await target.trigger('click')
        await nextTick()
        expect(target.classes()).toContain('bg-brutal-primary')
    })

    it('toggles submenu open state in vertical mode', async () => {
        wrapper = mount({
            components: { Menu, MenuItem, SubMenu },
            template: `
                <Menu default-active="1" mode="vertical">
                    <SubMenu index="sub1" title="SubMenu 1" id="sub-trigger">
                        <MenuItem index="sub1-1" id="sub-item">Sub Item 1-1</MenuItem>
                    </SubMenu>
                </Menu>
            `
        }, {
            attachTo: document.body
        })
        const subTrigger = wrapper.find('#sub-trigger [role="menuitem"]')
        expect(wrapper.find('#sub-item').isVisible()).toBe(false)
        
        await subTrigger.trigger('click')
        await nextTick()
        expect(wrapper.find('#sub-item').isVisible()).toBe(true)
        
        await subTrigger.trigger('click')
        await nextTick()
        expect(wrapper.find('#sub-item').isVisible()).toBe(false)
    })

    it('propagates child active state to SubMenu header', async () => {
        wrapper = mount({
            components: { Menu, MenuItem, SubMenu },
            template: `
                <Menu default-active="sub1-1" mode="vertical">
                    <SubMenu index="sub1" title="SubMenu 1" id="sub-trigger">
                        <MenuItem index="sub1-1">Sub Item 1-1</MenuItem>
                    </SubMenu>
                </Menu>
            `
        }, {
            attachTo: document.body
        })
        await nextTick()
        await nextTick()
        
        const subHeader = wrapper.find('#sub-trigger > div')
        expect(subHeader.classes()).toContain('bg-brutal-primary')
    })
})
