import { mount } from '@vue/test-utils'
import TimePicker from './TimePicker.vue'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'

const localeProvide = { global: { provide: { [LOCALE_INJECTION_KEY]: en } } }

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
        wrapper = mount(TimePicker, { ...localeProvide, attachTo: document.body })
        const group = wrapper.find('[role="group"]')
        expect(group.exists()).toBe(true)
    })

    it('renders hour and minute selects by default', () => {
        wrapper = mount(TimePicker, { ...localeProvide, attachTo: document.body })
        const selects = wrapper.findAll('select')
        expect(selects).toHaveLength(2)
    })

    it('renders second select when showSeconds is true', () => {
        wrapper = mount(TimePicker, {
            ...localeProvide,
            props: { showSeconds: true },
            attachTo: document.body,
        })
        const selects = wrapper.findAll('select')
        expect(selects).toHaveLength(3)
    })

    it('displays current hour from modelValue', () => {
        wrapper = mount(TimePicker, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 0, 5, 14, 30, 45) },
            attachTo: document.body,
        })
        const selects = wrapper.findAll('select')
        expect(selects[0].element.value).toBe('14')
        expect(selects[1].element.value).toBe('30')
    })

    it('displays zero hour when modelValue is null', () => {
        wrapper = mount(TimePicker, {
            ...localeProvide,
            props: { modelValue: null },
            attachTo: document.body,
        })
        const selects = wrapper.findAll('select')
        expect(selects[0].element.value).toBe('0')
        expect(selects[1].element.value).toBe('0')
    })

    it('emits update:modelValue when hour changes', async () => {
        wrapper = mount(TimePicker, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 0, 5, 10, 30, 0) },
            attachTo: document.body,
        })
        const selects = wrapper.findAll('select')
        await selects[0].setValue('15')
        const emitted = wrapper.emitted('update:modelValue')
        expect(emitted).toBeTruthy()
        const value = emitted![0][0] as Date
        expect(value.getHours()).toBe(15)
        expect(value.getMinutes()).toBe(30)
    })

    it('emits update:modelValue when minute changes', async () => {
        wrapper = mount(TimePicker, {
            ...localeProvide,
            props: { modelValue: new Date(2026, 0, 5, 10, 30, 0) },
            attachTo: document.body,
        })
        const selects = wrapper.findAll('select')
        await selects[1].setValue('45')
        const emitted = wrapper.emitted('update:modelValue')
        expect(emitted).toBeTruthy()
        const value = emitted![0][0] as Date
        expect(value.getHours()).toBe(10)
        expect(value.getMinutes()).toBe(45)
    })

    it('emits update:modelValue when second changes', async () => {
        wrapper = mount(TimePicker, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 0, 5, 10, 30, 0),
                showSeconds: true,
            },
            attachTo: document.body,
        })
        const selects = wrapper.findAll('select')
        await selects[2].setValue('30')
        const emitted = wrapper.emitted('update:modelValue')
        expect(emitted).toBeTruthy()
        const value = emitted![0][0] as Date
        expect(value.getSeconds()).toBe(30)
    })

    it('preserves date when modelValue exists and time changes', async () => {
        const original = new Date(2026, 5, 15, 10, 30, 0)
        wrapper = mount(TimePicker, {
            ...localeProvide,
            props: { modelValue: original },
            attachTo: document.body,
        })
        const selects = wrapper.findAll('select')
        await selects[0].setValue('20')
        const emitted = wrapper.emitted('update:modelValue')
        const value = emitted![0][0] as Date
        expect(value.getFullYear()).toBe(2026)
        expect(value.getMonth()).toBe(5)
        expect(value.getDate()).toBe(15)
        expect(value.getHours()).toBe(20)
    })

    it('respects hour timeStep', () => {
        wrapper = mount(TimePicker, {
            ...localeProvide,
            props: {
                timeStep: { hour: 6, minute: 1, second: 1 },
            },
            attachTo: document.body,
        })
        const selects = wrapper.findAll('select')
        const hourOptions = selects[0].findAll('option')
        const hourValues = hourOptions.map((o) => o.element.value)
        expect(hourValues).toEqual(['0', '6', '12', '18'])
    })

    it('respects minute timeStep', () => {
        wrapper = mount(TimePicker, {
            ...localeProvide,
            props: {
                timeStep: { hour: 1, minute: 15, second: 1 },
            },
            attachTo: document.body,
        })
        const selects = wrapper.findAll('select')
        const minuteOptions = selects[1].findAll('option')
        const minuteValues = minuteOptions.map((o) => o.element.value)
        expect(minuteValues).toEqual(['0', '15', '30', '45'])
    })

    it('renders hour label', () => {
        wrapper = mount(TimePicker, { ...localeProvide, attachTo: document.body })
        expect(wrapper.text()).toContain('Hour')
    })

    it('renders minute label', () => {
        wrapper = mount(TimePicker, { ...localeProvide, attachTo: document.body })
        expect(wrapper.text()).toContain('Minute')
    })

    it('renders second label when showSeconds', () => {
        wrapper = mount(TimePicker, {
            ...localeProvide,
            props: { showSeconds: true },
            attachTo: document.body,
        })
        expect(wrapper.text()).toContain('Second')
    })

    it('does not render second label when showSeconds is false', () => {
        wrapper = mount(TimePicker, { ...localeProvide, attachTo: document.body })
        expect(wrapper.text()).not.toContain('Second')
    })

    it('is disabled when disabled prop is true', () => {
        wrapper = mount(TimePicker, {
            ...localeProvide,
            props: { disabled: true },
            attachTo: document.body,
        })
        const selects = wrapper.findAll('select')
        selects.forEach((s) => {
            expect(s.attributes('disabled')).toBeDefined()
        })
    })

    it('does not emit when disabled and value changes', async () => {
        wrapper = mount(TimePicker, {
            ...localeProvide,
            props: {
                modelValue: new Date(2026, 0, 5, 10, 30, 0),
                disabled: true,
            },
            attachTo: document.body,
        })
        const selects = wrapper.findAll('select')
        await selects[0].setValue('15')
        expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    })

    it('has aria-label on group', () => {
        wrapper = mount(TimePicker, { ...localeProvide, attachTo: document.body })
        const group = wrapper.find('[role="group"]')
        expect(group.attributes('aria-label')).toBeDefined()
    })

    it('uses custom aria-label when provided', () => {
        wrapper = mount(TimePicker, {
            ...localeProvide,
            props: { ariaLabel: 'Custom time' },
            attachTo: document.body,
        })
        const group = wrapper.find('[role="group"]')
        expect(group.attributes('aria-label')).toBe('Custom time')
    })

    it('has 24 hour options by default', () => {
        wrapper = mount(TimePicker, { ...localeProvide, attachTo: document.body })
        const selects = wrapper.findAll('select')
        const hourOptions = selects[0].findAll('option')
        expect(hourOptions).toHaveLength(24)
    })

    it('has 60 minute options by default', () => {
        wrapper = mount(TimePicker, { ...localeProvide, attachTo: document.body })
        const selects = wrapper.findAll('select')
        const minuteOptions = selects[1].findAll('option')
        expect(minuteOptions).toHaveLength(60)
    })

    it('pads option labels with leading zeros', () => {
        wrapper = mount(TimePicker, { ...localeProvide, attachTo: document.body })
        const selects = wrapper.findAll('select')
        const firstHourOption = selects[0].find('option')
        expect(firstHourOption.text()).toBe('00')
    })
})
