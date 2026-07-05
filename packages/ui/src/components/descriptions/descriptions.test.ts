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

        // Check if value cells have flex and items-center classes for vertical alignment
        const cells = wrapper.findAll('.grid > div')
        expect(cells[1].classes()).toContain('flex')
        expect(cells[1].classes()).toContain('items-center')
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
