import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { computeAccessibleName } from 'dom-accessibility-api'
import { defineComponent, h, nextTick } from 'vue'
import '../../../dist/styles.css'
import { mount } from '@/test/browser-mount'
import Menu from './Menu.vue'
import MenuItem from './MenuItem.vue'

const MENU_VIEWPORTS = [
    { width: 320, height: 640 },
    { width: 390, height: 844 },
]
const MENU_ICON_SIZE = 16
const LONG_ENGLISH_LABEL = 'VeryLongUnbrokenNavigationItemIdentifier'.repeat(3)
const LONG_CHINESE_LABEL = '这是一段需要在垂直菜单中自然换行的中文导航标签'.repeat(3)

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

function getMenuItem(index: string): HTMLElement {
    const item = host?.querySelector<HTMLElement>(`[data-menu-index="${index}"]`)
    if (!item) throw new Error(`Menu item not found: ${index}`)
    return item
}

function getTextRects(element: Element): DOMRect[] {
    const range = document.createRange()
    range.selectNodeContents(element)
    return [...range.getClientRects()]
}

describe('Menu long label layout browser integration', () => {
    it.each(MENU_VIEWPORTS)(
        'wraps complete labels inside vertical menu items at $width px',
        async ({ width, height }) => {
            originalViewport = { width: window.innerWidth, height: window.innerHeight }
            await page.viewport(width, height)

            host = document.createElement('div')
            Object.assign(host.style, {
                margin: '12px',
                width: `${width - 24}px`,
            })
            document.body.append(host)

            const onSelect = vi.fn()
            const component = defineComponent({
                setup() {
                    return () => h(Menu, {
                        id: 'long-label-menu',
                        mode: 'vertical',
                        defaultActive: 'english',
                        onSelect,
                    }, {
                        default: () => [
                            h(MenuItem, {
                                index: 'english',
                                'data-menu-index': 'english',
                            }, {
                                default: () => LONG_ENGLISH_LABEL,
                            }),
                            h(MenuItem, {
                                index: 'chinese',
                                disabled: true,
                                'data-menu-index': 'chinese',
                            }, {
                                default: () => [
                                    h('svg', {
                                        'aria-hidden': 'true',
                                        width: MENU_ICON_SIZE,
                                        height: MENU_ICON_SIZE,
                                        viewBox: '0 0 16 16',
                                    }),
                                    h('span', { id: 'chinese-label' }, LONG_CHINESE_LABEL),
                                ],
                            }),
                            h(MenuItem, {
                                index: 'footer',
                                'data-menu-index': 'footer',
                            }, {
                                default: () => 'Footer navigation item',
                            }),
                        ],
                    })
                },
            })
            wrapper = mount(component, { attachTo: host })
            await nextTick()

            const menu = host.querySelector<HTMLElement>('#long-label-menu')
            if (!menu) throw new Error('Vertical menu not found')
            const englishItem = getMenuItem('english')
            const chineseItem = getMenuItem('chinese')
            const footerItem = getMenuItem('footer')
            const chineseLabel = chineseItem.querySelector<HTMLElement>('#chinese-label')
            const icon = chineseItem.querySelector<SVGElement>('svg')
            if (!chineseLabel || !icon) throw new Error('Chinese menu label or icon not found')

            const englishRects = getTextRects(englishItem)
            const chineseRects = getTextRects(chineseLabel)
            const menuBounds = menu.getBoundingClientRect()
            const englishBounds = englishItem.getBoundingClientRect()
            const chineseBounds = chineseItem.getBoundingClientRect()

            expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width)
            expect(menu.scrollWidth).toBe(menu.clientWidth)
            expect(englishRects.length).toBeGreaterThan(1)
            expect(chineseRects.length).toBeGreaterThan(1)
            expect(englishRects.every(rect => rect.right <= englishBounds.right)).toBe(true)
            expect(chineseRects.every(rect => rect.right <= chineseBounds.right)).toBe(true)
            expect(englishItem.getBoundingClientRect().right).toBeLessThanOrEqual(menuBounds.right)
            expect(chineseItem.getBoundingClientRect().right).toBeLessThanOrEqual(menuBounds.right)
            expect(computeAccessibleName(englishItem)).toBe(LONG_ENGLISH_LABEL)
            expect(computeAccessibleName(chineseItem)).toBe(LONG_CHINESE_LABEL)
            expect(icon.getBoundingClientRect().width).toBe(MENU_ICON_SIZE)
            expect(englishItem.getAttribute('tabindex')).toBe('0')
            expect(chineseItem.getAttribute('aria-disabled')).toBe('true')
            expect(chineseItem.getAttribute('tabindex')).toBe('-1')

            const activeBackground = getComputedStyle(englishItem).backgroundColor
            expect(activeBackground).not.toBe(getComputedStyle(footerItem).backgroundColor)
            chineseItem.click()
            expect(onSelect).not.toHaveBeenCalled()

            englishItem.focus()
            await userEvent.keyboard('[End]')
            await nextTick()
            expect(document.activeElement).toBe(footerItem)
            expect(footerItem.getAttribute('tabindex')).toBe('0')

            await userEvent.keyboard('[Enter]')
            await nextTick()
            expect(onSelect).toHaveBeenCalledExactlyOnceWith('footer')
            await Promise.all(footerItem.getAnimations().map(animation => animation.finished))
            expect(getComputedStyle(footerItem).backgroundColor).toBe(activeBackground)
        },
    )
})
