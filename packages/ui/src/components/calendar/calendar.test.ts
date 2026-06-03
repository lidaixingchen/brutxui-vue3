import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { vi } from 'vitest'
import Calendar from './Calendar.vue'

const { dayRef } = vi.hoisted(() => ({
    dayRef: {
        label: '15',
        isToday: false,
        isDisabled: false,
        inMonth: true,
        startDate: new Date(2026, 5, 15),
    },
}))

vi.mock('v-calendar', () => ({
    DatePicker: {
        name: 'VDatePicker',
        props: ['modelValue', 'mode', 'disabled', 'class', 'selectAttribute', 'dragAttribute', 'trimWeeks', 'firstDayOfWeek', 'popover'],
        emits: ['update:model-value'],
        data() {
            return { day: { ...dayRef } }
        },
        template: `
            <div class="v-date-picker-stub">
                <slot name="header-prev-button"></slot>
                <slot name="header-title" :title="'June 2026'"></slot>
                <slot name="header-next-button"></slot>
                <slot name="day-content" :day="day" :day-props="{ class: 'vc-day' }" :day-events="{}"></slot>
            </div>
        `,
    },
}))

const defaultDay = {
    label: '15',
    isToday: false,
    isDisabled: false,
    inMonth: true,
    startDate: new Date(2026, 5, 15),
}

function resetDay() {
    Object.assign(dayRef, { ...defaultDay, startDate: new Date(2026, 5, 15) })
}

function mountCalendar(props = {}) {
    return mount(Calendar, { props })
}

function findVDatePicker(wrapper: ReturnType<typeof mountCalendar>) {
    return wrapper.findComponent({ name: 'VDatePicker' })
}

