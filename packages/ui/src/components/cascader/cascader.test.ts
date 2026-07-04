import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Cascader from './Cascader.vue'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import type { CascaderOption } from './cascader-types'

const localeProvide = { global: { provide: { [LOCALE_INJECTION_KEY]: en } } }

const options: CascaderOption[] = [
    {
        value: 'zh',
        label: 'China',
        children: [
            {
                value: 'bj',
                label: 'Beijing',
                children: [
                    { value: 'hd', label: 'Haidian' },
                    { value: 'cy', label: 'Chaoyang' },
                ]
            },
            {
                value: 'sh',
                label: 'Shanghai',
            }
        ]
    },
    {
        value: 'us',
        label: 'USA',
        children: [
            { value: 'ny', label: 'New York' },
            { value: 'ca', label: 'California' },
        ]
    }
]

let wrapper: ReturnType<typeof mount> | null = null

afterEach(() => {
    if (wrapper) {
        wrapper.unmount()
        wrapper = null
    }
    document.body.textContent = ''
})

describe('Cascader', () => {
    it('renders with options prop', () => {
        wrapper = mount(Cascader, {
            ...localeProvide,
            props: { options },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.exists()).toBe(true)
    })

    it('shows placeholder text', () => {
        wrapper = mount(Cascader, {
            ...localeProvide,
            props: { options, placeholder: 'Pick a path...' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('Pick a path...')
    })

    it('shows selected path labels in single mode', () => {
        wrapper = mount(Cascader, {
            ...localeProvide,
            props: { options, modelValue: ['zh', 'bj', 'hd'] },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('China / Beijing / Haidian')
    })

    it('supports clearable in single mode', async () => {
        wrapper = mount(Cascader, {
            ...localeProvide,
            props: { options, modelValue: ['zh', 'bj', 'hd'], clearable: true },
            attachTo: document.body,
        })
        const clearButton = wrapper.find('[role="button"]')
        expect(clearButton.exists()).toBe(true)
        await clearButton.trigger('click')
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual([])
    })

    it('supports keyboard navigation - Escape to close', async () => {
        wrapper = mount(Cascader, {
            ...localeProvide,
            props: { options },
            attachTo: document.body,
        })
        ;(wrapper.vm as any).open = true
        await nextTick()
        expect((wrapper.vm as any).open).toBe(true)

        const trigger = wrapper.find('[role="combobox"]')
        await trigger.trigger('keydown', { key: 'Escape' })
        await nextTick()
        expect((wrapper.vm as any).open).toBe(false)
    })

    it('supports multiple mode checkbox selection and toggleCheckbox', async () => {
        wrapper = mount(Cascader, {
            ...localeProvide,
            props: { options, multiple: true, modelValue: [] },
            attachTo: document.body,
        })
        
        const vm = wrapper.vm as any
        const optionZh = options[0]
        const optionBj = optionZh.children![0]

        // 1. Select option using toggleCheckbox with checked=true (with activePath populated as in real interactions)
        vm.activePath = ['zh', 'bj']
        vm.toggleCheckbox(optionBj, 1, true)
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual([['zh', 'bj', 'hd'], ['zh', 'bj', 'cy']])

        // 2. Deselect option using toggleCheckbox with checked=false
        wrapper.setProps({ modelValue: [['zh', 'bj', 'hd'], ['zh', 'bj', 'cy']] })
        await nextTick()
        vm.activePath = ['zh', 'bj']
        vm.toggleCheckbox(optionBj, 1, false)
        expect(wrapper.emitted('update:modelValue')?.[1]?.[0]).toEqual([])
    })
})
