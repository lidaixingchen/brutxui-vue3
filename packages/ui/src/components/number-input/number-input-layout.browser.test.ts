import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { nextTick } from 'vue'
import '../../../dist/styles.css'
import { mount } from '@/test/browser-mount'
import NumberInput from './NumberInput.vue'

const VIEWPORT_WIDTHS = [320, 390]
const VIEWPORT_HEIGHT = 844
const PAGE_MARGIN = 16
const GRID_PADDING = 14
const GRID_BORDER = 3

let host: HTMLDivElement | null = null
let wrapper: ReturnType<typeof mount> | null = null
let originalViewport: { width: number; height: number } | null = null

afterEach(async () => {
    wrapper?.unmount()
    wrapper = null
    host?.remove()
    host = null
    if (originalViewport) {
        await page.viewport(originalViewport.width, originalViewport.height)
        originalViewport = null
    }
})

describe('NumberInput responsive layout', () => {
    it.each(VIEWPORT_WIDTHS)('keeps both stepper buttons inside a narrow grid at %ipx', async (width) => {
        originalViewport = { width: window.innerWidth, height: window.innerHeight }
        await page.viewport(width, VIEWPORT_HEIGHT)
        host = document.createElement('div')
        Object.assign(host.style, {
            display: 'grid',
            position: 'fixed',
            left: `${PAGE_MARGIN}px`,
            top: `${PAGE_MARGIN}px`,
            width: `${width - PAGE_MARGIN * 2}px`,
            padding: `${GRID_PADDING}px`,
            border: `${GRID_BORDER}px solid`,
            boxSizing: 'border-box',
        })
        document.body.appendChild(host)
        wrapper = mount(NumberInput, { props: { modelValue: 4 }, attachTo: host })
        await nextTick()

        const input = host.querySelector('input')!
        const field = input.parentElement!
        const gridRect = host.getBoundingClientRect()
        const expectedWidth = gridRect.width - (GRID_PADDING + GRID_BORDER) * 2
        expect(field.getBoundingClientRect().width).toBeCloseTo(expectedWidth)
        for (const button of field.querySelectorAll('button')) {
            const rect = button.getBoundingClientRect()
            expect(rect.left).toBeGreaterThanOrEqual(gridRect.left)
            expect(rect.right).toBeLessThanOrEqual(gridRect.right)
        }
        expect(host.scrollWidth).toBe(host.clientWidth)
    })
})
