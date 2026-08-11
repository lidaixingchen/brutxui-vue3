import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { vi } from 'vitest'
import Calendar from './Calendar.vue'

interface CalendarExposed {
    rootClasses: string
}

function assertCalendarExposed(vm: unknown): asserts vm is CalendarExposed {
    expect(vm).toHaveProperty('rootClasses')
}

type DayPropsClass = string | Record<string, boolean> | string[]

const { dayRef } = vi.hoisted(() => ({
    dayRef: {
        label: '15',
        isToday: false,
        isDisabled: false,
        inMonth: true,
        startDate: new Date(2026, 5, 15),
        propsClass: 'vc-day' as DayPropsClass,
    },
}))

vi.mock('v-calendar', () => ({
    DatePicker: {
        name: 'VDatePicker',
        props: ['modelValue', 'mode', 'isRange', 'disabled', 'class', 'selectAttribute', 'dragAttribute', 'trimWeeks', 'firstDayOfWeek', 'popover'],
        emits: ['update:model-value', 'drag'],
        data() {
            return { day: { ...dayRef }, dayPropsClass: dayRef.propsClass }
        },
        template: `
            <div class="v-date-picker-stub">
                <slot name="header-prev-button"></slot>
                <slot name="header-title" :title="'June 2026'"></slot>
                <slot name="header-next-button"></slot>
                <slot name="day-content" :day="day" :day-props="{ class: dayPropsClass }" :day-events="{}"></slot>
            </div>
        `,
    },
}))

vi.mock('v-calendar/style.css', () => ({}))

const defaultDay = {
    label: '15',
    isToday: false,
    isDisabled: false,
    inMonth: true,
    startDate: new Date(2026, 5, 15),
    propsClass: 'vc-day',
}

function resetDay() {
    Object.assign(dayRef, { ...defaultDay, startDate: new Date(2026, 5, 15) })
}

async function mountCalendar(props = {}) {
    const wrapper = mount(Calendar, { props })
    await flushPromises()
    await nextTick()
    return wrapper
}

async function findVDatePicker(wrapper: Awaited<ReturnType<typeof mountCalendar>>) {
    return wrapper.findComponent({ name: 'VDatePicker' })
}