describe('Calendar', () => {
    afterEach(() => {
        resetDay()
    })

    describe('rootClasses computed', () => {
        it('applies default brutal styling classes', () => {
            const wrapper = mountCalendar()
            const vm = wrapper.vm as unknown as { rootClasses: string }
            expect(vm.rootClasses).toContain('border-3')
            expect(vm.rootClasses).toContain('border-brutal')
            expect(vm.rootClasses).toContain('shadow-brutal')
            expect(vm.rootClasses).toContain('bg-brutal-bg')
            expect(vm.rootClasses).toContain('text-brutal-fg')
        })

        it('merges custom class into rootClasses', () => {
            const wrapper = mountCalendar({ class: 'custom-calendar' })
            const vm = wrapper.vm as unknown as { rootClasses: string }
            expect(vm.rootClasses).toContain('custom-calendar')
        })
    })

    describe('vCalendarModelValue computed', () => {
        it('returns DateRangeValue when isRange and modelValue is Date[] of length 2', () => {
            const start = new Date(2026, 0, 1)
            const end = new Date(2026, 0, 31)
            const wrapper = mountCalendar({ isRange: true, modelValue: [start, end] })
            const stub = findVDatePicker(wrapper)
            expect(stub.props('modelValue')).toEqual({ start, end })
        })

        it('returns null when isRange and modelValue is not an array', () => {
            const wrapper = mountCalendar({ isRange: true, modelValue: new Date(2026, 0, 1) })
            const stub = findVDatePicker(wrapper)
            expect(stub.props('modelValue')).toBeNull()
        })

        it('returns null when isRange and modelValue is an empty array', () => {
            const wrapper = mountCalendar({ isRange: true, modelValue: [] as Date[] })
            const stub = findVDatePicker(wrapper)
            expect(stub.props('modelValue')).toBeNull()
        })

        it('returns Date when modelValue is a Date instance and not isRange', () => {
            const date = new Date(2026, 5, 15)
            const wrapper = mountCalendar({ modelValue: date })
            const stub = findVDatePicker(wrapper)
            expect(stub.props('modelValue')).toBe(date)
        })

        it('returns null when modelValue is null', () => {
            const wrapper = mountCalendar({ modelValue: null })
            const stub = findVDatePicker(wrapper)
            expect(stub.props('modelValue')).toBeNull()
        })

        it('returns null when modelValue is undefined', () => {
            const wrapper = mountCalendar({ modelValue: undefined })
            const stub = findVDatePicker(wrapper)
            expect(stub.props('modelValue')).toBeNull()
        })
    })

    describe('handleUpdate', () => {
        it('does not emit when disabled', async () => {
            const wrapper = mountCalendar({ disabled: true })
            const stub = findVDatePicker(wrapper)
            stub.vm.$emit('update:model-value', new Date(2026, 5, 15))
            await nextTick()
            expect(wrapper.emitted('update:modelValue')).toBeUndefined()
        })

        it('emits [start, end] when isRange and value is DateRangeValue', async () => {
            const start = new Date(2026, 0, 1)
            const end = new Date(2026, 0, 31)
            const wrapper = mountCalendar({ isRange: true })
            const stub = findVDatePicker(wrapper)
            stub.vm.$emit('update:model-value', { start, end })
            await nextTick()
            expect(wrapper.emitted('update:modelValue')![0]).toEqual([[start, end]])
        })

        it('emits null when isRange and value is null', async () => {
            const wrapper = mountCalendar({ isRange: true })
            const stub = findVDatePicker(wrapper)
            stub.vm.$emit('update:model-value', null)
            await nextTick()
            expect(wrapper.emitted('update:modelValue')![0]).toEqual([null])
        })

        it('emits Date when not isRange and value is a Date', async () => {
            const date = new Date(2026, 5, 15)
            const wrapper = mountCalendar()
            const stub = findVDatePicker(wrapper)
            stub.vm.$emit('update:model-value', date)
            await nextTick()
            expect(wrapper.emitted('update:modelValue')![0]).toEqual([date])
        })

        it('emits null when not isRange and value is null', async () => {
            const wrapper = mountCalendar()
            const stub = findVDatePicker(wrapper)
            stub.vm.$emit('update:model-value', null)
            await nextTick()
            expect(wrapper.emitted('update:modelValue')![0]).toEqual([null])
        })
    })

    describe('template rendering', () => {
        it('renders the VDatePicker stub', () => {
            const wrapper = mountCalendar()
            expect(wrapper.find('.v-date-picker-stub').exists()).toBe(true)
        })

        it('renders header-title slot with title text', () => {
            const wrapper = mountCalendar()
            expect(wrapper.text()).toContain('June 2026')
        })

        it('renders day-content slot with day label', () => {
            const wrapper = mountCalendar()
            expect(wrapper.text()).toContain('15')
        })

        it('applies secondary style for today', () => {
            dayRef.isToday = true
            const wrapper = mountCalendar()
            expect(wrapper.find('.bg-brutal-secondary').exists()).toBe(true)
        })

        it('applies muted style for outside day (inMonth=false)', () => {
            dayRef.inMonth = false
            const wrapper = mountCalendar()
            expect(wrapper.find('.opacity-40').exists()).toBe(true)
        })

        it('applies disabled style for disabled day', () => {
            dayRef.isDisabled = true
            const wrapper = mountCalendar()
            expect(wrapper.find('.cursor-not-allowed').exists()).toBe(true)
        })

        it('passes mode prop to VDatePicker based on isRange', () => {
            const wrapper = mountCalendar({ isRange: true })
            const stub = findVDatePicker(wrapper)
            expect(stub.props('mode')).toBe('range')
        })

        it('passes disabled prop to VDatePicker', () => {
            const wrapper = mountCalendar({ disabled: true })
            const stub = findVDatePicker(wrapper)
            expect(stub.props('disabled')).toBe(true)
        })

        it('applies rootClasses to the VDatePicker class prop', () => {
            const wrapper = mountCalendar()
            const stub = findVDatePicker(wrapper)
            const classProp = stub.props('class') as string
            expect(classProp).toContain('border-3')
            expect(classProp).toContain('border-brutal')
            expect(classProp).toContain('shadow-brutal')
        })

        it('passes selectAttribute to VDatePicker', () => {
            const wrapper = mountCalendar()
            const stub = findVDatePicker(wrapper)
            expect(stub.props('selectAttribute')).toBeDefined()
            expect((stub.props('selectAttribute') as Record<string, unknown>).highlight).toBeDefined()
        })

        it('passes dragAttribute to VDatePicker', () => {
            const wrapper = mountCalendar()
            const stub = findVDatePicker(wrapper)
            expect(stub.props('dragAttribute')).toBeDefined()
            expect((stub.props('dragAttribute') as Record<string, unknown>).highlight).toBeDefined()
        })
    })
})
