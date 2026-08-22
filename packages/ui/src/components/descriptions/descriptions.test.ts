import { mount } from '@vue/test-utils'
import { h } from 'vue'
import Descriptions from './Descriptions.vue'
import DescriptionsItem from './DescriptionsItem.vue'

describe('Descriptions', () => {
    it('renders title correctly', () => {
        const wrapper = mount(Descriptions, {
            props: {
                title: 'User Info',
            },
        })
        expect(wrapper.find('h3').text()).toBe('User Info')
    })

    it('renders slot title correctly', () => {
        const wrapper = mount(Descriptions, {
            slots: {
                title: h('h3', { class: 'custom-title' }, 'Custom Title'),
            },
        })
        expect(wrapper.find('.custom-title').text()).toBe('Custom Title')
    })

    it('renders horizontal layout with border correctly (column * 2 grid columns)', () => {
        const wrapper = mount(Descriptions, {
            props: {
                border: true,
                direction: 'horizontal',
                column: 3,
            },
            slots: {
                default: [
                    h(DescriptionsItem, { label: 'Name' }, () => 'John'),
                    h(DescriptionsItem, { label: 'Age' }, () => '30'),
                ],
            },
        })

        // Grid template columns should be repeat(6, 1fr)
        const grid = wrapper.find('.grid')
        expect(grid.attributes('style')).toContain('grid-template-columns: repeat(6, 1fr)')

        // span<=1 条目是单个容器（占两轨），内部 label+value 垂直对齐
        const container = wrapper.find('.grid > div')
        expect(container.classes()).toContain('flex')
        expect(container.attributes('style')).toContain('grid-column: span 2')
        const cells = container.findAll('div')
        expect(cells[0].classes()).toContain('flex')
        expect(cells[0].classes()).toContain('items-center')
        expect(cells[1].classes()).toContain('flex')
        expect(cells[1].classes()).toContain('items-center')
    })

    it('normalizes invalid column values', async () => {
        const wrapper = mount(Descriptions, {
            props: {
                border: true,
                direction: 'horizontal',
                column: 0,
            },
            slots: {
                default: h(DescriptionsItem, { label: 'Name' }, () => 'John'),
            },
        })
        expect(wrapper.find('.grid').attributes('style')).toContain('grid-template-columns: repeat(2, 1fr)')
        await wrapper.setProps({ column: 2.5 })
        expect(wrapper.find('.grid').attributes('style')).toContain('grid-template-columns: repeat(4, 1fr)')
    })

    it('does not render title container when title slot is empty', () => {
        const wrapper = mount(Descriptions, {
            slots: {
                title: () => [],
            },
        })
        expect(wrapper.find('.mb-4').exists()).toBe(false)
    })

    it('applies item class once on the wrapper container in horizontal border mode', () => {
        const wrapper = mount(Descriptions, {
            props: {
                border: true,
                direction: 'horizontal',
                column: 3,
            },
            slots: {
                default: [
                    h(DescriptionsItem, { label: 'Name', class: 'custom-item' }, () => 'John'),
                    h(DescriptionsItem, { label: 'Addr', span: 2, class: 'custom-item' }, () => 'China'),
                ],
            },
        })
        const containers = wrapper.findAll('.grid > div')
        expect(containers).toHaveLength(2)
        containers.forEach((container) => {
            expect(container.classes()).toContain('custom-item')
        })
        // class 只应用在容器上，内部 label/value 不再重复携带
        const innerCells = containers[0].findAll('div')
        innerCells.forEach((cell) => {
            expect(cell.classes()).not.toContain('custom-item')
        })
    })

    it('applies labelWidth only when set to a meaningful value', () => {
        const wrapper = mount(Descriptions, {
            props: {
                border: true,
                direction: 'horizontal',
                column: 3,
            },
            slots: {
                default: [
                    h(DescriptionsItem, { label: 'Name', labelWidth: 120 }, () => 'John'),
                    h(DescriptionsItem, { label: 'Age', labelWidth: 0 }, () => '30'),
                ],
            },
        })
        const containers = wrapper.findAll('.grid > div')
        const firstLabel = containers[0].findAll('div')[0]
        expect(firstLabel.attributes('style')).toContain('width: 120px')
        // 数字 0 是有效宽度（width: 0px），空字符串才是未设置
        const secondLabel = containers[1].findAll('div')[0]
        expect(secondLabel.attributes('style')).toContain('width: 0px')
    })

    it('normalizes invalid span values in vertical and horizontal border modes', async () => {
        const wrapper = mount(Descriptions, {
            props: {
                border: true,
                direction: 'vertical',
                column: 4,
            },
            slots: {
                default: h(DescriptionsItem, { label: 'CPU', span: 1.5 }, () => '4 Core'),
            },
        })
        // span 1.5 → floor 归一化为 1 → 垂直模式不输出跨列样式
        expect(wrapper.find('.grid > div').attributes('style')).toBeUndefined()
        await wrapper.setProps({ direction: 'horizontal' })
        // 水平有边框模式：归一化 span=1 → 容器占 2 轨
        expect(wrapper.find('.grid > div').attributes('style')).toContain('grid-column: span 2')
    })

    it('renders horizontal border span>1 item as a single merged container', () => {
        const wrapper = mount(Descriptions, {
            props: {
                border: true,
                direction: 'horizontal',
                column: 3,
            },
            slots: {
                default: h(DescriptionsItem, { label: 'Address', span: 2 }, () => 'China'),
            },
        })

        const container = wrapper.find('.grid > div')
        expect(container.attributes('style')).toContain('grid-column: span 4')
        expect(container.classes()).toContain('flex')
        const cells = container.findAll('div')
        expect(cells[0].text()).toBe('Address')
        expect(cells[0].classes()).toContain('w-1/2')
        expect(cells[1].text()).toBe('China')
        expect(cells[1].classes()).toContain('flex-1')
    })

    it('renders vertical layout with border correctly (column grid columns)', () => {
        const wrapper = mount(Descriptions, {
            props: {
                border: true,
                direction: 'vertical',
                column: 4,
            },
            slots: {
                default: [
                    h(DescriptionsItem, { label: 'CPU' }, () => '4 Core'),
                    h(DescriptionsItem, { label: 'Memory' }, () => '16 GB'),
                ],
            },
        })

        const grid = wrapper.find('.grid')
        // Under vertical border mode, grid template columns should be repeat(4, 1fr)
        expect(grid.attributes('style')).toContain('grid-template-columns: repeat(4, 1fr)')
        expect(grid.classes()).not.toContain('grid-cols-1')
    })

    it('renders non-border layout correctly (column grid columns)', () => {
        const wrapper = mount(Descriptions, {
            props: {
                border: false,
                column: 3,
            },
            slots: {
                default: [
                    h(DescriptionsItem, { label: 'Name' }, () => 'John'),
                ],
            },
        })

        const grid = wrapper.find('.grid')
        expect(grid.attributes('style')).toContain('grid-template-columns: repeat(3, 1fr)')
    })
})

