import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@/test/browser-mount'
import '../../../dist/styles.css'
import HeaderSection from './HeaderSection.vue'

const NAV_ITEMS = [
    '产品与解决方案',
    '团队协作工作台',
    '客户服务与支持',
    '开发者资源中心',
    '企业安全与合规',
    '价格与订阅方案',
].map(label => ({ label }))

let mounted: ReturnType<typeof mount> | null = null

afterEach(() => {
    mounted?.unmount()
    mounted = null
})

describe.each([200, 768, 944, 960, 1024])('HeaderSection layout in a %ipx container', width => {
    it('keeps the brand, CTA, and one navigation path within the available width', async () => {
        mounted = mount(defineComponent({
            setup: () => () => h('div', { style: { width: String(width) + 'px' } }, [
                h(HeaderSection, {
                    logoText: 'BRUTX',
                    navItems: NAV_ITEMS,
                    ctaText: '立即开始使用并查看组件文档',
                }),
            ]),
        }))
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

        const inner = mounted.element.querySelector<HTMLElement>('.header-section-inner')!
        const brand = mounted.element.querySelector<HTMLElement>('.header-section-brand')!
        const cta = mounted.element.querySelector<HTMLElement>('.header-section-cta')!
        const menu = mounted.element.querySelector<HTMLElement>('.header-section-menu-trigger')!
        const nav = mounted.element.querySelector<HTMLElement>('.header-section-nav')!
        const inlineNavigationVisible = getComputedStyle(nav).display !== 'none'
        const menuVisible = getComputedStyle(menu).display !== 'none'

        expect(brand.getBoundingClientRect().width).toBeGreaterThan(0)
        expect(cta.getBoundingClientRect().width).toBeGreaterThan(0)
        expect(cta.scrollHeight).toBeLessThanOrEqual(cta.clientHeight)
        expect(inner.scrollWidth).toBeLessThanOrEqual(inner.clientWidth)
        expect(inlineNavigationVisible || menuVisible).toBe(true)

        if (inlineNavigationVisible) {
            const brandBounds = brand.getBoundingClientRect()
            const actionsBounds = cta.parentElement!.getBoundingClientRect()
            for (const button of nav.querySelectorAll('button')) {
                const bounds = button.getBoundingClientRect()
                expect(bounds.left).toBeGreaterThanOrEqual(brandBounds.right)
                expect(bounds.right).toBeLessThanOrEqual(actionsBounds.left)
                expect(button.scrollHeight).toBeLessThanOrEqual(button.clientHeight)
            }
        }

        if (width === 200) {
            const lineHeight = Number.parseFloat(getComputedStyle(cta).lineHeight)
            expect(cta.clientHeight).toBeGreaterThan(lineHeight)
        }
    })
})
