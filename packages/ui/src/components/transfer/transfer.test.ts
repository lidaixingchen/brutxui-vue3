import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Transfer from './Transfer.vue'
import Button from '../button/Button.vue'
import Card from '../card/Card.vue'
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

    it('projects pointer and visible checkbox focus onto rows independently of selection', async () => {
        const wrapper = mount(Transfer, {
            props: { data: mockData, modelValue: [4, 5] },
            attachTo: document.body,
        })
        const rows = wrapper.findAll('.cursor-pointer').filter(row => row.text().includes('Item'))
        const item1 = rows.find(row => row.text().includes('Item 1'))!
        const disabledItem = rows.find(row => row.text().includes('Item 2'))!

        await item1.trigger('mouseenter')
        expect(item1.attributes('data-highlighted')).toBe('')
        await item1.trigger('mouseleave')
        expect(item1.attributes('data-highlighted')).toBeUndefined()

        await item1.trigger('click')
        expect(item1.findComponent(Checkbox).props('checked')).toBe(true)
        expect(item1.attributes('data-highlighted')).toBeUndefined()

        const visibleTarget = document.createElement('button')
        Object.defineProperty(visibleTarget, 'matches', {
            value: (selector: string) => selector === ':focus-visible',
        })
        item1.element.appendChild(visibleTarget)
        visibleTarget.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
        await nextTick()
        expect(item1.attributes('data-focus-visible')).toBe('')
        expect(item1.attributes('data-highlighted')).toBe('')

        visibleTarget.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
        await nextTick()
        expect(item1.attributes('data-focus-visible')).toBeUndefined()
        expect(item1.attributes('data-highlighted')).toBeUndefined()
        expect(disabledItem.attributes('data-disabled')).toBe('')
        wrapper.unmount()
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

    it('shows panel totals and moves all checked items while filtering either panel', async () => {
        const wrapper = mount(Transfer, {
            props: {
                data: mockData,
                modelValue: [4, 5],
                filterable: true
            },
            attachTo: document.body
        })

        const [leftPanel, rightPanel] = wrapper.findAllComponents(Card)
        const rows = (panel: typeof leftPanel) => panel.findAll('[data-slot="transfer-item"]')
        const rowLabels = (panel: typeof leftPanel) => rows(panel).map(row => row.get(':scope > span').text())
        const totals = () => wrapper.findAll('span').map(span => span.text()).filter(text => /^\d+\/\d+$/.test(text))
        const leftInput = leftPanel.get('input')
        const rightInput = rightPanel.get('input')

        await rows(leftPanel)[0].trigger('click')
        await rows(leftPanel)[2].trigger('click')
        await leftInput.setValue('Item 1')
        expect(rowLabels(leftPanel)).toEqual(['Item 1'])
        expect(totals()).toEqual(['2/3', '0/2'])

        await leftInput.setValue('No matches')
        expect(rowLabels(leftPanel)).toEqual([])
        expect(totals()).toEqual(['2/3', '0/2'])
        await leftInput.setValue('')
        expect(rowLabels(leftPanel)).toEqual(['Item 1', 'Item 2', 'Item 3'])
        expect(totals()).toEqual(['2/3', '0/2'])
        await leftInput.setValue('Item 1')

        const moveRight = wrapper.get('button[aria-label="Move selected to right"]')
        expect(moveRight.attributes('disabled')).toBeUndefined()
        await moveRight.trigger('click')
        expect(wrapper.emitted('change')?.at(-1)).toEqual([[4, 5, 1, 3], 'right', [1, 3]])
        await wrapper.setProps({ modelValue: [4, 5, 1, 3] })
        expect(totals()).toEqual(['0/1', '0/4'])

        await rows(rightPanel)[0].trigger('click')
        await rows(rightPanel)[1].trigger('click')
        await rightInput.setValue('Item 5')
        expect(rowLabels(rightPanel)).toEqual(['Item 5'])
        expect(totals()).toEqual(['0/1', '2/4'])

        const moveLeft = wrapper.get('button[aria-label="Move selected to left"]')
        expect(moveLeft.attributes('disabled')).toBeUndefined()
        await moveLeft.trigger('click')
        expect(wrapper.emitted('change')?.at(-1)).toEqual([[1, 3], 'left', [4, 5]])
        await wrapper.setProps({ modelValue: [1, 3], data: mockData.filter(item => item.key !== 3) })
        expect(rowLabels(rightPanel)).toEqual([])
        expect(totals()).toEqual(['0/3', '0/1'])
        wrapper.unmount()
    })

    it('removes a disabled left selection and blocks an empty move', async () => {
        const wrapper = mount(Transfer, {
            props: {
                data: [
                    { key: 1, label: 'Item 1' },
                    { key: 2, label: 'Item 2' },
                ],
                modelValue: [],
            },
            attachTo: document.body
        })

        // 选中 Item 1
        const items = wrapper.findAll('.cursor-pointer')
        const item1 = items.find(w => w.text().includes('Item 1'))
        await item1!.trigger('click')
        expect(wrapper.text()).toContain('1/2')

        // 数据更新使 Item 1 变为 disabled（选中态残留，keysToMove 会把它过滤掉）
        await wrapper.setProps({
            data: [
                { key: 1, label: 'Item 1', disabled: true },
                { key: 2, label: 'Item 2' },
            ],
        })

        expect(wrapper.text()).toContain('0/2')
        const disabledCheckbox = wrapper.findAllComponents(Checkbox).find(checkbox => checkbox.props('disabled'))
        expect(disabledCheckbox?.props('checked')).toBe(false)
        const buttons = wrapper.findAllComponents(Button)
        expect(buttons[0].props('disabled')).toBe(true)
        await buttons[0].trigger('click')
        expect(wrapper.text()).toContain('0/2')
        expect(wrapper.emitted('update:modelValue')).toBeUndefined()
        expect(wrapper.emitted('change')).toBeUndefined()

        await wrapper.setProps({
            data: [
                { key: 1, label: 'Item 1' },
                { key: 2, label: 'Item 2' },
            ],
        })
        expect(wrapper.text()).toContain('0/2')
        expect(buttons[0].props('disabled')).toBe(true)
    })

    it('removes a disabled right selection and blocks an empty move', async () => {
        const wrapper = mount(Transfer, {
            props: {
                data: [
                    { key: 1, label: 'Item 1' },
                    { key: 2, label: 'Item 2' },
                ],
                modelValue: [1, 2],
            },
            attachTo: document.body
        })

        // 右侧面板选中 Item 1
        const items = wrapper.findAll('.cursor-pointer')
        const item1 = items.find(w => w.text().includes('Item 1'))
        await item1!.trigger('click')
        expect(wrapper.text()).toContain('1/2')

        // Item 1 变为 disabled
        await wrapper.setProps({
            data: [
                { key: 1, label: 'Item 1', disabled: true },
                { key: 2, label: 'Item 2' },
            ],
        })

        expect(wrapper.text()).toContain('0/2')
        const disabledCheckbox = wrapper.findAllComponents(Checkbox).find(checkbox => checkbox.props('disabled'))
        expect(disabledCheckbox?.props('checked')).toBe(false)
        const buttons = wrapper.findAllComponents(Button)
        expect(buttons[1].props('disabled')).toBe(true)
        await buttons[1].trigger('click')
        expect(wrapper.text()).toContain('0/2')
        expect(wrapper.emitted('update:modelValue')).toBeUndefined()
        expect(wrapper.emitted('change')).toBeUndefined()

        await wrapper.setProps({
            data: [
                { key: 1, label: 'Item 1' },
                { key: 2, label: 'Item 2' },
            ],
        })
        expect(wrapper.text()).toContain('0/2')
        expect(buttons[1].props('disabled')).toBe(true)
    })

    it('deduplicates duplicate keys in modelValue in right panel', () => {
        const wrapper = mount(Transfer, {
            props: {
                data: mockData,
                modelValue: [4, 4, 5, 5],
            },
            attachTo: document.body,
        })
        const items = wrapper.findAll('.cursor-pointer')
        const item4List = items.filter(w => w.text().includes('Item 4'))
        expect(item4List.length).toBe(1)
        expect(wrapper.text()).toContain('0/2')
    })
})