describe('Calendar', () => {
    afterEach(() => {
        resetDay()
    })

    describe('rootClasses computed', () => {
        it('applies default brutal styling classes', async () => {
            const wrapper = await mountCalendar()
            assertCalendarExposed(wrapper.vm)
        const vm = wrapper.vm
            expect(vm.rootClasses).toContain('border-3')
            expect(vm.rootClasses).toContain('border-brutal')
            expect(vm.rootClasses).toContain('shadow-brutal')
            expect(vm.rootClasses).toContain('bg-brutal-bg')
            expect(vm.rootClasses).toContain('text-brutal-fg')
        })

        it('merges custom class into rootClasses', async () => {
            const wrapper = await mountCalendar({ class: 'custom-calendar' })
            assertCalendarExposed(wrapper.vm)
        const vm = wrapper.vm
            expect(vm.rootClasses).toContain('custom-calendar')
        })
    })

    describe('vCalendarModelValue computed', () => {
        it('returns DateRangeValue when isRange and modelValue is Date[] of length 2', async () => {
            const start = new Date(2026, 0, 1)
            const end = new Date(2026, 0, 31)
            const wrapper = await mountCalendar({ isRange: true, modelValue: [start, end] })
            const stub = await findVDatePicker(wrapper)
            expect(stub.props('modelValue')).toEqual({ start, end })
        })

        it('returns null when isRange and modelValue is not an array', async () => {
            const wrapper = await mountCalendar({ isRange: true, modelValue: new Date(2026, 0, 1) })
            const stub = await findVDatePicker(wrapper)
            expect(stub.props('modelValue')).toBeNull()
        })

        it('returns null when isRange and modelValue is an empty array', async () => {
            const wrapper = await mountCalendar({ isRange: true, modelValue: [] as Date[] })
            const stub = await findVDatePicker(wrapper)
            expect(stub.props('modelValue')).toBeNull()
        })

        it('normalizes single-element array to [start, start] when isRange', async () => {
            const date = new Date(2026, 0, 1)
            const wrapper = await mountCalendar({ isRange: true, modelValue: [date] })
            const stub = await findVDatePicker(wrapper)
            expect(stub.props('modelValue')).toEqual({ start: date, end: date })
        })

        it('returns Date when modelValue is a Date instance and not isRange', async () => {
            const date = new Date(2026, 5, 15)
            const wrapper = await mountCalendar({ modelValue: date })
            const stub = await findVDatePicker(wrapper)
            expect(stub.props('modelValue')).toBe(date)
        })

        it('returns null when modelValue is null', async () => {
            const wrapper = await mountCalendar({ modelValue: null })
            const stub = await findVDatePicker(wrapper)
            expect(stub.props('modelValue')).toBeNull()
        })

        it('returns null when modelValue is undefined', async () => {
            const wrapper = await mountCalendar({ modelValue: undefined })
            const stub = await findVDatePicker(wrapper)
            expect(stub.props('modelValue')).toBeNull()
        })
    })

    describe('handleUpdate', () => {
        it('does not emit when disabled', async () => {
            const wrapper = await mountCalendar({ disabled: true })
            const stub = await findVDatePicker(wrapper)
            stub.vm.$emit('update:model-value', new Date(2026, 5, 15))
            await nextTick()
            expect(wrapper.emitted('update:modelValue')).toBeUndefined()
        })

        it('emits [start, end] when isRange and value is DateRangeValue', async () => {
            const start = new Date(2026, 0, 1)
            const end = new Date(2026, 0, 31)
            const wrapper = await mountCalendar({ isRange: true })
            const stub = await findVDatePicker(wrapper)
            stub.vm.$emit('update:model-value', { start, end })
            await nextTick()
            expect(wrapper.emitted('update:modelValue')![0]).toEqual([[start, end]])
        })

        it('emits null when isRange and value is null', async () => {
            const wrapper = await mountCalendar({ isRange: true })
            const stub = await findVDatePicker(wrapper)
            stub.vm.$emit('update:model-value', null)
            await nextTick()
            expect(wrapper.emitted('update:modelValue')![0]).toEqual([null])
        })

        it('emits Date when not isRange and value is a Date', async () => {
            const date = new Date(2026, 5, 15)
            const wrapper = await mountCalendar()
            const stub = await findVDatePicker(wrapper)
            stub.vm.$emit('update:model-value', date)
            await nextTick()
            expect(wrapper.emitted('update:modelValue')![0]).toEqual([date])
        })

        it('emits null when not isRange and value is null', async () => {
            const wrapper = await mountCalendar()
            const stub = await findVDatePicker(wrapper)
            stub.vm.$emit('update:model-value', null)
            await nextTick()
            expect(wrapper.emitted('update:modelValue')![0]).toEqual([null])
        })
    })

    describe('template rendering', () => {
        it('renders the VDatePicker stub', async () => {
            const wrapper = await mountCalendar()
            expect(wrapper.find('.v-date-picker-stub').exists()).toBe(true)
        })

        it('renders header-title slot with title text', async () => {
            const wrapper = await mountCalendar()
            expect(wrapper.text()).toContain('June 2026')
        })

        it('renders day-content slot with day label', async () => {
            const wrapper = await mountCalendar()
            expect(wrapper.text()).toContain('15')
        })

        it('applies secondary style for today', async () => {
            dayRef.isToday = true
            const wrapper = await mountCalendar()
            expect(wrapper.find('.bg-brutal-secondary').exists()).toBe(true)
        })

        it('applies muted style for outside day (inMonth=false)', async () => {
            dayRef.inMonth = false
            const wrapper = await mountCalendar()
            expect(wrapper.find('.opacity-40').exists()).toBe(true)
        })

        it('applies disabled style for disabled day', async () => {
            dayRef.isDisabled = true
            const wrapper = await mountCalendar()
            expect(wrapper.find('.cursor-not-allowed').exists()).toBe(true)
        })

        it('passes mode="date" to VDatePicker always', async () => {
            const wrapper = await mountCalendar()
            const stub = await findVDatePicker(wrapper)
            expect(stub.props('mode')).toBe('date')
        })

        it('passes isRange prop to VDatePicker', async () => {
            const wrapper = await mountCalendar({ isRange: true })
            const stub = await findVDatePicker(wrapper)
            expect(stub.props('isRange')).toBe(true)
        })

        it('passes isRange=false by default', async () => {
            const wrapper = await mountCalendar()
            const stub = await findVDatePicker(wrapper)
            expect(stub.props('isRange')).toBe(false)
        })

        it('applies disabled styles to rootClasses when disabled', async () => {
            const wrapper = await mountCalendar({ disabled: true })
            assertCalendarExposed(wrapper.vm)
        const vm = wrapper.vm
            expect(vm.rootClasses).toContain('opacity-50')
            expect(vm.rootClasses).toContain('pointer-events-none')
        })

        it('does not apply disabled styles when not disabled', async () => {
            const wrapper = await mountCalendar()
            assertCalendarExposed(wrapper.vm)
        const vm = wrapper.vm
            expect(vm.rootClasses).not.toContain('opacity-50')
            expect(vm.rootClasses).not.toContain('pointer-events-none')
        })

        it('applies rootClasses to the VDatePicker class prop', async () => {
            const wrapper = await mountCalendar()
            const stub = await findVDatePicker(wrapper)
            const classProp = stub.props('class') as string
            expect(classProp).toContain('border-3')
            expect(classProp).toContain('border-brutal')
            expect(classProp).toContain('shadow-brutal')
        })

        it('passes selectAttribute to VDatePicker', async () => {
            const wrapper = await mountCalendar()
            const stub = await findVDatePicker(wrapper)
            expect(stub.props('selectAttribute')).toBeDefined()
            expect((stub.props('selectAttribute') as Record<string, unknown>).highlight).toBeDefined()
        })

        it('passes dragAttribute to VDatePicker', async () => {
            const wrapper = await mountCalendar()
            const stub = await findVDatePicker(wrapper)
            expect(stub.props('dragAttribute')).toBeDefined()
            expect((stub.props('dragAttribute') as Record<string, unknown>).highlight).toBeDefined()
        })

        it('handles drag event for range selection', async () => {
            const start = new Date(2026, 0, 1)
            const end = new Date(2026, 0, 15)
            const wrapper = await mountCalendar({ isRange: true })
            const stub = await findVDatePicker(wrapper)
            stub.vm.$emit('drag', { start, end })
            await nextTick()
            expect(wrapper.emitted('update:modelValue')![0]).toEqual([[start, end]])
        })

        it('does not emit on drag when not isRange', async () => {
            const wrapper = await mountCalendar()
            const stub = await findVDatePicker(wrapper)
            stub.vm.$emit('drag', { start: new Date(2026, 0, 1), end: new Date(2026, 0, 15) })
            await nextTick()
            expect(wrapper.emitted('update:modelValue')).toBeUndefined()
        })

        it('renders event dot in default mode when day has events', async () => {
            const events = [
                { date: new Date(2026, 5, 15), title: 'Meeting' },
                { date: '2026-06-15', title: 'Lunch' }
            ]
            const wrapper = await mountCalendar({ events, mode: 'default' })
            expect(wrapper.find('[data-testid="calendar-event-dot"]').exists()).toBe(true)
        })

        it('does not render event dot in default mode when day has no events', async () => {
            const events = [
                { date: new Date(2026, 5, 16), title: 'Meeting' }
            ]
            const wrapper = await mountCalendar({ events, mode: 'default' })
            expect(wrapper.find('[data-testid="calendar-event-dot"]').exists()).toBe(false)
        })

        it('renders events as badges in card mode', async () => {
            const events = [
                { date: new Date(2026, 5, 15), title: 'Meeting' },
                { date: new Date(2026, 5, 15), title: 'Lunch' }
            ]
            const wrapper = await mountCalendar({ events, mode: 'card' })
            const badges = wrapper.findAll('[data-testid="calendar-card-event-badge"]')
            expect(badges).toHaveLength(2)
            expect(badges[0].text()).toBe('Meeting')
            expect(badges[1].text()).toBe('Lunch')
            expect(wrapper.find('[data-testid="calendar-event-dot"]').exists()).toBe(false)
        })

        it('renders duplicate-title events in card mode', async () => {
            const events = [
                { date: new Date(2026, 5, 15), title: 'Same' },
                { date: new Date(2026, 5, 15), title: 'Same' }
            ]
            const wrapper = await mountCalendar({ events, mode: 'card' })
            const badges = wrapper.findAll('[data-testid="calendar-card-event-badge"]')
            expect(badges).toHaveLength(2)
            expect(badges[0].text()).toBe('Same')
            expect(badges[1].text()).toBe('Same')
        })

        it('does not collide day-class cache across object dayPropsClass shapes', async () => {
            dayRef.propsClass = { 'custom-obj-a': true }
            const first = await mountCalendar()
            expect(first.find('.custom-obj-a').exists()).toBe(true)
            first.unmount()

            dayRef.propsClass = { 'custom-obj-b': true }
            const second = await mountCalendar()
            expect(second.find('.custom-obj-b').exists()).toBe(true)
            expect(second.find('.custom-obj-a').exists()).toBe(false)
        })

        it('supports custom event renderer via eventRenderer prop', async () => {
            const events = [
                { date: new Date(2026, 5, 15), title: 'Meeting' }
            ]
            const customRenderer = (event: any) => {
                return {
                    template: `<div class="custom-rendered-event">${event.title} - Custom</div>`
                }
            }
            const wrapper = await mountCalendar({
                events,
                mode: 'card',
                eventRenderer: customRenderer
            })
            expect(wrapper.find('.custom-rendered-event').exists()).toBe(true)
            expect(wrapper.find('.custom-rendered-event').text()).toBe('Meeting - Custom')
        })
    })
})
