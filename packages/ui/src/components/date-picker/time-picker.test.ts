import { mount } from '@vue/test-utils'
import TimePicker from './TimePicker.vue'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'

const localeProvide = { global: { provide: { [LOCALE_INJECTION_KEY]: en } } }

const selectStubs = {
    SelectRoot: {
        name: 'SelectRoot',
        props: ['modelValue', 'disabled'],
        emits: ['update:modelValue'],
        template: '<div class="select-root" :data-model-value="modelValue" :data-disabled="disabled"><slot /></div>',
    },
    SelectTrigger: {
        name: 'SelectTrigger',
        template: '<div class="select-trigger" role="combobox"><slot /><span class="select-icon"></span></div>',
    },
    SelectValue: {
        name: 'SelectValue',
        template: '<span class="select-value"><slot /></span>',
    },
    SelectContent: {
        name: 'SelectContent',
        template: '<div class="select-content"><slot /></div>',
    },
    SelectItem: {
        name: 'SelectItem',
        props: ['value'],
        template: '<div class="select-item" :data-value="value"><span class="select-item-indicator"></span><span class="select-item-text"><slot /></span></div>',
    },
}

function mountTimePicker(options: Record<string, unknown> = {}) {
    return mount(TimePicker, {
        attachTo: document.body,
        ...localeProvide,
        ...options,
        global: {
            ...localeProvide.global,
            stubs: selectStubs,
            ...(options.global as Record<string, unknown> | undefined),
        },
    })
}

let wrapper: ReturnType<typeof mount> | null = null

afterEach(() => {
    if (wrapper) {
        wrapper.unmount()
        wrapper = null
    }
    document.body.innerHTML = ''
})

