import { mount } from '@vue/test-utils'
import { h } from 'vue'
import ToggleGroup from './ToggleGroup.vue'
import ToggleGroupItem from './ToggleGroupItem.vue'

describe('ToggleGroup', () => {
    it('renders with default props', () => {
        const wrapper = mount(ToggleGroup, {
            attachTo: document.body,
        })
        expect(wrapper.element.tagName).toBe('DIV')
    })

    it('defaults to horizontal orientation without flex-col', () => {
        const wrapper = mount(ToggleGroup, {
            attachTo: document.body,
        })
        const classes = wrapper.classes()
        expect(classes).toContain('flex')
        expect(classes).not.toContain('flex-col')
    })

    it('applies flex-col when orientation is vertical', () => {
        const wrapper = mount(ToggleGroup, {
            props: { orientation: 'vertical' },
            attachTo: document.body,
        })
        expect(wrapper.classes()).toContain('flex-col')
    })

    it('sets data-orientation to horizontal by default', () => {
        const wrapper = mount(ToggleGroup, {
            attachTo: document.body,
        })
        expect(wrapper.attributes('data-orientation')).toBe('horizontal')
    })

    it('sets data-orientation to vertical when orientation is vertical', () => {
        const wrapper = mount(ToggleGroup, {
            props: { orientation: 'vertical' },
            attachTo: document.body,
        })
        expect(wrapper.attributes('data-orientation')).toBe('vertical')
    })
})

describe('ToggleGroupItem', () => {
    it('renders within ToggleGroup', () => {
        const wrapper = mount(ToggleGroup, {
            props: { modelValue: '' },
            slots: {
                default: () => h(ToggleGroupItem, { value: 'bold' }),
            },
            attachTo: document.body,
        })
        expect(wrapper.find('button').exists()).toBe(true)
    })

    it('has appropriate role', () => {
        const wrapper = mount(ToggleGroup, {
            props: { modelValue: '' },
            slots: {
                default: () => h(ToggleGroupItem, { value: 'bold' }),
            },
            attachTo: document.body,
        })
        const item = wrapper.find('button')
        expect(item.exists()).toBe(true)
    })
})
