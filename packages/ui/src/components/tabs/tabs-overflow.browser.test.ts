import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { defineComponent, Fragment, h, nextTick } from 'vue'
import '../../../dist/styles.css'
import { mount } from '@/test/browser-mount'
import Tabs from './Tabs.vue'
import TabsContent from './TabsContent.vue'
import TabsList from './TabsList.vue'
import TabsTrigger from './TabsTrigger.vue'

const COMPACT_VIEWPORT_WIDTH_PX = 320
const NARROW_VIEWPORT_WIDTH_PX = 390
const VIEWPORT_HEIGHT_PX = 844
const LAYOUT_TOLERANCE_PX = 1

const viewportWidths = [COMPACT_VIEWPORT_WIDTH_PX, NARROW_VIEWPORT_WIDTH_PX] as const
const tabs = [
    { label: '账户信息安全验证与通知偏好配置', value: 'account' },
    { label: 'ProjectConfigurationAndNotificationPreferences', value: 'configuration' },
    { label: '通知', value: 'notifications' },
]

let host: HTMLDivElement | null = null
let mounted: ReturnType<typeof mount> | null = null
let originalViewport: { width: number; height: number } | null = null
let originalBodyMargin = ''

function createHost() {
    host = document.createElement('div')
    Object.assign(host.style, {
        position: 'fixed',
        inset: '0 auto auto 0',
        width: '100vw',
        boxSizing: 'border-box',
    })
    document.body.append(host)
    return host
}

async function setViewport(width: number) {
    originalViewport = { width: window.innerWidth, height: window.innerHeight }
    await page.viewport(width, VIEWPORT_HEIGHT_PX)
    originalBodyMargin = document.body.style.margin
    document.body.style.margin = '0'
}

function getTextBounds(element: HTMLElement): DOMRect {
    const range = document.createRange()
    range.selectNodeContents(element)
    return range.getBoundingClientRect()
}

function expectTextFullyVisible(list: HTMLElement, tab: HTMLElement) {
    const textBounds = getTextBounds(tab)
    const listBounds = list.getBoundingClientRect()
    const visibleLeft = listBounds.left + list.clientLeft
    const visibleRight = visibleLeft + list.clientWidth

    expect(textBounds.left).toBeGreaterThanOrEqual(visibleLeft - LAYOUT_TOLERANCE_PX)
    expect(textBounds.right).toBeLessThanOrEqual(visibleRight + LAYOUT_TOLERANCE_PX)
}

function createSlotTabs(listClass: string) {
    return defineComponent({
        setup() {
            return () => h(Tabs, { defaultValue: 'general', class: 'w-full' }, () => h(Fragment, {}, [
                h(TabsList, { class: listClass }, () => [
                    h(TabsTrigger, { value: 'general', variant: 'primary' }, () => 'General'),
                    h(TabsTrigger, { value: 'security', variant: 'slots' }, () => 'Security'),
                    h(TabsTrigger, { value: 'notifications', variant: 'secondary' }, () => 'Alerts'),
                ]),
                h(TabsContent, { value: 'general' }, () => 'General panel'),
                h(TabsContent, { value: 'security' }, () => 'Security panel'),
                h(TabsContent, { value: 'notifications' }, () => 'Alerts panel'),
            ]))
        },
    })
}

afterEach(async () => {
    mounted?.unmount()
    mounted = null
    host?.remove()
    host = null
    document.body.style.margin = originalBodyMargin
    if (originalViewport) {
        await page.viewport(originalViewport.width, originalViewport.height)
        originalViewport = null
    }
})

describe.each(viewportWidths)('Tabs horizontal overflow at %spx viewport', (viewportWidth) => {
    it('keeps the first and last labels fully reachable by horizontal scrolling', async () => {
        await setViewport(viewportWidth)
        mounted = mount(Tabs, {
            props: { tabs, defaultValue: 'account' },
            attachTo: createHost(),
        })
        await nextTick()

        const list = host?.querySelector<HTMLElement>('[role="tablist"]')
        const renderedTabs = Array.from(host?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [])
        expect(list).toBeDefined()
        expect(renderedTabs.map(tab => tab.textContent?.trim())).toEqual(tabs.map(tab => tab.label))
        expect(list!.scrollWidth).toBeGreaterThan(list!.clientWidth)

        list!.scrollLeft = 0
        expectTextFullyVisible(list!, renderedTabs[0]!)

        list!.scrollLeft = list!.scrollWidth
        expect(list!.scrollLeft).toBeGreaterThan(0)
        expectTextFullyVisible(list!, renderedTabs.at(-1)!)
    })
})

describe('Tabs short labels', () => {
    it('keeps the labels centered and preserves variant and keyboard behavior', async () => {
        await setViewport(NARROW_VIEWPORT_WIDTH_PX)
        const SlotTabs = createSlotTabs('w-full')
        mounted = mount(SlotTabs, { attachTo: createHost() })
        await nextTick()

        const list = host?.querySelector<HTMLElement>('[role="tablist"]')
        const renderedTabs = Array.from(host?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [])
        expect(list).toBeDefined()
        expect(list!.scrollWidth).toBe(list!.clientWidth)

        const first = renderedTabs[0]!.getBoundingClientRect()
        const last = renderedTabs.at(-1)!.getBoundingClientRect()
        const listBounds = list!.getBoundingClientRect()
        const tabGroupCenter = (first.left + last.right) / 2
        const listCenter = listBounds.left + list!.clientLeft + list!.clientWidth / 2
        expect(Math.abs(tabGroupCenter - listCenter)).toBeLessThanOrEqual(LAYOUT_TOLERANCE_PX)

        renderedTabs[0]!.focus()
        await userEvent.keyboard('{ArrowRight}')
        await nextTick()
        expect(renderedTabs[1]!.getAttribute('aria-selected')).toBe('true')
        expect(document.activeElement).toBe(renderedTabs[1])
    })

    it('allows the consuming alignment utility to override the default alignment', async () => {
        await setViewport(NARROW_VIEWPORT_WIDTH_PX)
        mounted = mount(createSlotTabs('w-full justify-end'), { attachTo: createHost() })
        await nextTick()

        const list = host!.querySelector<HTMLElement>('[role="tablist"]')!
        const renderedTabs = Array.from(list.querySelectorAll<HTMLElement>('[role="tab"]'))
        const style = getComputedStyle(list)
        const contentRight = list.getBoundingClientRect().right
            - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight)

        expect(style.justifyContent).toBe('flex-end')
        expect(Math.abs(contentRight - renderedTabs.at(-1)!.getBoundingClientRect().right))
            .toBeLessThanOrEqual(LAYOUT_TOLERANCE_PX)
    })
})
