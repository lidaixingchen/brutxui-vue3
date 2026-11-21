import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { computeAccessibleName } from 'dom-accessibility-api'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@/test/browser-mount'
import { destroyFallback, useMessage } from '@/composables/useMessage'
import '../../../dist/styles.css'

const VIEWPORTS = [
    { width: 320, height: 844 },
    { width: 390, height: 844 },
]

const MESSAGE_CASES = [
    {
        title: 'W'.repeat(120),
        description: 'A'.repeat(300),
    },
    {
        title: '这是一条较长的中文消息标题'.repeat(10),
        description: '请检查所有必要信息并保存当前工作内容。'.repeat(18),
    },
    {
        title: 'A message with a long paragraph',
        description: 'This notification contains a complete paragraph with spaces and useful details for the person reading it. '.repeat(12),
    },
]

let closeMessage: (() => void) | null = null
let mounted: ReturnType<typeof mount> | null = null
let originalViewport: { width: number; height: number } | null = null

afterEach(async () => {
    closeMessage?.()
    closeMessage = null
    mounted?.unmount()
    mounted = null
    destroyFallback()
    if (originalViewport) {
        await page.viewport(originalViewport.width, originalViewport.height)
        originalViewport = null
    }
})

async function mountMessage(title: string, description: string): Promise<HTMLElement> {
    const MessageFixture = defineComponent({
        setup() {
            const { show } = useMessage()
            closeMessage = show({ type: 'warning', title, description, duration: 0 })
            return () => h('div')
        },
    })

    mounted = mount(MessageFixture)
    await expect.poll(() => document.querySelector<HTMLElement>('[role="status"]')).not.toBeNull()
    await nextTick()
    const message = document.querySelector<HTMLElement>('[role="status"]')
    if (!message) throw new Error('Message status region not found')
    await expect.poll(() => message.classList.contains('brutx-message-enter-active')).toBe(false)
    return message
}

function getTextRects(element: Element): DOMRect[] {
    const range = document.createRange()
    range.selectNodeContents(element)
    return [...range.getClientRects()]
}

async function expectMessageClosed() {
    await expect.poll(() => document.querySelector('[role="status"]')).toBeNull()
}

describe('Message 长文本浏览器布局', () => {
    it.each(VIEWPORTS)('在 $width px 视口内换行并保留消息内容和关闭操作', async ({ width, height }) => {
        originalViewport = { width: window.innerWidth, height: window.innerHeight }
        await page.viewport(width, height)

        for (const [index, content] of MESSAGE_CASES.entries()) {
            const message = await mountMessage(content.title, content.description)
            const title = message.querySelector<HTMLElement>('p')
            const description = message.querySelectorAll<HTMLElement>('p')[1]
            const textColumn = title?.parentElement
            const closeButton = message.querySelector<HTMLButtonElement>('button')
            const icon = message.querySelector<SVGElement>('svg')
            const container = message.parentElement

            if (!title || !description || !textColumn || !closeButton || !icon || !container) {
                throw new Error('Message content, icon, close button, or container not found')
            }

            expect(title.textContent).toBe(content.title)
            expect(description.textContent).toBe(content.description)
            expect(message.getAttribute('aria-live')).toBe('polite')
            expect(computeAccessibleName(closeButton).trim()).not.toBe('')

            const textBounds = textColumn.getBoundingClientRect()
            expect(getTextRects(title).length).toBeGreaterThan(1)
            expect(getTextRects(description).length).toBeGreaterThan(1)
            expect(getTextRects(title).every(rect => rect.right <= textBounds.right + 1)).toBe(true)
            expect(getTextRects(description).every(rect => rect.right <= textBounds.right + 1)).toBe(true)
            expect(message.scrollWidth).toBeLessThanOrEqual(message.clientWidth)
            expect(container.scrollWidth).toBeLessThanOrEqual(container.clientWidth)
            expect(icon.getBoundingClientRect().width).toBeCloseTo(24)

            const closeBounds = closeButton.getBoundingClientRect()
            expect(closeButton.offsetWidth).toBe(32)
            expect(closeButton.offsetHeight).toBe(32)
            expect(closeBounds.left).toBeGreaterThanOrEqual(0)
            expect(closeBounds.right).toBeLessThanOrEqual(width)
            const hitTarget = document.elementFromPoint(
                closeBounds.left + closeBounds.width / 2,
                closeBounds.top + closeBounds.height / 2,
            )
            expect(hitTarget !== null && closeButton.contains(hitTarget)).toBe(true)

            if (index === 0) {
                await userEvent.click(closeButton)
                await expectMessageClosed()
            } else if (index === 1) {
                await userEvent.tab()
                expect(document.activeElement).toBe(closeButton)
                await userEvent.keyboard('[Enter]')
                await expectMessageClosed()
            } else {
                closeMessage?.()
                await expectMessageClosed()
            }

            mounted?.unmount()
            mounted = null
            closeMessage = null
        }
    })
})
