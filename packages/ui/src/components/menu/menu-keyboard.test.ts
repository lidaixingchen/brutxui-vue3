import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
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

describe('Menu Keyboard Navigation & Roving Focus', () => {
    it('navigates with ArrowDown and ArrowUp in vertical mode', async () => {
        wrapper = mount({
            components: { Menu, MenuItem },
            template: `
                <Menu default-active="item1" mode="vertical">
                    <MenuItem index="item1" id="item1">Item 1</MenuItem>
                    <MenuItem index="item2" id="item2">Item 2</MenuItem>
                    <MenuItem index="item3" id="item3">Item 3</MenuItem>
                </Menu>
            `,
        }, { attachTo: document.body })

        await nextTick()

        const item1 = wrapper.find('#item1')
        const item2 = wrapper.find('#item2')
        const item3 = wrapper.find('#item3')

        expect(item1.attributes('tabindex')).toBe('0')
        expect(item2.attributes('tabindex')).toBe('-1')
        expect(item3.attributes('tabindex')).toBe('-1')

        await item1.trigger('keydown', { key: 'ArrowDown' })
        await nextTick()

        expect(item1.attributes('tabindex')).toBe('-1')
        expect(item2.attributes('tabindex')).toBe('0')
        expect(item3.attributes('tabindex')).toBe('-1')

        await item2.trigger('keydown', { key: 'ArrowDown' })
        await nextTick()

        expect(item3.attributes('tabindex')).toBe('0')

        // 循环回首项
        await item3.trigger('keydown', { key: 'ArrowDown' })
        await nextTick()

        expect(item1.attributes('tabindex')).toBe('0')

        // 向上导航
        await item1.trigger('keydown', { key: 'ArrowUp' })
        await nextTick()

        expect(item3.attributes('tabindex')).toBe('0')
    })

    it('sets tabindex=0 only for first enabled item when no default-active is provided', async () => {
        wrapper = mount({
            components: { Menu, MenuItem },
            template: `
                <Menu>
                    <MenuItem index="item1" id="item1" disabled>Item 1 (Disabled)</MenuItem>
                    <MenuItem index="item2" id="item2">Item 2</MenuItem>
                    <MenuItem index="item3" id="item3">Item 3</MenuItem>
                </Menu>
            `,
        }, { attachTo: document.body })

        await nextTick()

        const item1 = wrapper.find('#item1')
        const item2 = wrapper.find('#item2')
        const item3 = wrapper.find('#item3')

        expect(item1.attributes('tabindex')).toBe('-1')
        expect(item2.attributes('tabindex')).toBe('0')
        expect(item3.attributes('tabindex')).toBe('-1')
    })

    it('dynamically reacts to props.disabled changes in keyboard navigation', async () => {
        const item2Disabled = ref(false)

        wrapper = mount({
            components: { Menu, MenuItem },
            setup() {
                return { item2Disabled }
            },
            template: `
                <Menu default-active="item1">
                    <MenuItem index="item1" id="item1">Item 1</MenuItem>
                    <MenuItem index="item2" id="item2" :disabled="item2Disabled">Item 2</MenuItem>
                    <MenuItem index="item3" id="item3">Item 3</MenuItem>
                </Menu>
            `,
        }, { attachTo: document.body })

        await nextTick()

        const item1 = wrapper.find('#item1')
        const item2 = wrapper.find('#item2')
        const item3 = wrapper.find('#item3')

        // 初始未禁用，ArrowDown 到 item2
        await item1.trigger('keydown', { key: 'ArrowDown' })
        await nextTick()
        expect(item2.attributes('tabindex')).toBe('0')

        // 动态修改 item2 为禁用
        item2Disabled.value = true
        await nextTick()
        await nextTick()

        // 回到 item1 再次按 ArrowDown，应跳过已禁用的 item2 直接到 item3
        await item1.trigger('keydown', { key: 'ArrowDown' })
        await nextTick()
        expect(item3.attributes('tabindex')).toBe('0')
    })

    it('skips disabled items during keyboard navigation', async () => {
        wrapper = mount({
            components: { Menu, MenuItem },
            template: `
                <Menu default-active="item1" mode="vertical">
                    <MenuItem index="item1" id="item1">Item 1</MenuItem>
                    <MenuItem index="item2" id="item2" disabled>Item 2 (Disabled)</MenuItem>
                    <MenuItem index="item3" id="item3">Item 3</MenuItem>
                </Menu>
            `,
        }, { attachTo: document.body })

        await nextTick()

        const item1 = wrapper.find('#item1')
        const item2 = wrapper.find('#item2')
        const item3 = wrapper.find('#item3')

        expect(item2.attributes('tabindex')).toBe('-1')

        await item1.trigger('keydown', { key: 'ArrowDown' })
        await nextTick()

        expect(item3.attributes('tabindex')).toBe('0')
    })

    it('navigates with ArrowRight and ArrowLeft in horizontal mode', async () => {
        wrapper = mount({
            components: { Menu, MenuItem },
            template: `
                <Menu default-active="item1" mode="horizontal">
                    <MenuItem index="item1" id="item1">Item 1</MenuItem>
                    <MenuItem index="item2" id="item2">Item 2</MenuItem>
                    <MenuItem index="item3" id="item3">Item 3</MenuItem>
                </Menu>
            `,
        }, { attachTo: document.body })

        await nextTick()

        const item1 = wrapper.find('#item1')
        const item2 = wrapper.find('#item2')

        await item1.trigger('keydown', { key: 'ArrowRight' })
        await nextTick()

        expect(item2.attributes('tabindex')).toBe('0')

        await item2.trigger('keydown', { key: 'ArrowLeft' })
        await nextTick()

        expect(item1.attributes('tabindex')).toBe('0')
    })

    it('jumps to first and last item with Home and End keys', async () => {
        wrapper = mount({
            components: { Menu, MenuItem },
            template: `
                <Menu default-active="item1">
                    <MenuItem index="item1" id="item1">Item 1</MenuItem>
                    <MenuItem index="item2" id="item2">Item 2</MenuItem>
                    <MenuItem index="item3" id="item3">Item 3</MenuItem>
                </Menu>
            `,
        }, { attachTo: document.body })

        await nextTick()

        const item1 = wrapper.find('#item1')
        const item3 = wrapper.find('#item3')

        await item1.trigger('keydown', { key: 'End' })
        await nextTick()

        expect(item3.attributes('tabindex')).toBe('0')

        await item3.trigger('keydown', { key: 'Home' })
        await nextTick()

        expect(item1.attributes('tabindex')).toBe('0')
    })

    it('handles submenu keyboard expand and child focus in vertical mode', async () => {
        wrapper = mount({
            components: { Menu, MenuItem, SubMenu },
            template: `
                <Menu default-active="item1" mode="vertical">
                    <MenuItem index="item1" id="item1">Item 1</MenuItem>
                    <SubMenu index="sub1" title="Sub 1" id="sub1">
                        <MenuItem index="sub1-1" id="sub1-1">Sub Item 1</MenuItem>
                    </SubMenu>
                </Menu>
            `,
        }, { attachTo: document.body })

        await nextTick()

        const subTrigger = wrapper.find('#sub1 [role="menuitem"]')
        expect(subTrigger.exists()).toBe(true)

        // ArrowRight 展开子菜单
        await subTrigger.trigger('keydown', { key: 'ArrowRight' })
        await nextTick()
        await nextTick()

        const subItem = wrapper.find('#sub1-1')
        expect(subItem.isVisible()).toBe(true)
        expect(subItem.attributes('tabindex')).toBe('0')

        // 子项 ArrowLeft 收起子菜单并返回父级 trigger
        await subItem.trigger('keydown', { key: 'ArrowLeft' })
        await nextTick()

        expect(subTrigger.attributes('tabindex')).toBe('0')
    })
})