describe('Descriptions 档案质感', () => {
    it('带边框模式下 label 列叠加点阵纹理', () => {
        const wrapper = mount(Descriptions, {
            props: { border: true },
            slots: {
                default: () => h(DescriptionsItem, { label: 'Module' }, { default: () => 'brutx-ui-vue' }),
            },
        })
        expect(wrapper.html()).toContain('bg-pattern-dots')
    })

    it('stamp 插槽渲染于右上角悬浮层', () => {
        const wrapper = mount(Descriptions, {
            props: { border: true },
            slots: {
                default: () => h(DescriptionsItem, { label: 'Status' }, { default: () => 'active' }),
                stamp: () => h('span', { class: 'stamp-mark' }, '[ CONFIDENTIAL ]'),
            },
        })
        const slotWrap = wrapper.find('.absolute.right-4')
        expect(slotWrap.exists()).toBe(true)
        expect(slotWrap.find('.stamp-mark').exists()).toBe(true)
    })

    it('未提供 stamp 插槽时不渲染悬浮层', () => {
        const wrapper = mount(Descriptions, {
            props: { border: true },
            slots: {
                default: () => h(DescriptionsItem, { label: 'Status' }, { default: () => 'active' }),
            },
        })
        expect(wrapper.find('.absolute.right-4').exists()).toBe(false)
    })
})
