import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { nextTick } from 'vue'
import '../../../dist/styles.css'
import { mount } from '@/test/browser-mount'
import Stepper from './Stepper.vue'

const VIEWPORT_WIDTH = 390
const VIEWPORT_HEIGHT = 844
const STEPPER_CONTENT_WIDTH = 258
const steps = [
    { id: 1, title: '账户信息', description: '填写基本资料' },
    { id: 2, title: '安全设置', description: '设置密码与验证' },
    { id: 3, title: '偏好配置', description: '个性化设置' },
    { id: 4, title: '完成', description: '注册成功' },
]

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

describe('Stepper horizontal label geometry', () => {
    it.each([
        { name: '原始描述', fixtureSteps: steps, expectTruncation: false },
        {
            name: '长描述',
            fixtureSteps: steps.map(step => ({ ...step, description: `${step.description} — Complete the account information and verification` })),
            expectTruncation: true,
        },
    ])('$name stays within each step and clips overflowing text', async ({ fixtureSteps, expectTruncation }) => {
        originalViewport = { width: window.innerWidth, height: window.innerHeight }
        await page.viewport(VIEWPORT_WIDTH, VIEWPORT_HEIGHT)
        host = document.createElement('div')
        host.style.width = `${STEPPER_CONTENT_WIDTH}px`
        document.body.appendChild(host)
        wrapper = mount(Stepper, {
            props: { steps: fixtureSteps, modelValue: 0, orientation: 'horizontal' },
            attachTo: host,
        })
        await nextTick()
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

        const stepItems = [...host.querySelectorAll<HTMLElement>('[role="listitem"]')]
        const stepRects = stepItems.map(step => step.getBoundingClientRect())
        const descriptions = stepItems.map(step => step.querySelectorAll<HTMLElement>('p')[1]!)
        const descriptionRects = descriptions.map(description => description.getBoundingClientRect())

        for (const [index, rect] of descriptionRects.entries()) {
            expect(rect.left).toBeGreaterThanOrEqual(stepRects[index].left)
            expect(rect.right).toBeLessThanOrEqual(stepRects[index].right)
        }
        for (let index = 0; index < descriptionRects.length - 1; index++) {
            expect(descriptionRects[index + 1].left).toBeGreaterThanOrEqual(descriptionRects[index].right)
        }

        for (const description of descriptions) {
            const style = getComputedStyle(description)
            expect(style.whiteSpace).toBe('nowrap')
            expect(style.overflow).toBe('hidden')
            expect(style.textOverflow).toBe('ellipsis')
            if (expectTruncation) {
                expect(description.scrollWidth).toBeGreaterThan(description.clientWidth)
            }
        }
    })
})