describe('TimePicker', () => {
    it('renders with group role', () => {
        wrapper = mountTimePicker()
        const group = wrapper.find('[role="group"]')
        expect(group.exists()).toBe(true)
    })

    it('renders hour and minute selects by default', () => {
        wrapper = mountTimePicker()
        const roots = wrapper.findAll('.select-root')
        expect(roots).toHaveLength(2)
    })

    it('renders second select when showSeconds is true', () => {
        wrapper = mountTimePicker({ props: { showSeconds: true } })
        const roots = wrapper.findAll('.select-root')
        expect(roots).toHaveLength(3)
    })

    it('reflects current hour from modelValue on SelectRoot', () => {
        wrapper = mountTimePicker({
            props: { modelValue: new Date(2026, 0, 5, 14, 30, 45) },
        })
        const roots = wrapper.findAll('.select-root')
        expect(roots[0].attributes('data-model-value')).toBe('14')
        expect(roots[1].attributes('data-model-value')).toBe('30')
    })

    it('reflects zero hour when modelValue is null', () => {
        wrapper = mountTimePicker({ props: { modelValue: null } })
        const roots = wrapper.findAll('.select-root')
        expect(roots[0].attributes('data-model-value')).toBe('0')
        expect(roots[1].attributes('data-model-value')).toBe('0')
    })

    it('emits update:modelValue when hour changes', async () => {
        wrapper = mountTimePicker({
            props: { modelValue: new Date(2026, 0, 5, 10, 30, 0) },
        })
        const roots = wrapper.findAllComponents({ name: 'SelectRoot' })
        await roots[0].vm.$emit('update:modelValue', '15')
        const emitted = wrapper.emitted('update:modelValue')
        expect(emitted).toBeTruthy()
        const value = emitted![0][0] as Date
        expect(value.getHours()).toBe(15)
        expect(value.getMinutes()).toBe(30)
    })

    it('emits update:modelValue when minute changes', async () => {
        wrapper = mountTimePicker({
            props: { modelValue: new Date(2026, 0, 5, 10, 30, 0) },
        })
        const roots = wrapper.findAllComponents({ name: 'SelectRoot' })
        await roots[1].vm.$emit('update:modelValue', '45')
        const emitted = wrapper.emitted('update:modelValue')
        expect(emitted).toBeTruthy()
        const value = emitted![0][0] as Date
        expect(value.getHours()).toBe(10)
        expect(value.getMinutes()).toBe(45)
    })

    it('emits update:modelValue when second changes', async () => {
        wrapper = mountTimePicker({
            props: {
                modelValue: new Date(2026, 0, 5, 10, 30, 0),
                showSeconds: true,
            },
        })
        const roots = wrapper.findAllComponents({ name: 'SelectRoot' })
        await roots[2].vm.$emit('update:modelValue', '30')
        const emitted = wrapper.emitted('update:modelValue')
        expect(emitted).toBeTruthy()
        const value = emitted![0][0] as Date
        expect(value.getSeconds()).toBe(30)
    })

    it('preserves date when modelValue exists and time changes', async () => {
        wrapper = mountTimePicker({
            props: { modelValue: new Date(2026, 5, 15, 10, 30, 0) },
        })
        const roots = wrapper.findAllComponents({ name: 'SelectRoot' })
        await roots[0].vm.$emit('update:modelValue', '20')
        const emitted = wrapper.emitted('update:modelValue')
        const value = emitted![0][0] as Date
        expect(value.getFullYear()).toBe(2026)
        expect(value.getMonth()).toBe(5)
        expect(value.getDate()).toBe(15)
        expect(value.getHours()).toBe(20)
    })

    it('respects hour timeStep', () => {
        wrapper = mountTimePicker({
            props: {
                timeStep: { hour: 6, minute: 1, second: 1 },
            },
        })
        const roots = wrapper.findAll('.select-root')
        const hourItems = roots[0].findAll('.select-item')
        const hourValues = hourItems.map((i) => i.attributes('data-value'))
        expect(hourValues).toEqual(['0', '6', '12', '18'])
    })

    it('respects minute timeStep', () => {
        wrapper = mountTimePicker({
            props: {
                timeStep: { hour: 1, minute: 15, second: 1 },
            },
        })
        const roots = wrapper.findAll('.select-root')
        const minuteItems = roots[1].findAll('.select-item')
        const minuteValues = minuteItems.map((i) => i.attributes('data-value'))
        expect(minuteValues).toEqual(['0', '15', '30', '45'])
    })

    it('renders hour label', () => {
        wrapper = mountTimePicker()
        expect(wrapper.text()).toContain('Hour')
    })

    it('renders minute label', () => {
        wrapper = mountTimePicker()
        expect(wrapper.text()).toContain('Minute')
    })

    it('renders second label when showSeconds', () => {
        wrapper = mountTimePicker({ props: { showSeconds: true } })
        expect(wrapper.text()).toContain('Second')
    })

    it('does not render second label when showSeconds is false', () => {
        wrapper = mountTimePicker()
        expect(wrapper.text()).not.toContain('Second')
    })

    it('is disabled when disabled prop is true', () => {
        wrapper = mountTimePicker({ props: { disabled: true } })
        const roots = wrapper.findAll('.select-root')
        roots.forEach((r) => {
            expect(r.attributes('data-disabled')).toBe('true')
        })
    })

    it('does not emit when disabled and value changes', async () => {
        wrapper = mountTimePicker({
            props: {
                modelValue: new Date(2026, 0, 5, 10, 30, 0),
                disabled: true,
            },
        })
        const roots = wrapper.findAllComponents({ name: 'SelectRoot' })
        await roots[0].vm.$emit('update:modelValue', '15')
        expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    })

    it('has aria-label on group', () => {
        wrapper = mountTimePicker()
        const group = wrapper.find('[role="group"]')
        expect(group.attributes('aria-label')).toBeDefined()
    })

    it('uses custom aria-label when provided', () => {
        wrapper = mountTimePicker({ props: { ariaLabel: 'Custom time' } })
        const group = wrapper.find('[role="group"]')
        expect(group.attributes('aria-label')).toBe('Custom time')
    })

    it('has 24 hour options by default', () => {
        wrapper = mountTimePicker()
        const roots = wrapper.findAll('.select-root')
        const hourItems = roots[0].findAll('.select-item')
        expect(hourItems).toHaveLength(24)
    })

    it('has 60 minute options by default', () => {
        wrapper = mountTimePicker()
        const roots = wrapper.findAll('.select-root')
        const minuteItems = roots[1].findAll('.select-item')
        expect(minuteItems).toHaveLength(60)
    })

    it('pads option labels with leading zeros', () => {
        wrapper = mountTimePicker()
        const roots = wrapper.findAll('.select-root')
        const firstHourItem = roots[0].find('.select-item-text')
        expect(firstHourItem.text()).toBe('00')
    })

    it('applies brutalist panel framing when standalone', () => {
        wrapper = mountTimePicker()
        const group = wrapper.find('[role="group"]')
        expect(group.classes()).toContain('border-3')
        expect(group.classes()).toContain('border-brutal')
        expect(group.classes()).toContain('shadow-brutal-lg')
        expect(group.classes()).toContain('rounded-brutal')
    })

    it('uses embedded separator style when embedded prop is true', () => {
        wrapper = mountTimePicker({ props: { embedded: true } })
        const group = wrapper.find('[role="group"]')
        expect(group.classes()).toContain('border-t-3')
        expect(group.classes()).not.toContain('shadow-brutal-lg')
    })

    it('renders dropdown chevron icon on each trigger', () => {
        wrapper = mountTimePicker()
        const triggers = wrapper.findAll('.select-trigger')
        triggers.forEach((trigger) => {
            expect(trigger.find('.select-icon').exists()).toBe(true)
        })
    })

    it('renders check indicator inside each option', () => {
        wrapper = mountTimePicker()
        const items = wrapper.findAll('.select-item')
        expect(items.length).toBeGreaterThan(0)
        items.forEach((item) => {
            expect(item.find('.select-item-indicator').exists()).toBe(true)
        })
    })
})
