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

    it('emits update:modelValue with string in single mode', async () => {
        const wrapper = mount(ToggleGroup, {
            props: { type: 'single', modelValue: 'a' },
            slots: {
                default: () => [
                    h(ToggleGroupItem, { value: 'a' }, () => 'A'),
                    h(ToggleGroupItem, { value: 'b' }, () => 'B'),
                ],
            },
            attachTo: document.body,
        })
        const buttons = wrapper.findAll('button')
        await buttons[1].trigger('click')
        expect(wrapper.emitted('update:modelValue')![0]).toEqual(['b'])
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

    it('inherits variant and size from ToggleGroup context', () => {
        const wrapper = mount(ToggleGroup, {
            props: { variant: 'outline', size: 'lg', modelValue: '' },
            slots: {
                default: () => h(ToggleGroupItem, { value: 'bold' }),
            },
            attachTo: document.body,
        })
        const item = wrapper.find('button')
        expect(item.classes()).toContain('h-12')
        expect(item.classes()).toContain('data-[state=off]:bg-transparent')
    })

    it('allows item to override group variant and size', () => {
        const wrapper = mount(ToggleGroup, {
            props: { variant: 'outline', size: 'lg', modelValue: '' },
            slots: {
                default: () => h(ToggleGroupItem, { value: 'bold', variant: 'default', size: 'sm' }),
            },
            attachTo: document.body,
        })
        const item = wrapper.find('button')
        expect(item.classes()).toContain('h-8')
    })

    it('inherits disabled state from ToggleGroup', () => {
        const wrapper = mount(ToggleGroup, {
            props: { disabled: true, modelValue: '' },
            slots: {
                default: () => h(ToggleGroupItem, { value: 'bold' }),
            },
            attachTo: document.body,
        })
        const item = wrapper.find('button')
        expect(item.attributes('disabled')).toBeDefined()
    })
})
