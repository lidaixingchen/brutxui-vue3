import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import Countdown from './Countdown.vue'
import { provideLocale } from '@/composables/useLocale'
import { en } from '@/locales/en'

describe('Countdown', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.useRealTimers()
    })

    it('renders formatted remaining time based on target timestamp', () => {
        const now = 1700000000000
        vi.setSystemTime(now)

        // 1 hour, 2 minutes, 3 seconds in the future
        const target = now + (1 * 3600 + 2 * 60 + 3) * 1000
        const wrapper = mount(Countdown, {
            props: { value: target },
        })

        expect(wrapper.text()).toContain('01:02:03')
    })

    it('supports custom formats with days and escaped literals', () => {
        const now = 1700000000000
        vi.setSystemTime(now)

        // 2 days, 3 hours, 4 minutes, 5 seconds
        const target = now + (2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000
        const wrapper = mount(Countdown, {
            props: {
                value: target,
                format: 'DD [天] HH:mm:ss',
            },
        })

        expect(wrapper.text()).toContain('02 天 03:04:05')
    })

    it('supports millisecond format token SSS', () => {
        const now = 1700000000000
        vi.setSystemTime(now)

        const target = now + 5123
        const wrapper = mount(Countdown, {
            props: {
                value: target,
                format: 'ss.SSS',
            },
        })

        expect(wrapper.text()).toContain('05.123')
    })

    it('ticks and updates remaining time on timer advance', async () => {
        const now = 1700000000000
        vi.setSystemTime(now)

        const target = now + 5000
        const wrapper = mount(Countdown, {
            props: { value: target },
        })

        expect(wrapper.text()).toContain('00:00:05')

        // Advance by 1 second
        vi.advanceTimersByTime(1000)
        await wrapper.vm.$nextTick()
        expect(wrapper.text()).toContain('00:00:04')

        // Advance by 2 more seconds
        vi.advanceTimersByTime(2000)
        await wrapper.vm.$nextTick()
        expect(wrapper.text()).toContain('00:00:02')
    })

    it('recovers immediately without drift after sleep or background wake-up', async () => {
        const now = 1700000000000
        vi.setSystemTime(now)

        const target = now + 60000 // 60 seconds
        const wrapper = mount(Countdown, {
            props: { value: target },
        })

        expect(wrapper.text()).toContain('00:01:00')

        // Simulate tab sleeping in background for 35 seconds
        vi.advanceTimersByTime(35000)
        await wrapper.vm.$nextTick()

        // Absolute difference is 60 - 35 = 25 seconds
        expect(wrapper.text()).toContain('00:00:25')
    })

    it('emits finish event exactly once when reaching zero', async () => {
        const now = 1700000000000
        vi.setSystemTime(now)

        const target = now + 2000
        const wrapper = mount(Countdown, {
            props: { value: target },
        })

        expect(wrapper.emitted('finish')).toBeUndefined()

        vi.advanceTimersByTime(2000)
        await wrapper.vm.$nextTick()

        expect(wrapper.emitted('finish')).toHaveLength(1)
        expect(wrapper.text()).toContain('00:00:00')

        // Advance further into the future: finish must NOT be emitted again
        vi.advanceTimersByTime(5000)
        await wrapper.vm.$nextTick()

        expect(wrapper.emitted('finish')).toHaveLength(1)
    })

    it('restarts a new cycle when value changes to a new target', async () => {
        const now = 1700000000000
        vi.setSystemTime(now)

        const target1 = now + 1000
        const wrapper = mount(Countdown, {
            props: { value: target1 },
        })

        vi.advanceTimersByTime(1000)
        await wrapper.vm.$nextTick()
        expect(wrapper.emitted('finish')).toHaveLength(1)

        // Set a new target 10 seconds into the future
        const target2 = now + 11000
        await wrapper.setProps({ value: target2 })
        await wrapper.vm.$nextTick()

        expect(wrapper.text()).toContain('00:00:10')

        vi.advanceTimersByTime(10000)
        await wrapper.vm.$nextTick()

        // finish event has now been emitted twice (once for each cycle)
        expect(wrapper.emitted('finish')).toHaveLength(2)
    })

    it('immediately emits finish if target is already in the past on mount', async () => {
        const now = 1700000000000
        vi.setSystemTime(now)

        const pastTarget = now - 5000
        const wrapper = mount(Countdown, {
            props: { value: pastTarget },
        })

        expect(wrapper.emitted('finish')).toHaveLength(1)
        expect(wrapper.text()).toContain('00:00:00')
    })

    it('satisfies A11y noise reduction contract (aria-live off while ticking, polite when finished)', async () => {
        const now = 1700000000000
        vi.setSystemTime(now)

        const target = now + 2000
        const wrapper = mount(Countdown, {
            props: { value: target },
        })

        // Ticking: aria-live="off", screen reader status text not rendered
        expect(wrapper.attributes('aria-live')).toBe('off')
        expect(wrapper.find('[role="status"]').exists()).toBe(false)

        // Reach completion
        vi.advanceTimersByTime(2000)
        await wrapper.vm.$nextTick()

        // Finished: aria-live="polite", one-time status text announced
        expect(wrapper.attributes('aria-live')).toBe('polite')
        const statusEl = wrapper.find('[role="status"]')
        expect(statusEl.exists()).toBe(true)
        expect(statusEl.text()).toBe('倒计时已结束')
    })

    it('respects locale for completion status announcement', async () => {
        const now = 1700000000000
        vi.setSystemTime(now)

        const Parent = defineComponent({
            setup() {
                provideLocale(en)
                return () => h(Countdown, { value: now })
            },
        })
        const wrapper = mount(Parent)

        const statusEl = wrapper.find('[role="status"]')
        expect(statusEl.exists()).toBe(true)
        expect(statusEl.text()).toBe('Countdown finished')
    })

    it('clears timer on component unmount to prevent leaks', () => {
        const now = 1700000000000
        vi.setSystemTime(now)

        const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
        const wrapper = mount(Countdown, {
            props: { value: now + 5000 },
        })

        wrapper.unmount()
        expect(clearTimeoutSpy).toHaveBeenCalled()
    })

    it('renders title, prefix, and suffix and prioritizes slots', () => {
        const now = 1700000000000
        vi.setSystemTime(now)

        const wrapper = mount(Countdown, {
            props: {
                value: now + 5000,
                title: 'Sale Ends In',
                prefix: '⏰',
                suffix: 'left',
            },
            slots: {
                title: 'Custom Title Slot',
            },
        })

        expect(wrapper.text()).toContain('Custom Title Slot')
        expect(wrapper.text()).not.toContain('Sale Ends In')
        expect(wrapper.text()).toContain('⏰')
        expect(wrapper.text()).toContain('left')
    })

    it('handles invalid or null value gracefully without timer scheduling', () => {
        const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')
        const wrapper = mount(Countdown, {
            props: { value: null },
        })

        expect(wrapper.text()).toContain('-')
        // No timer scheduled for invalid value
        expect(setTimeoutSpy).not.toHaveBeenCalled()
    })

    it('supports custom default slot for custom time units rendering', () => {
        const now = 1700000000000
        vi.setSystemTime(now)

        const wrapper = mount(Countdown, {
            props: { value: now + 10000 },
            slots: {
                default: (slotProps: { remaining: number; formatted: string }) =>
                    h('div', { class: 'custom-clock' }, `REMAINING:${slotProps.formatted}`),
            },
        })

        expect(wrapper.find('.custom-clock').text()).toBe('REMAINING:00:00:10')
    })
})
