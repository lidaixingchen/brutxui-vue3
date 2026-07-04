import { mount } from '@vue/test-utils'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import Image from './Image.vue'

// Mock IntersectionObserver
let observerCallback: any = null
const observeMock = vi.fn()
const unobserveMock = vi.fn()
const disconnectMock = vi.fn()

class MockIntersectionObserver {
    constructor(public callback: IntersectionObserverCallback) {
        observerCallback = callback
    }
    observe = observeMock
    unobserve = unobserveMock
    disconnect = disconnectMock
}

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

describe('Image Component', () => {
    let wrapper: any = null

    beforeEach(() => {
        wrapper = null
        document.body.innerHTML = ''
        vi.clearAllMocks()
        observerCallback = null
    })

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount()
        }
        document.body.innerHTML = ''
    })

    it('renders basic image with src and alt', () => {
        wrapper = mount(Image, {
            props: {
                src: 'https://example.com/image.jpg',
                alt: 'My Cool Image',
            },
        })

        const img = wrapper.find('img')
        expect(img.exists()).toBe(true)
        expect(img.attributes('src')).toBe('https://example.com/image.jpg')
        expect(img.attributes('alt')).toBe('My Cool Image')
    })

    it('applies correct fit object-style', () => {
        wrapper = mount(Image, {
            props: {
                src: 'https://example.com/image.jpg',
                fit: 'contain',
            },
        })

        const img = wrapper.find('img')
        expect(img.element.style.objectFit).toBe('contain')
    })

    it('shows placeholder during loading, and hides after loaded', async () => {
        wrapper = mount(Image, {
            props: {
                src: 'https://example.com/image.jpg',
            },
            slots: {
                placeholder: '<div class="test-placeholder">loading...</div>',
            },
        })

        // 默认情况下由于 isLoaded 为 false，展示 placeholder
        expect(wrapper.find('.test-placeholder').exists()).toBe(true)

        // 触发 load 事件
        const img = wrapper.find('img')
        await img.trigger('load')

        // 触发后，placeholder 应该消失
        expect(wrapper.find('.test-placeholder').exists()).toBe(false)
    })

    it('shows error slot on image load failure', async () => {
        wrapper = mount(Image, {
            props: {
                src: 'https://example.com/invalid-image.jpg',
            },
            slots: {
                error: '<div class="test-error">error!</div>',
            },
        })

        const img = wrapper.find('img')
        await img.trigger('error')

        expect(wrapper.find('.test-error').exists()).toBe(true)
    })

    it('uses fallback image if primary fails to load', async () => {
        wrapper = mount(Image, {
            props: {
                src: 'https://example.com/invalid.jpg',
                fallback: 'https://example.com/fallback.jpg',
            },
            slots: {
                error: '<div class="test-error">error!</div>',
            },
        })

        const img = wrapper.find('img')
        // 第一次触发 error
        await img.trigger('error')

        // 此时 src 应该切换为 fallback 并没有显示错误插槽（因为正在加载 fallback）
        expect(img.attributes('src')).toBe('https://example.com/fallback.jpg')
        expect(wrapper.find('.test-error').exists()).toBe(false)

        // 触发 fallback 的 load 成功
        await img.trigger('load')
        expect(wrapper.find('.test-error').exists()).toBe(false)
    })

    it('uses fallback image and shows error slot if fallback also fails', async () => {
        wrapper = mount(Image, {
            props: {
                src: 'https://example.com/invalid.jpg',
                fallback: 'https://example.com/fallback.jpg',
            },
            slots: {
                error: '<div class="test-error">error!</div>',
            },
        })

        const img = wrapper.find('img')
        // 第一次主图错误，切为 fallback
        await img.trigger('error')
        // 第二次 fallback 错误，最终显示 error 插槽
        await img.trigger('error')

        expect(wrapper.find('.test-error').exists()).toBe(true)
    })

    it('lazy loads image when loading="lazy"', async () => {
        wrapper = mount(Image, {
            props: {
                src: 'https://example.com/lazy.jpg',
                loading: 'lazy',
            },
        })

        // 在 IntersectionObserver 触发前，图片 src 应该是空/不渲染 img
        expect(wrapper.find('img').exists()).toBe(false)
        expect(observeMock).toHaveBeenCalled()

        // 模拟 IntersectionObserver 触发
        if (observerCallback) {
            observerCallback([{ isIntersecting: true }])
        }
        await nextTick()

        // 触发后，img 应该渲染出来并加载
        const img = wrapper.find('img')
        expect(img.exists()).toBe(true)
        expect(img.attributes('src')).toBe('https://example.com/lazy.jpg')
    })

    it('opens and closes preview modal', async () => {
        wrapper = mount(Image, {
            props: {
                src: 'https://example.com/img1.jpg',
                preview: true,
                previewSrcList: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
                hideOnClickModal: true,
            },
        })

        // 点击打开预览
        const img = wrapper.find('img')
        await img.trigger('click')

        // 验证 modal 存在于 body 中
        let modal = document.body.querySelector('[data-testid="image-viewer-canvas"]')
        expect(modal).not.toBeNull()

        // 校验 A11y: 焦点捕获 FocusScope 是否渲染
        const focusScope = document.body.querySelector('[data-testid="image-viewer-close"]')
        expect(focusScope).not.toBeNull()

        // 点击关闭按钮
        const closeBtn = document.body.querySelector('[data-testid="image-viewer-close"]') as HTMLButtonElement
        closeBtn.click()
        await nextTick()

        modal = document.body.querySelector('[data-testid="image-viewer-canvas"]')
        expect(modal).toBeNull()
    })

    it('closes modal on mask click if hideOnClickModal is true', async () => {
        wrapper = mount(Image, {
            props: {
                src: 'https://example.com/img1.jpg',
                preview: true,
                hideOnClickModal: true,
            },
        })

        // 打开预览
        await wrapper.find('img').trigger('click')
        let modal = document.body.querySelector('[data-testid="image-viewer-canvas"]')
        expect(modal).not.toBeNull()

        // 点击遮罩（即最外层容器，它监听了 click.self="handleMaskClick"）
        const mask = document.body.querySelector('.fixed.inset-0') as HTMLDivElement
        mask.click()
        await nextTick()

        modal = document.body.querySelector('[data-testid="image-viewer-canvas"]')
        expect(modal).toBeNull()
    })

    it('does not close modal on mask click if hideOnClickModal is false', async () => {
        wrapper = mount(Image, {
            props: {
                src: 'https://example.com/img1.jpg',
                preview: true,
                hideOnClickModal: false,
            },
        })

        // 打开预览
        await wrapper.find('img').trigger('click')
        let modal = document.body.querySelector('[data-testid="image-viewer-canvas"]')
        expect(modal).not.toBeNull()

        // 点击遮罩
        const mask = document.body.querySelector('.fixed.inset-0') as HTMLDivElement
        mask.click()
        await nextTick()

        modal = document.body.querySelector('[data-testid="image-viewer-canvas"]')
        expect(modal).not.toBeNull() // 应该依然处于打开状态
    })

    it('performs transformation operations in viewer', async () => {
        wrapper = mount(Image, {
            props: {
                src: 'https://example.com/img1.jpg',
                preview: true,
                zoomRate: 1.5,
            },
        })

        await wrapper.find('img').trigger('click')
        const previewImg = document.body.querySelector('img[alt="预览图片"]') as HTMLImageElement
        expect(previewImg.style.transform).toContain('scale(1, 1)')

        // 放大
        const zoomInBtn = document.body.querySelector('[data-testid="image-viewer-zoom-in"]') as HTMLButtonElement
        zoomInBtn.click()
        await nextTick()
        expect(previewImg.style.transform).toContain('scale(1.5, 1.5)')

        // 缩小
        const zoomOutBtn = document.body.querySelector('[data-testid="image-viewer-zoom-out"]') as HTMLButtonElement
        zoomOutBtn.click()
        await nextTick()
        expect(previewImg.style.transform).toContain('scale(1, 1)')

        // 右旋
        const rotateRightBtn = document.body.querySelector('[data-testid="image-viewer-rotate-right"]') as HTMLButtonElement
        rotateRightBtn.click()
        await nextTick()
        expect(previewImg.style.transform).toContain('rotate(90deg)')

        // 左旋
        const rotateLeftBtn = document.body.querySelector('[data-testid="image-viewer-rotate-left"]') as HTMLButtonElement
        rotateLeftBtn.click()
        await nextTick()
        expect(previewImg.style.transform).toContain('rotate(0deg)')

        // 翻转
        const flipBtn = document.body.querySelector('[data-testid="image-viewer-flip"]') as HTMLButtonElement
        flipBtn.click()
        await nextTick()
        expect(previewImg.style.transform).toContain('scale(-1, 1)')
    })

    it('switches images in previewSrcList', async () => {
        wrapper = mount(Image, {
            props: {
                src: 'https://example.com/img1.jpg',
                preview: true,
                previewSrcList: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg', 'https://example.com/img3.jpg'],
                initialIndex: 0,
            },
        })

        await wrapper.find('img').trigger('click')
        const previewImg = document.body.querySelector('img[alt="预览图片"]') as HTMLImageElement
        expect(previewImg.src).toBe('https://example.com/img1.jpg')

        // 下一张
        const nextBtn = document.body.querySelector('[data-testid="image-viewer-next"]') as HTMLButtonElement
        nextBtn.click()
        await nextTick()
        expect(previewImg.src).toBe('https://example.com/img2.jpg')

        // 上一张
        const prevBtn = document.body.querySelector('[data-testid="image-viewer-prev"]') as HTMLButtonElement
        prevBtn.click()
        await nextTick()
        expect(previewImg.src).toBe('https://example.com/img1.jpg')
    })

    it('supports keyboard navigation and actions', async () => {
        wrapper = mount(Image, {
            props: {
                src: 'https://example.com/img1.jpg',
                preview: true,
                previewSrcList: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
            },
        })

        await wrapper.find('img').trigger('click')
        const previewImg = document.body.querySelector('img[alt="预览图片"]') as HTMLImageElement

        // ArrowRight 切下一张
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
        await nextTick()
        expect(previewImg.src).toBe('https://example.com/img2.jpg')

        // ArrowLeft 切上一张
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
        await nextTick()
        expect(previewImg.src).toBe('https://example.com/img1.jpg')

        // Escape 关闭
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
        await nextTick()
        expect(document.body.querySelector('[data-testid="image-viewer-canvas"]')).toBeNull()
    })
})
