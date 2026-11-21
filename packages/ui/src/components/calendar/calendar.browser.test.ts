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

    it('keeps the month toolbar in place when scrolling card events into view', async () => {
        const date = new Date(2026, 10, 22)
        const eventTitle = '用户权限季度人工审核'
        wrapper = mount(defineComponent({
            setup: () => () => h('div', { style: { width: `${CONTAINER_WIDTH}px` } }, [
                h(Calendar, { mode: 'card', modelValue: date, events: [{ date, title: eventTitle }] }),
            ]),
        }))
        const selector = '[data-testid="calendar-card-event-badge"]'
        await vi.waitFor(() => {
            expect(wrapper!.element.querySelector(selector)).not.toBeNull()
        })

        const weeks = wrapper.element.querySelector<HTMLElement>('.vc-weeks')!
        const title = wrapper.element.querySelector<HTMLElement>('.vc-title')!
        const badge = weeks.querySelector<HTMLElement>(selector)!
        const toolbarLeft = title.getBoundingClientRect().left
        expect(weeks.scrollWidth).toBeGreaterThan(weeks.clientWidth)
        weeks.scrollLeft = weeks.scrollWidth

        const range = document.createRange()
        range.selectNodeContents(badge)
        const lines = Array.from(range.getClientRects())
        expect(badge.textContent?.trim()).toBe(eventTitle)
        expect(badge.scrollWidth).toBeLessThanOrEqual(badge.clientWidth)
        expect(lines.length).toBeGreaterThan(1)
        for (const line of lines) {
            expect(line.left).toBeGreaterThanOrEqual(weeks.getBoundingClientRect().left)
            expect(line.right).toBeLessThanOrEqual(weeks.getBoundingClientRect().right)
        }
        expect(title.getBoundingClientRect().left).toBe(toolbarLeft)
    })
})
