import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
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
        const trigger = wrapper.find('[role="combobox"]')
        expect(wrapper.find('[role="button"]').exists()).toBe(false)

        await trigger.trigger('mouseenter')
        await nextTick()

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

    it('invalidates leaf cache when options mutate in place', async () => {
        // 父组件原地变更（不改 options 引用）时，deep watch 应清空叶子缓存，
        // 否则新加入的叶子不会计入勾选统计
        const optsRef = ref<CascaderOption[]>([
            { value: 'p', label: 'P', children: [{ value: 'a', label: 'A' }] },
        ])
        wrapper = mount(Cascader, {
            ...localeProvide,
            props: { options: optsRef.value, multiple: true, modelValue: [] },
            attachTo: document.body,
        })
        const vm = wrapper.vm as any
        vm.activePath = ['p']

        // 首次计算并缓存 'p' 的叶子集合（此时只有 'a'）
        expect(vm.getOptionCheckState(optsRef.value[0], 0)).toBe('unchecked')

        // 原地 push 新叶子（引用不变），deep watch 应在 nextTick 后清空缓存
        optsRef.value[0].children!.push({ value: 'b', label: 'B' })
        await nextTick()

        vm.toggleCheckbox(optsRef.value[0], 0, true)
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual([['p', 'a'], ['p', 'b']])
    })

    it('computes correct leaf paths when an option subtree is shared across parents', async () => {
        // 同一 option 对象引用挂在两个父节点下：缓存若含父路径会串数据，
        // 应按当前父路径拼接出各自的完整叶子路径
        const sharedSubtree: CascaderOption[] = [
            { value: 'mid', label: 'Mid', children: [{ value: 'leaf', label: 'Leaf' }] },
        ]
        const opts: CascaderOption[] = [
            { value: 'p1', label: 'P1', children: sharedSubtree },
            { value: 'p2', label: 'P2', children: sharedSubtree },
        ]
        wrapper = mount(Cascader, {
            ...localeProvide,
            props: { options: opts, multiple: true, modelValue: [] },
            attachTo: document.body,
        })
        const vm = wrapper.vm as any

        vm.activePath = ['p1', 'mid']
        vm.toggleCheckbox(opts[0]!.children![0], 1, true)
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual([['p1', 'mid', 'leaf']])

        vm.activePath = ['p2', 'mid']
        vm.toggleCheckbox(opts[1]!.children![0], 1, true)
        expect(wrapper.emitted('update:modelValue')?.[1]?.[0]).toEqual([['p2', 'mid', 'leaf']])
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
            // Default variant 的绿色选中背景与匹配前景色都来自 Checkbox 组件自身；
            // Cascader 不应以自定义颜色类覆盖它们。
            const checkboxClass = checkbox.classes().join(' ')
            expect(checkboxClass).toContain('data-[state=checked]:bg-brutal-success')
            expect(checkboxClass).toContain('data-[state=checked]:text-brutal-success-foreground')
            expect(checkboxClass).not.toContain('data-[state=checked]:bg-brutal-bg')
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

        it('clamps activeColumnIndex when the preselected middle node is missing from options', async () => {
            // 预选路径中间节点失效时，columns 实际列数少于 valPath 长度：
            // activeColumnIndex 应 clamp 到最后一列（而非指向不存在的列），
            // 且 'nonexistent' 不在该列选项中，activeItemIndex 应为 -1（无高亮）。
            wrapper = mount(Cascader, {
                ...localeProvide,
                props: { options, modelValue: ['zh', 'nonexistent', 'hd'] },
                attachTo: document.body,
            })
            const vm = wrapper.vm as any
            vm.open = true
            await nextTick()

            expect(vm.activePath).toEqual(['zh', 'nonexistent', 'hd'])
            // columns = [options, zh.children]，实际最后一列索引为 1
            expect(vm.activeColumnIndex).toBe(1)
            // 'nonexistent' 不在 columns[1]（zh 的子选项 bj/sh）中
            expect(vm.activeItemIndex).toBe(-1)
        })

        it('keeps selected style when the selected item is also active', async () => {
            // 选中项同时处于 active 状态时，应固定显示 selected 高亮（bg-brutal-primary），
            // 不叠加 active 的 bg-brutal-muted，避免背景色由样式表顺序决定
            wrapper = mount(Cascader, {
                ...localeProvide,
                props: { options, modelValue: ['zh', 'bj', 'hd'] },
                attachTo: document.body,
            })
            const vm = wrapper.vm as any
            vm.open = true
            await nextTick()

            vm.activePath = ['zh', 'bj', 'hd']
            vm.activeColumnIndex = 2
            await nextTick()

            const classes = vm.getItemClasses(options[0]!.children![0]!.children![0], 2)
            expect(classes).toContain('bg-brutal-primary')
            expect(classes).not.toContain('bg-brutal-muted')
        })
    })

    describe('keyboard navigation and disabled options', () => {
        it('does not preset active item when opening without a value', async () => {
            // 无选中值时 activeItemIndex 应为 -1：实际焦点在触发按钮上，
            // aria-activedescendant 应保持 undefined，直到用户真正开始导航
            wrapper = mount(Cascader, {
                ...localeProvide,
                props: { options },
                attachTo: document.body,
            })
            const vm = wrapper.vm as any
            vm.open = true
            await nextTick()

            expect(vm.activeItemIndex).toBe(-1)
        })

        it('skips disabled items during ArrowDown/ArrowUp navigation', async () => {
            const withDisabled: CascaderOption[] = [
                { value: 'a', label: 'A' },
                { value: 'b', label: 'B', disabled: true },
                { value: 'c', label: 'C' },
            ]
            wrapper = mount(Cascader, {
                ...localeProvide,
                props: { options: withDisabled },
                attachTo: document.body,
            })
            const vm = wrapper.vm as any
            vm.open = true
            await nextTick()
            vm.activeColumnIndex = 0
            vm.activeItemIndex = -1

            // 直接调用 handleKeyDown：happy-dom 中 trigger('keydown') 会触发 reka 的
            // focusOutside dismiss（测试环境假象），绕过以聚焦于导航逻辑本身
            const key = (k: string) => ({ key: k, preventDefault: () => {} }) as any

            // 从 -1 起 ArrowDown 落到第一个非 disabled 项
            vm.handleKeyDown(key('ArrowDown'))
            expect(vm.activeItemIndex).toBe(0)

            // 再 ArrowDown：跳过 disabled 的 'b'，落到 'c'
            vm.handleKeyDown(key('ArrowDown'))
            expect(vm.activeItemIndex).toBe(2)

            // ArrowUp 从 2 回退：跳过 'b'，回到 'a'
            vm.handleKeyDown(key('ArrowUp'))
            expect(vm.activeItemIndex).toBe(0)
        })

        it('clears highlight when the whole column is disabled', async () => {
            // 全列均为 disabled 时，ArrowDown 不应停留在原 disabled 项（高亮与
            // activePath 均无变化的「无响应」），而应返回 -1 清除高亮，让焦点
            // 保持在触发按钮（aria-activedescendant 回到 undefined）
            const allDisabled: CascaderOption[] = [
                { value: 'a', label: 'A', disabled: true },
                { value: 'b', label: 'B', disabled: true },
            ]
            wrapper = mount(Cascader, {
                ...localeProvide,
                props: { options: allDisabled },
                attachTo: document.body,
            })
            const vm = wrapper.vm as any
            vm.open = true
            await nextTick()
            vm.activeColumnIndex = 0
            vm.activeItemIndex = 0

            const key = (k: string) => ({ key: k, preventDefault: () => {} }) as any
            vm.handleKeyDown(key('ArrowDown'))
            expect(vm.activeItemIndex).toBe(-1)
        })

        it('does not select disabled descendant leaves when checking a parent', async () => {
            const withDisabledLeaf: CascaderOption[] = [
                {
                    value: 'p',
                    label: 'Parent',
                    children: [
                        { value: 'ok', label: 'OK' },
                        { value: 'no', label: 'Disabled', disabled: true },
                    ],
                },
            ]
            wrapper = mount(Cascader, {
                ...localeProvide,
                props: { options: withDisabledLeaf, multiple: true, modelValue: [] },
                attachTo: document.body,
            })
            const vm = wrapper.vm as any
            vm.activePath = ['p']
            vm.toggleCheckbox(withDisabledLeaf[0], 0, true)
            expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual([['p', 'ok']])
        })
    })
})
