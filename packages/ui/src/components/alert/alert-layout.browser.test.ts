import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick } from 'vue'
import { Info } from '@lucide/vue'
import { mount } from '@/test/browser-mount'
import Alert from './Alert.vue'
import AlertTitle from './AlertTitle.vue'
import AlertDescription from './AlertDescription.vue'
import '../../../dist/styles.css'

const WIDTHS = [320, 390]
const HEIGHT_PX = 844
const PAGE_PADDING_PX = 16
const TOLERANCE_PX = 1
const CASES = [
    {
        title: 'DeploymentValidationRequiresAdditionalReviewAndApproval',
        description: 'A'.repeat(300),
        withIcon: false,
        asChild: false,
    },
    {
        title: '部署验证与审批结果'.repeat(8),
        description: '请检查本次提交的配置并确认后续处理方式。'.repeat(12),
        withIcon: false,
        asChild: true,
    },
    {
        title: 'The deployment needs your approval',
        description: `Read the deployment details at https://example.test/${'validation'.repeat(30)}`,
        withIcon: true,
        asChild: false,
    },
]

let wrapper: ReturnType<typeof mount> | undefined
let originalViewport: { width: number; height: number } | undefined

afterEach(async () => {
    wrapper?.unmount()
    wrapper = undefined
    if (originalViewport) await page.viewport(originalViewport.width, originalViewport.height)
    originalViewport = undefined
})

function textLines(element: HTMLElement) {
    const range = document.createRange()
    range.selectNodeContents(element)
    return [...range.getClientRects()].filter(rect => rect.width > 0 && rect.height > 0)
}

describe.each(WIDTHS)('Alert 在 %spx 下的长文本布局', (width) => {
    it.each(CASES)('完整呈现 $title 并保留关闭操作', async ({ title, description, withIcon, asChild }) => {
        originalViewport = { width: window.innerWidth, height: window.innerHeight }
        await page.viewport(width, HEIGHT_PX)
        let closeCount = 0
        wrapper = mount(defineComponent({
            setup: () => () => h('main', {
                style: { width: '100%', boxSizing: 'border-box', padding: `${PAGE_PADDING_PX}px` },
            }, [h(Alert, { closable: true, onClose: () => closeCount++ }, () => [
                ...(withIcon ? [h(Info, { 'data-testid': 'alert-icon', 'aria-hidden': 'true' })] : []),
                h(AlertTitle, { asChild, 'data-testid': 'alert-title' }, () => asChild ? h('h2', {}, title) : title),
                h(AlertDescription, { 'data-testid': 'alert-description' }, () => description),
            ])]),
        }))
        await nextTick()

        const root = wrapper.element.querySelector<HTMLElement>('[role="alert"]')!
        const heading = root.querySelector<HTMLElement>('[data-testid="alert-title"]')!
        const summary = root.querySelector<HTMLElement>('[data-testid="alert-description"]')!
        const close = root.querySelector<HTMLButtonElement>('button')!
        const closeBounds = close.getBoundingClientRect()
        const crossBounds = close.querySelector('svg')!.getBoundingClientRect()

        expect(heading.textContent).toBe(title)
        expect(heading.tagName).toBe(asChild ? 'H2' : 'H5')
        expect(summary.textContent).toBe(description)
        expect(root.getAttribute('aria-describedby')).toBe(summary.id)
        expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width)

        for (const text of [heading, summary]) {
            const bounds = text.getBoundingClientRect()
            const lines = textLines(text)
            expect(lines.length).toBeGreaterThan(1)
            expect(lines.every(line => line.right <= bounds.right + TOLERANCE_PX)).toBe(true)
            expect(lines.every(line => line.right <= closeBounds.left + TOLERANCE_PX)).toBe(true)
            if (withIcon) {
                const icon = root.querySelector('[data-testid="alert-icon"]')!.getBoundingClientRect()
                expect(lines.every(line => line.left >= icon.right - TOLERANCE_PX)).toBe(true)
            }
        }

        expect(crossBounds.width).toBeGreaterThan(0)
        expect(crossBounds.left).toBeGreaterThanOrEqual(closeBounds.left - TOLERANCE_PX)
        expect(crossBounds.right).toBeLessThanOrEqual(closeBounds.right + TOLERANCE_PX)
        const hitTarget = document.elementFromPoint(
            closeBounds.left + closeBounds.width / 2,
            closeBounds.top + closeBounds.height / 2,
        )
        expect(hitTarget !== null && close.contains(hitTarget)).toBe(true)

        if (asChild) {
            close.focus()
            await userEvent.keyboard('{Enter}')
        } else {
            await userEvent.click(close)
        }
        expect(closeCount).toBe(1)
    })
})
