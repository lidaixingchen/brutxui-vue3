import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@/test/browser-mount'
import '../../../dist/styles.css'
import Calendar from './Calendar.vue'

const CONTAINER_WIDTH = 234
const WEEKDAY_COUNT = 7
let wrapper: ReturnType<typeof mount> | null = null

afterEach(() => {
    wrapper?.unmount()
    wrapper = null
})

describe('Calendar narrow layout', () => {
    it.each([false, true])('keeps every weekday visible when disabled is %s', async (disabled) => {
        wrapper = mount(defineComponent({
            setup: () => () => h('div', {
                style: { width: `${CONTAINER_WIDTH}px`, display: 'flex', justifyContent: 'center' },
            }, [h(Calendar, { disabled })]),
        }))

        await vi.waitFor(() => {
            expect(wrapper!.element.querySelectorAll('.vc-weekday')).toHaveLength(WEEKDAY_COUNT)
        })

        const container = wrapper.element.getBoundingClientRect()
        const calendar = wrapper.element.querySelector('.brutx-calendar')!
        const bounds = calendar.getBoundingClientRect()
        const weekdays = Array.from(calendar.querySelectorAll('.vc-weekday'))

        expect(bounds.left).toBeGreaterThanOrEqual(container.left)
        expect(bounds.right).toBeLessThanOrEqual(container.right)
        for (const weekday of weekdays) {
            const day = weekday.getBoundingClientRect()
            expect(day.left).toBeGreaterThanOrEqual(bounds.left)
            expect(day.right).toBeLessThanOrEqual(bounds.right)
        }
    })
})
