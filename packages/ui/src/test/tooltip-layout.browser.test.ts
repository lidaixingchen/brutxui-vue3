import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { defineComponent, h, nextTick, type PropType } from 'vue'
import { TooltipArrow, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'
import '../../dist/styles.css'
import { mount } from '@/test/browser-mount'
import TooltipContent from '@/components/tooltip/TooltipContent.vue'

const VIEWPORT_WIDTH_PX = 320
const VIEWPORT_HEIGHT_PX = 640
const LONG_CONTENT_HEIGHT_PX = 1200
const SHORT_CONTENT_HEIGHT_PX = 12
const EDGE_INSET_PX = 16
const POSITION_SETTLE_MS = 550

interface TooltipLayoutFixtureProps {
    top: number
    side: 'top' | 'bottom'
    contentHeight: number
}

const TooltipLayoutFixture = defineComponent({
    props: {
        top: { type: Number, required: true },
        side: { type: String as PropType<TooltipLayoutFixtureProps['side']>, required: true },
        contentHeight: { type: Number, required: true },
    },
    setup(props) {
        return () => h(TooltipProvider, { delayDuration: 0 }, {
            default: () => h(TooltipRoot, { open: true }, {
                default: () => h('div', [
                    h(TooltipTrigger, { asChild: true }, {
                        default: () => h('button', {
                            style: {
                                position: 'fixed',
                                top: `${props.top}px`,
                                left: `${VIEWPORT_WIDTH_PX / 2}px`,
                            },
                        }, 'Trigger'),
                    }),
                    h(TooltipContent, {
                        side: props.side,
                        'data-testid': 'tooltip-content',
                    }, {
                        default: () => [
                            h('div', {
                                style: { minHeight: `${props.contentHeight}px` },
                            }, 'Tooltip content'),
                            h(TooltipArrow, { 'data-testid': 'tooltip-arrow' }),
                        ],
                    }),
                ]),
            }),
        })
    },
})

let host: HTMLDivElement | null = null
let activeUnmount: (() => void) | null = null
let originalViewport: { width: number; height: number } | null = null

async function settle() {
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, POSITION_SETTLE_MS))
    await nextTick()
}

async function mountTooltip(props: TooltipLayoutFixtureProps) {
    originalViewport ??= { width: window.innerWidth, height: window.innerHeight }
    await page.viewport(VIEWPORT_WIDTH_PX, VIEWPORT_HEIGHT_PX)
    host = document.createElement('div')
    document.body.append(host)
    const wrapper = mount(TooltipLayoutFixture, { props: { ...props }, attachTo: host })
    activeUnmount = wrapper.unmount
    await settle()
    const content = document.querySelector<HTMLElement>('[data-testid="tooltip-content"]')
    expect(content).not.toBeNull()
    return content!
}

afterEach(async () => {
    activeUnmount?.()
    activeUnmount = null
    host?.remove()
    host = null
    if (originalViewport) {
        await page.viewport(originalViewport.width, originalViewport.height)
        originalViewport = null
    }
    document.body.style.overflow = ''
    document.body.style.pointerEvents = ''
})

describe('Tooltip viewport layout', () => {
    it('bounds long content to the available height above a centered trigger and keeps it scrollable', async () => {
        const content = await mountTooltip({
            top: VIEWPORT_HEIGHT_PX / 2,
            side: 'top',
            contentHeight: LONG_CONTENT_HEIGHT_PX,
        })

        const rect = content.getBoundingClientRect()
        expect(rect.top).toBeGreaterThanOrEqual(0)
        expect(rect.bottom).toBeLessThanOrEqual(VIEWPORT_HEIGHT_PX)
        expect(content.scrollHeight).toBeGreaterThan(content.clientHeight)
        expect(content.querySelector('[data-testid="tooltip-arrow"]')).not.toBeNull()
        content.scrollTop = content.scrollHeight
        expect(content.scrollTop).toBeGreaterThan(0)
    })

    it('keeps a short tooltip compact at the top and bottom sides', async () => {
        const topContent = await mountTooltip({
            top: VIEWPORT_HEIGHT_PX / 2,
            side: 'top',
            contentHeight: SHORT_CONTENT_HEIGHT_PX,
        })
        const topHeight = topContent.getBoundingClientRect().height
        expect(topHeight).toBeLessThan(VIEWPORT_HEIGHT_PX / 2)
        expect(topContent.scrollHeight).toBe(topContent.clientHeight)

        activeUnmount?.()
        activeUnmount = null
        host?.remove()
        host = null
        const bottomContent = await mountTooltip({
            top: VIEWPORT_HEIGHT_PX / 2,
            side: 'bottom',
            contentHeight: SHORT_CONTENT_HEIGHT_PX,
        })
        expect(bottomContent.getBoundingClientRect().height).toBeLessThan(VIEWPORT_HEIGHT_PX / 2)
        expect(bottomContent.scrollHeight).toBe(bottomContent.clientHeight)
    })

    it('preserves collision flipping for long content near the viewport edges', async () => {
        const topEdgeContent = await mountTooltip({
            top: EDGE_INSET_PX,
            side: 'top',
            contentHeight: LONG_CONTENT_HEIGHT_PX,
        })
        expect(topEdgeContent.getAttribute('data-side')).toBe('bottom')
        expect(topEdgeContent.getBoundingClientRect().top).toBeGreaterThanOrEqual(0)
        expect(topEdgeContent.getBoundingClientRect().bottom).toBeLessThanOrEqual(VIEWPORT_HEIGHT_PX)

        activeUnmount?.()
        activeUnmount = null
        host?.remove()
        host = null
        const bottomEdgeContent = await mountTooltip({
            top: VIEWPORT_HEIGHT_PX - EDGE_INSET_PX,
            side: 'bottom',
            contentHeight: LONG_CONTENT_HEIGHT_PX,
        })
        expect(bottomEdgeContent.getAttribute('data-side')).toBe('top')
        expect(bottomEdgeContent.getBoundingClientRect().top).toBeGreaterThanOrEqual(0)
        expect(bottomEdgeContent.getBoundingClientRect().bottom).toBeLessThanOrEqual(VIEWPORT_HEIGHT_PX)
    })
})
