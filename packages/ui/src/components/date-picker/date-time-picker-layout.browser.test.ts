import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@/test/browser-mount'
import '../../../dist/styles.css'
import DateTimePicker from './DateTimePicker.vue'

const VIEWPORT_HEIGHT = 844
const TRIGGER_TOP = 400
const VIEWPORT_WIDTHS = [390, 320] as const
let wrapper: ReturnType<typeof mount> | null = null
let originalViewport: { width: number; height: number } | null = null

afterEach(async () => {
    wrapper?.unmount()
    wrapper = null
    if (originalViewport) {
        await page.viewport(originalViewport.width, originalViewport.height)
        originalViewport = null
    }
})

describe('DateTimePicker available height', () => {
    it.each(VIEWPORT_WIDTHS)('keeps the frame and confirmation visible in a %ipx viewport', async width => {
        originalViewport = { width: innerWidth, height: innerHeight }
        await page.viewport(width, VIEWPORT_HEIGHT)
        wrapper = mount(defineComponent({
            setup: () => () => h('div', {
                style: { position: 'absolute', top: `${TRIGGER_TOP}px`, left: '2rem', width: '15rem' },
            }, [h(DateTimePicker)]),
        }))
        const trigger = wrapper.element.querySelector<HTMLButtonElement>('[role="combobox"]')!
        trigger.focus()
        await userEvent.keyboard('[Enter]')
        await expect.poll(() => document.querySelector('.z-popover .vc-day')).not.toBeNull()
        await document.fonts.ready
        await Promise.all(document.getAnimations()
            .filter(animation => animation.effect?.getTiming().iterations !== Infinity)
            .map(animation => animation.finished.catch(() => {})))
        const content = document.querySelector<HTMLElement>('.z-popover')!
        const positioner = content.closest<HTMLElement>('[data-reka-popper-content-wrapper]')!
        const panel = content.querySelector<HTMLElement>('[role="dialog"]')!
        const calendar = content.querySelector<HTMLElement>('.brutx-calendar')!
        const confirm = Array.from(content.querySelectorAll<HTMLButtonElement>('button'))
            .find(button => button.textContent?.trim() === '确认')!

        expect(positioner.getBoundingClientRect().bottom).toBeLessThanOrEqual(innerHeight)
        expect(confirm.getBoundingClientRect().bottom).toBeLessThanOrEqual(panel.getBoundingClientRect().bottom)
        expect(calendar.scrollHeight).toBeGreaterThan(calendar.clientHeight)
        calendar.scrollTop = calendar.scrollHeight
        expect(calendar.scrollTop).toBeGreaterThan(0)
        const confirmRect = confirm.getBoundingClientRect()
        expect(document.elementFromPoint(confirmRect.x + confirmRect.width / 2, confirmRect.y + confirmRect.height / 2))
            .toBe(confirm)
        confirm.click()
        await nextTick()
        expect(trigger.getAttribute('aria-expanded')).toBe('false')
    })
})
