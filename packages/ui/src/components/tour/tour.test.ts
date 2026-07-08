import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import { en } from '@/locales/en'
import Tour from './Tour.vue'
import type { TourStep } from './Tour.vue'

const localeProvide = { [LOCALE_INJECTION_KEY]: en }
const TARGET_ID_1 = 'test-target-1'
const TARGET_ID_2 = 'test-target-2'

interface MockCanvasContext {
    scale: any
    clearRect: any
    fillRect: any
    strokeRect: any
    fillStyle: string
    strokeStyle: string
    lineWidth: number
    lineJoin: string
}

describe('Tour.vue', () => {
    let mockContextInstance: MockCanvasContext
    let originalGetContext: any
    let originalGetBoundingClientRect: any
    let originalScrollIntoView: any

    beforeEach(() => {
        mockContextInstance = {
            scale: vi.fn(),
            clearRect: vi.fn(),
            fillRect: vi.fn(),
            strokeRect: vi.fn(),
            fillStyle: '',
            strokeStyle: '',
            lineWidth: 0,
            lineJoin: '',
        }
        originalGetContext = HTMLCanvasElement.prototype.getContext
        HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockContextInstance) as any

        originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
        HTMLElement.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
            left: 100,
            top: 200,
            width: 300,
            height: 400,
            right: 400,
            bottom: 600,
        } as DOMRect)

        originalScrollIntoView = HTMLElement.prototype.scrollIntoView
        HTMLElement.prototype.scrollIntoView = vi.fn()

        const el1 = document.createElement('div')
        el1.id = TARGET_ID_1
        document.body.appendChild(el1)

        const el2 = document.createElement('div')
        el2.id = TARGET_ID_2
        document.body.appendChild(el2)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        HTMLCanvasElement.prototype.getContext = originalGetContext
        HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect
        HTMLElement.prototype.scrollIntoView = originalScrollIntoView
        
        const el1 = document.getElementById(TARGET_ID_1)
        if (el1) {
            document.body.removeChild(el1)
        }
        const el2 = document.getElementById(TARGET_ID_2)
        if (el2) {
            document.body.removeChild(el2)
        }
    })

    it('renders step content and handles step rotation correctly', async () => {
        const steps: TourStep[] = [
            {
                target: `#${TARGET_ID_1}`,
                title: 'Step 1 Title',
                description: 'Step 1 Description',
            },
            {
                target: `#${TARGET_ID_2}`,
                title: 'Step 2 Title',
                description: 'Step 2 Description',
            },
        ]

        const wrapper = mount(Tour, {
            props: {
                steps,
                current: 0,
                open: true,
            },
            global: { provide: localeProvide },
        })

        await nextTick()

        expect(wrapper.text()).toContain('Step 1 Title')
        expect(wrapper.text()).toContain('Step 1 Description')

        const buttons = wrapper.findAll('button')
        const nextButton = buttons.find((btn) => btn.text() === 'Next')
        expect(nextButton).toBeDefined()

        if (nextButton) {
            await nextButton.trigger('click')
        }

        expect(wrapper.emitted('update:current')).toBeDefined()
        const currentEmits = wrapper.emitted('update:current')
        expect(currentEmits ? currentEmits[0] : []).toEqual([1])
    })

    it('responds to Escape and Enter keydown events', async () => {
        const steps: TourStep[] = [
            {
                target: `#${TARGET_ID_1}`,
                title: 'Step 1 Title',
                description: 'Step 1 Description',
            },
            {
                target: `#${TARGET_ID_2}`,
                title: 'Step 2 Title',
                description: 'Step 2 Description',
            },
        ]

        const wrapper = mount(Tour, {
            props: {
                steps,
                current: 0,
                open: true,
            },
            global: { provide: localeProvide },
        })

        await nextTick()

        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
        window.dispatchEvent(enterEvent)

        expect(wrapper.emitted('update:current')).toBeDefined()
        const currentEmits = wrapper.emitted('update:current')
        expect(currentEmits ? currentEmits[0] : []).toEqual([1])

        const escEvent = new KeyboardEvent('keydown', { key: 'Escape' })
        window.dispatchEvent(escEvent)

        expect(wrapper.emitted('update:open')).toBeDefined()
        const openEmits = wrapper.emitted('update:open')
        expect(openEmits ? openEmits[0] : []).toEqual([false])
    })

    it('redraws canvas and updates positioning on window resize and scroll events', async () => {
        const steps: TourStep[] = [
            {
                target: `#${TARGET_ID_1}`,
                title: 'Step 1 Title',
                description: 'Step 1 Description',
            },
        ]

        vi.useFakeTimers()
        try {
            mount(Tour, {
                props: {
                    steps,
                    current: 0,
                    open: true,
                },
                global: { provide: localeProvide },
            })

            await nextTick()
            await nextTick()

            expect(mockContextInstance.strokeRect).toHaveBeenCalled()
            mockContextInstance.strokeRect.mockClear()

            window.dispatchEvent(new Event('resize'))
            expect(mockContextInstance.strokeRect).toHaveBeenCalled()
            mockContextInstance.strokeRect.mockClear()

            vi.advanceTimersByTime(200)
            window.dispatchEvent(new Event('scroll'))
            expect(mockContextInstance.strokeRect).toHaveBeenCalled()
        } finally {
            vi.useRealTimers()
        }
    })

    it('mounts when ResizeObserver is unavailable', async () => {
        vi.stubGlobal('ResizeObserver', undefined)

        expect(() => {
            mount(Tour, {
                props: {
                    steps: [{
                        target: `#${TARGET_ID_1}`,
                        title: 'Step 1 Title',
                    }],
                    current: 0,
                    open: true,
                },
                global: { provide: localeProvide },
            })
        }).not.toThrow()

        await nextTick()
        await nextTick()
        expect(mockContextInstance.strokeRect).toHaveBeenCalled()
    })

    it('mounts when canvas 2d context is unavailable', async () => {
        HTMLCanvasElement.prototype.getContext = vi.fn(() => {
            throw new Error('canvas disabled')
        }) as typeof originalGetContext

        expect(() => {
            mount(Tour, {
                props: {
                    steps: [{
                        target: `#${TARGET_ID_1}`,
                        title: 'Step 1 Title',
                    }],
                    current: 0,
                    open: true,
                },
                global: { provide: localeProvide },
            })
        }).not.toThrow()

        await nextTick()
        await nextTick()
    })
})
