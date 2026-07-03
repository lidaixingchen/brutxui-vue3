import { mount } from '@vue/test-utils'
import Transfer from './Transfer.vue'
import Button from '../button/Button.vue'
import Checkbox from '../checkbox/Checkbox.vue'

const mockData = [
    { key: 1, label: 'Item 1' },
    { key: 2, label: 'Item 2', disabled: true },
    { key: 3, label: 'Item 3' },
    { key: 4, label: 'Item 4' },
    { key: 5, label: 'Item 5' }
]

describe('Transfer', () => {
    it('renders correct initial layouts', () => {
        const wrapper = mount(Transfer, {
            props: {
                data: mockData,
                modelValue: [4, 5],
                titles: ['Left Title', 'Right Title']
            },
            attachTo: document.body
        })

        // 检查标题是否正确渲染
        expect(wrapper.text()).toContain('Left Title')
        expect(wrapper.text()).toContain('Right Title')

        // 检查左右列表数量
        // 源列表（左侧）：应该是 key 为 1, 2, 3，共 3 个，其中 1 个 disabled
        // 目标列表（右侧）：应该是 key 为 4, 5，共 2 个
        expect(wrapper.text()).toContain('0/3') // 左侧初始选中 0，总数 3
        expect(wrapper.text()).toContain('0/2') // 右侧初始选中 0，总数 2
    })

    it('handles item selection and all-selection', async () => {
        const wrapper = mount(Transfer, {
            props: {
                data: mockData,
                modelValue: [4, 5]
            },
            attachTo: document.body
        })

        // 找到左侧的项并点击
        // 列表渲染里，源列表包含 Item 1 和 Item 3 (Item 2 禁用)
        const items = wrapper.findAll('.cursor-pointer')
        // 注意：中间按钮是 Button，头部有 checkbox，我们需要找到列表项的点击区域
        const item1 = items.find(w => w.text().includes('Item 1'))
        expect(item1).toBeDefined()
        await item1!.trigger('click')

        // 此时左侧选中数应该变成 1
        expect(wrapper.text()).toContain('1/3')

        // 点击全选
        // 左侧面板的头部 checkbox
        const leftPanel = wrapper.findAll('.flex-col')[0]
        const leftAllCheckbox = leftPanel.findComponent(Checkbox)
        expect(leftAllCheckbox.exists()).toBe(true)

        // 模拟全选改变
        await leftAllCheckbox.vm.$emit('update:checked', true)
        // 启用项是 Item 1 和 Item 3（共 2 个），被选中的 key 应为 [1, 3]
        expect(wrapper.text()).toContain('2/3')
    })

    it('moves items from left to right', async () => {
        const wrapper = mount(Transfer, {
            props: {
                data: mockData,
                modelValue: [4, 5]
            },
            attachTo: document.body
        })

        // 模拟选中 Item 1 (key: 1)
        const items = wrapper.findAll('.cursor-pointer')
        const item1 = items.find(w => w.text().includes('Item 1'))
        await item1!.trigger('click')

        // 找到右移按钮（第一个按钮，指向右边）
        const buttons = wrapper.findAllComponents(Button)
        const rightButton = buttons[0] // 应该对应 addToRight
        expect(rightButton.exists()).toBe(true)
        expect(rightButton.props('disabled')).toBe(false)

        await rightButton.trigger('click')

        // 验证触发的 update:modelValue 事件
        const updateEvents = wrapper.emitted('update:modelValue')
        expect(updateEvents).toBeTruthy()
        expect(updateEvents![0][0]).toEqual([4, 5, 1])

        // 验证 change 事件
        const changeEvents = wrapper.emitted('change')
        expect(changeEvents).toBeTruthy()
        expect(changeEvents![0]).toEqual([[4, 5, 1], 'right', [1]])
    })

    it('moves items from right to left', async () => {
        const wrapper = mount(Transfer, {
            props: {
                data: mockData,
                modelValue: [4, 5]
            },
            attachTo: document.body
        })

        // 模拟选中 Item 4 (key: 4，在右侧)
        const items = wrapper.findAll('.cursor-pointer')
        const item4 = items.find(w => w.text().includes('Item 4'))
        expect(item4).toBeDefined()
        await item4!.trigger('click')

        // 应该右侧被选中 1 个
        expect(wrapper.text()).toContain('1/2')

        // 找到左移按钮（第二个按钮，指向左边）
        const buttons = wrapper.findAllComponents(Button)
        const leftButton = buttons[1] // 应该对应 addToLeft
        expect(leftButton.exists()).toBe(true)
        expect(leftButton.props('disabled')).toBe(false)

        await leftButton.trigger('click')

        // 验证事件
        const updateEvents = wrapper.emitted('update:modelValue')
        expect(updateEvents).toBeTruthy()
        expect(updateEvents![0][0]).toEqual([5])

        const changeEvents = wrapper.emitted('change')
        expect(changeEvents).toBeTruthy()
        expect(changeEvents![0]).toEqual([[5], 'left', [4]])
    })

    it('filters items correctly when filterable is true', async () => {
        const wrapper = mount(Transfer, {
            props: {
                data: mockData,
                modelValue: [4, 5],
                filterable: true
            },
            attachTo: document.body
        })

        // 查找 input
        const inputs = wrapper.findAll('input')
        expect(inputs.length).toBeGreaterThanOrEqual(2)

        // 模拟在左侧输入搜索 'Item 3'
        const leftInput = inputs[0]
        await leftInput.setValue('Item 3')

        // 此时源列表中应该只有 'Item 3'，'Item 1' 应该被过滤掉
        expect(wrapper.text()).toContain('Item 3')
        expect(wrapper.text()).not.toContain('Item 1')
    })
})
