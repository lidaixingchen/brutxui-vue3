import { flushPromises, mount } from '@vue/test-utils'
import { h, reactive } from 'vue'
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

    it('emits empty string when deselecting in single mode', async () => {
        const wrapper = mount(ToggleGroup, {
            props: { type: 'single', modelValue: 'bold' },
            slots: {
                default: () => h(ToggleGroupItem, { value: 'bold' }),
            },
            attachTo: document.body,
        })
        await wrapper.find('button').trigger('click')
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([''])
    })

    it('emits string array when selecting and deselecting in multiple mode', async () => {
        const wrapper = mount(ToggleGroup, {
            props: { type: 'multiple', modelValue: ['bold'] },
            slots: {
                default: () => [
                    h(ToggleGroupItem, { value: 'bold' }),
                    h(ToggleGroupItem, { value: 'italic' }),
                ],
            },
            attachTo: document.body,
        })
        const buttons = wrapper.findAll('button')
        await buttons[1].trigger('click')
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['bold', 'italic']])

        await buttons[0].trigger('click')
        expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([[]])
    })

    it('omits a disabled required group and restores it when enabled', async () => {
        const state = reactive({ disabled: true, modelValue: '' })
        const wrapper = mount({
            render: () => h('form', [
                h(ToggleGroup, {
                    type: 'single',
                    modelValue: state.modelValue,
                    name: 'alignment',
                    required: true,
                    disabled: state.disabled,
                    'onUpdate:modelValue': (value: string | string[]) => { state.modelValue = value as string },
                }, {
                    default: () => h(ToggleGroupItem, { value: 'center' }, () => 'Center'),
                }),
            ]),
        }, { attachTo: document.body })
        const form = wrapper.get('form').element as HTMLFormElement

        expect(wrapper.get('button').attributes('disabled')).toBeDefined()
        expect(new FormData(form).has('alignment')).toBe(false)
        expect(form.checkValidity()).toBe(true)

        state.disabled = false
        await flushPromises()
        expect(new FormData(form).get('alignment')).toBe('')
        expect(form.checkValidity()).toBe(false)

        await wrapper.get('button').trigger('click')
        await flushPromises()
        expect(new FormData(form).get('alignment')).toBe('center')
        expect(form.checkValidity()).toBe(true)

        state.disabled = true
        await flushPromises()
        expect(new FormData(form).has('alignment')).toBe(false)
        expect(form.checkValidity()).toBe(true)
        wrapper.unmount()
    })

    it('serializes single and multiple group values through the group name', () => {
        const single = mount({
            render: () => h('form', [h(ToggleGroup, {
                type: 'single',
                modelValue: 'center',
                name: 'alignment',
            }, { default: () => h(ToggleGroupItem, { value: 'center' }, () => 'Center') })]),
        }, { attachTo: document.body })
        const singleForm = single.get('form').element as HTMLFormElement
        expect(new FormData(singleForm).get('alignment')).toBe('center')
        single.unmount()

        const multiple = mount({
            render: () => h('form', [h(ToggleGroup, {
                type: 'multiple',
                modelValue: ['bold', 'italic'],
                name: 'styles',
            }, { default: () => [
                h(ToggleGroupItem, { value: 'bold' }, () => 'Bold'),
                h(ToggleGroupItem, { value: 'italic' }, () => 'Italic'),
            ] })]),
        }, { attachTo: document.body })
        const multipleForm = multiple.get('form').element as HTMLFormElement
        const data = new FormData(multipleForm)
        expect(data.get('styles[0]')).toBe('bold')
        expect(data.get('styles[1]')).toBe('italic')
        multiple.unmount()
    })
})
