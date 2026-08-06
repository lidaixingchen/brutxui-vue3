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

    it('keeps horizontal submenu open on mouse leave and closes on outside click', async () => {
        wrapper = mount({
            components: { Menu, MenuItem, SubMenu },
            template: `
                <Menu mode="horizontal">
                    <SubMenu index="sub1" title="SubMenu 1" id="sub-trigger">
                        <MenuItem index="sub1-1" id="sub-item">Sub Item 1-1</MenuItem>
                    </SubMenu>
                </Menu>
            `
        }, {
            attachTo: document.body
        })
        const subTrigger = wrapper.find('#sub-trigger [role="menuitem"]')

        // 初始收起：水平面板为条件渲染，收起时子项不在 DOM 中
        expect(wrapper.find('#sub-item').exists()).toBe(false)

        // 点击 trigger 固定打开
        await subTrigger.trigger('click')
        await nextTick()
        expect(wrapper.find('#sub-item').exists()).toBe(true)

        // 鼠标移出后仍保持展开（点击固定不因悬停丢失而收起）
        await wrapper.find('#sub-trigger').trigger('mouseleave')
        await nextTick()
        expect(wrapper.find('#sub-item').exists()).toBe(true)

        // 点击面板外部后收起
        document.dispatchEvent(new MouseEvent('click'))
        await nextTick()
        expect(wrapper.find('#sub-item').exists()).toBe(false)
    })

    it('collapses horizontal submenu when trigger is clicked again', async () => {
        wrapper = mount({
            components: { Menu, MenuItem, SubMenu },
            template: `
                <Menu mode="horizontal">
                    <SubMenu index="sub1" title="SubMenu 1" id="sub-trigger">
                        <MenuItem index="sub1-1" id="sub-item">Sub Item 1-1</MenuItem>
                    </SubMenu>
                </Menu>
            `
        }, {
            attachTo: document.body
        })
        const subTrigger = wrapper.find('#sub-trigger [role="menuitem"]')

        await subTrigger.trigger('click')
        await nextTick()
        expect(wrapper.find('#sub-item').exists()).toBe(true)

        // 再次点击 trigger 可收起
        await subTrigger.trigger('click')
        await nextTick()
        expect(wrapper.find('#sub-item').exists()).toBe(false)
    })

    it('collapses horizontal submenu when a menu item inside the panel is selected', async () => {
        wrapper = mount({
            components: { Menu, MenuItem, SubMenu },
            template: `
                <Menu mode="horizontal">
                    <SubMenu index="sub1" title="SubMenu 1" id="sub-trigger">
                        <MenuItem index="sub1-1" id="sub-item">Sub Item 1-1</MenuItem>
                    </SubMenu>
                </Menu>
            `
        }, {
            attachTo: document.body
        })
        const subTrigger = wrapper.find('#sub-trigger [role="menuitem"]')

        await subTrigger.trigger('click')
        await nextTick()
        expect(wrapper.find('#sub-item').exists()).toBe(true)

        // 点击面板内的 MenuItem 后自动收起（点击发生在 rootRef 内，依赖 notifyItemSelected）
        await wrapper.find('#sub-item').trigger('click')
        await nextTick()
        expect(wrapper.find('#sub-item').exists()).toBe(false)
    })

    it('collapses horizontal submenu on Escape key', async () => {
        wrapper = mount({
            components: { Menu, MenuItem, SubMenu },
            template: `
                <Menu mode="horizontal">
                    <SubMenu index="sub1" title="SubMenu 1" id="sub-trigger">
                        <MenuItem index="sub1-1" id="sub-item">Sub Item 1-1</MenuItem>
                    </SubMenu>
                </Menu>
            `
        }, {
            attachTo: document.body
        })
        const subTrigger = wrapper.find('#sub-trigger [role="menuitem"]')

        await subTrigger.trigger('click')
        await nextTick()
        expect(wrapper.find('#sub-item').exists()).toBe(true)

        // 打开状态下按 Escape 收起
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
        await nextTick()
        expect(wrapper.find('#sub-item').exists()).toBe(false)
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
