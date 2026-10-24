import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { createApp, nextTick, type App } from 'vue'
import '../../../dist/styles.css'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import PricingSection from './PricingSection.vue'

const VIEWPORT_HEIGHTS = { mobile: 844, desktop: 1000 }
const POPULAR_TEXT = '最具性价比'
const LONG_POPULAR_TEXT = '企业级专属权益推荐方案长期活动推荐用户优先体验计划'
const LAYOUT_CASES = [
    { viewportWidth: 320, containerWidth: 234, viewportHeight: VIEWPORT_HEIGHTS.mobile },
    { viewportWidth: 390, containerWidth: 304, viewportHeight: VIEWPORT_HEIGHTS.mobile },
    { viewportWidth: 1440, containerWidth: 650, viewportHeight: VIEWPORT_HEIGHTS.desktop },
]

const plans = [
    {
        name: 'Starter',
        description: 'For side projects',
        priceMonthly: '$0',
        priceAnnually: '$0',
        features: [
            { text: 'Priority support', included: true },
            { text: 'Custom themes', included: false },
        ],
        buttonText: 'Get Started',
    },
    {
        name: 'Pro',
        description: 'For professionals',
        priceMonthly: '$19',
        priceAnnually: '$15',
        features: [{ text: 'All components', included: true }],
        popular: true,
        buttonText: 'Go Pro',
    },
    {
        name: 'Team',
        description: 'For teams',
        priceMonthly: '$49',
        priceAnnually: '$39',
        features: [{ text: 'Team access', included: true }],
        buttonText: 'Contact Sales',
    },
]

let host: HTMLDivElement | null = null
let app: App | null = null
let originalViewport: { width: number; height: number } | null = null

afterEach(async () => {
    app?.unmount()
    app = null
    host?.remove()
    host = null
    if (originalViewport) {
        await page.viewport(originalViewport.width, originalViewport.height)
        originalViewport = null
    }
})

function mountPricingSection(containerWidth: number, popularText: string) {
    host = document.createElement('div')
    Object.assign(host.style, {
        position: 'fixed',
        left: '50%',
        top: '0',
        width: `${containerWidth}px`,
        transform: 'translateX(-50%)',
    })
    document.body.appendChild(host)

    app = createApp(PricingSection, { plans, billingMode: 'toggle', popularText })
    app.provide(LOCALE_INJECTION_KEY, en)
    app.mount(host)
}

function getTextRects(element: Element) {
    const range = document.createRange()
    range.selectNodeContents(element)
    return Array.from(range.getClientRects())
}

describe('PricingSection responsive badge layout', () => {
    it.each(LAYOUT_CASES)(
        'keeps the recommendation label readable at $viewportWidth px in a $containerWidth px container',
        async ({ viewportWidth, containerWidth, viewportHeight }) => {
            originalViewport = { width: window.innerWidth, height: window.innerHeight }
            await page.viewport(viewportWidth, viewportHeight)
            mountPricingSection(containerWidth, POPULAR_TEXT)
            await nextTick()
            await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

            const grid = host!.querySelector<HTMLElement>('.grid')!
            const popularPlan = Array.from(grid.children).find(plan => plan.textContent?.includes(POPULAR_TEXT)) as HTMLElement
            const badge = Array.from(popularPlan.querySelectorAll('span')).find(
                element => element.textContent?.trim() === POPULAR_TEXT,
            )!
            const ribbon = popularPlan.querySelector<HTMLElement>('.bg-pattern-hazard')!
            const planRect = popularPlan.getBoundingClientRect()
            const badgeRect = badge.getBoundingClientRect()
            const badgeTextRects = getTextRects(badge)
            const ribbonRect = ribbon.getBoundingClientRect()
            const titleRect = popularPlan.querySelector('h3')!.getBoundingClientRect()

            expect(badgeTextRects).toHaveLength(1)
            expect(badgeRect.left).toBeGreaterThanOrEqual(planRect.left)
            expect(badgeRect.right).toBeLessThanOrEqual(planRect.right)
            expect(badgeRect.bottom).toBeLessThanOrEqual(titleRect.top)

            for (const rect of badgeTextRects) {
                const topElement = document.elementFromPoint((rect.left + rect.right) / 2, (rect.top + rect.bottom) / 2)
                expect(topElement === badge || badge.contains(topElement)).toBe(true)
            }

            const textOverlap = badgeTextRects.find(rect =>
                Math.min(rect.bottom, ribbonRect.bottom) > Math.max(rect.top, ribbonRect.top)
                && Math.min(rect.right, ribbonRect.right) > Math.max(rect.left, ribbonRect.left),
            )
            if (textOverlap) {
                const x = (Math.max(textOverlap.left, ribbonRect.left) + Math.min(textOverlap.right, ribbonRect.right)) / 2
                const y = (Math.max(textOverlap.top, ribbonRect.top) + Math.min(textOverlap.bottom, ribbonRect.bottom)) / 2
                const topElement = document.elementFromPoint(x, y)
                expect(topElement === badge || badge.contains(topElement)).toBe(true)
            }
        },
    )

    it('wraps a long custom recommendation label within its plan card', async () => {
        originalViewport = { width: window.innerWidth, height: window.innerHeight }
        await page.viewport(1440, VIEWPORT_HEIGHTS.desktop)
        mountPricingSection(650, LONG_POPULAR_TEXT)
        await nextTick()
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

        const grid = host!.querySelector<HTMLElement>('.grid')!
        const popularPlan = Array.from(grid.children).find(
            plan => plan.textContent?.includes(LONG_POPULAR_TEXT),
        ) as HTMLElement
        const badge = Array.from(popularPlan.querySelectorAll('span')).find(
            element => element.textContent?.trim() === LONG_POPULAR_TEXT,
        )!
        const planRect = popularPlan.getBoundingClientRect()
        const badgeRect = badge.getBoundingClientRect()
        const titleRect = popularPlan.querySelector('h3')!.getBoundingClientRect()

        expect(getTextRects(badge).length).toBeGreaterThan(1)
        expect(badgeRect.left).toBeGreaterThanOrEqual(planRect.left)
        expect(badgeRect.right).toBeLessThanOrEqual(planRect.right)
        expect(badgeRect.bottom).toBeLessThanOrEqual(titleRect.top)
    })
})
