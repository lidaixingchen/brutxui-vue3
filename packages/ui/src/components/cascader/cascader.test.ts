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

    describe('trail highlighting', () => {
        it('applies trail style to parent nodes of selected path in single mode', async () => {
            wrapper = mount(Cascader, {
                ...localeProvide,
                props: { options, modelValue: ['zh', 'bj', 'hd'] },
                attachTo: document.body,
            })
            const vm = wrapper.vm as any
            vm.open = true
            await nextTick()

            // Column 0: activePath is empty, getOptionPath returns ['zh'] which is a prefix of the selection
            expect(vm.isOnSelectedTrail(options[0], 0)).toBe(true)
            expect(vm.isOnSelectedTrail(options[1], 0)).toBe(false)

            // Simulate user hovering 'zh' to expand column 1
            vm.handleMouseEnter(options[0], 0)
            await nextTick()
            expect(vm.isOnSelectedTrail(options[0]!.children![0], 1)).toBe(true)

            // Simulate user hovering 'bj' to expand column 2
            vm.handleMouseEnter(options[0]!.children![0], 1)
            await nextTick()
            expect(vm.isOnSelectedTrail(options[0]!.children![0]!.children![0], 2)).toBe(false)
        })

        it('does not apply trail when no value is selected', async () => {
            wrapper = mount(Cascader, {
                ...localeProvide,
                props: { options },
                attachTo: document.body,
            })
            const vm = wrapper.vm as any
            vm.open = true
            await nextTick()

            expect(vm.isOnSelectedTrail(options[0], 0)).toBe(false)
        })

        it('returns false immediately when modelValue is not an array in single mode', async () => {
            wrapper = mount(Cascader, {
                ...localeProvide,
                props: { options, modelValue: 'zh' as any },
                attachTo: document.body,
            })
            const vm = wrapper.vm as any
            vm.open = true
            await nextTick()

            expect(vm.isOnSelectedTrail(options[0], 0)).toBe(false)
        })

        it('applies trail to parent nodes in multiple mode', async () => {
            wrapper = mount(Cascader, {
                ...localeProvide,
                props: { options, multiple: true, modelValue: [['zh', 'bj', 'hd']] },
                attachTo: document.body,
            })
            const vm = wrapper.vm as any
            vm.open = true
            await nextTick()
            vm.activePath = ['zh', 'bj']
            await nextTick()

            expect(vm.isOnSelectedTrail(options[0], 0)).toBe(true)
            expect(vm.isOnSelectedTrail(options[0]!.children![0], 1)).toBe(true)
            expect(vm.isOnSelectedTrail(options[0]!.children![0]!.children![0], 2)).toBe(false)
            expect(vm.isOnSelectedTrail(options[1], 0)).toBe(false)
        })

        it('renders trail background class progressively as user navigates', async () => {
            wrapper = mount(Cascader, {
                ...localeProvide,
                props: { options, modelValue: ['zh', 'bj', 'hd'] },
                attachTo: document.body,
            })
            const vm = wrapper.vm as any
            vm.open = true
            await nextTick()

            // Only first column visible; 'zh' is on the selected trail, 'us' is not
            expect(vm.getItemClasses(options[0], 0)).toContain('brutal-primary/15')
            expect(vm.getItemClasses(options[1], 0)).not.toContain('brutal-primary')

            // After user navigates to column 2 (zh -> bj), trail and selected styles appear
            vm.activePath = ['zh', 'bj']
            await nextTick()
            expect(vm.getItemClasses(options[0]!.children![0], 1)).toContain('brutal-primary/15')
            expect(vm.getItemClasses(options[0]!.children![0]!.children![0], 2)).toContain('bg-brutal-primary')
            expect(vm.getItemClasses(options[0]!.children![0]!.children![0], 2)).not.toContain('brutal-primary/15')
        })
    })

    describe('multi-select checkbox', () => {
        it('renders Checkbox components in multiple mode using default variant', async () => {
            wrapper = mount(Cascader, {
                ...localeProvide,
                props: { options, multiple: true, modelValue: [] },
                attachTo: document.body,
            })
            const vm = wrapper.vm as any
            vm.open = true
            await nextTick()

            const checkbox = wrapper.findComponent({ name: 'Checkbox' })
            expect(checkbox.exists()).toBe(true)
            // Default variant green background comes from the Checkbox component itself;
            // Cascader should not override it with custom color classes.
            const checkboxClass = checkbox.classes().join(' ')
            expect(checkboxClass).not.toContain('data-[state=checked]:bg-brutal-bg')
            expect(checkboxClass).not.toContain('data-[state=checked]:text-brutal-success')
        })
    })

    describe('active path restoration on open', () => {
        it('restores activePath to modelValue path when opening dropdown in single mode', async () => {
            wrapper = mount(Cascader, {
                ...localeProvide,
                props: { options, modelValue: ['zh', 'bj', 'hd'] },
                attachTo: document.body,
            })
            const vm = wrapper.vm as any
            vm.open = true
            await nextTick()

            expect(vm.activePath).toEqual(['zh', 'bj', 'hd'])
            expect(vm.activeColumnIndex).toBe(2)
        })

        it('restores activePath to the first selected path when opening dropdown in multiple mode', async () => {
            wrapper = mount(Cascader, {
                ...localeProvide,
                props: { options, multiple: true, modelValue: [['zh', 'bj', 'hd']] },
                attachTo: document.body,
            })
            const vm = wrapper.vm as any
            vm.open = true
            await nextTick()

            expect(vm.activePath).toEqual(['zh', 'bj', 'hd'])
            expect(vm.activeColumnIndex).toBe(2)
        })
    })
})
