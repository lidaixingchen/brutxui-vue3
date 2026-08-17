import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, it, expect, vi } from 'vitest'
import Watermark from './Watermark.vue'

describe('Watermark.vue', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    it('renders slot content and watermark background successfully', async () => {
        const wrapper = mount(Watermark, {
            slots: {
                default: '<div class="content">Protected Content</div>'
            },
            props: {
                content: 'TEST_MARK'
            },
            attachTo: document.body
        })

        expect(wrapper.find('.content').text()).toBe('Protected Content')

        await nextTick()

        const watermarkDiv = wrapper.find('.absolute')
        expect(watermarkDiv.exists()).toBe(true)

        const style = watermarkDiv.element.getAttribute('style') || ''
        expect(style).toContain('background-image')

        wrapper.unmount()
    })

    it('renders watermark overlay above positioned content by default', async () => {
        const wrapper = mount(Watermark, {
            slots: {
                default: '<div class="content" style="position: relative; z-index: 10">Protected Content</div>'
            },
            props: { content: 'TEST_MARK' },
            attachTo: document.body
        })

        await nextTick()

        const watermarkDiv = wrapper.find('.absolute')
        expect(watermarkDiv.exists()).toBe(true)
        expect(Number((watermarkDiv.element as HTMLElement).style.zIndex)).toBeGreaterThan(10)

        wrapper.unmount()
    })

    it('does not render a blank watermark when content is empty and no image', async () => {
        const wrapper = mount(Watermark, {
            slots: { default: '<div class="content">Protected Content</div>' },
            props: { content: '' },
            attachTo: document.body
        })

        await nextTick()

        expect(wrapper.find('.content').text()).toBe('Protected Content')
        expect(wrapper.find('.absolute').exists()).toBe(false)

        wrapper.unmount()
    })

    it('renders watermark when content is provided after being empty', async () => {
        const wrapper = mount(Watermark, {
            props: { content: '' },
            attachTo: document.body
        })

        await nextTick()
        expect(wrapper.find('.absolute').exists()).toBe(false)

        await wrapper.setProps({ content: 'CONFIDENTIAL' })
        await new Promise((resolve) => setTimeout(resolve, 50))
        await nextTick()

        const watermarkDiv = wrapper.find('.absolute')
        expect(watermarkDiv.exists()).toBe(true)
        const style = watermarkDiv.element.getAttribute('style') || ''
        expect(style).toContain('background-image')

        wrapper.unmount()
    })

    it('re-renders watermark node when style is tampered with', async () => {
        const wrapper = mount(Watermark, {
            props: { content: 'TEST_MARK' },
            attachTo: document.body
        })

        await nextTick()
        const watermarkDiv = wrapper.find('.absolute')
        const el = watermarkDiv.element as HTMLElement

        // 模拟用户篡改样式
        el.setAttribute('style', 'display: none !important;')

        // 等待 MutationObserver 的宏任务完成
        await new Promise((resolve) => setTimeout(resolve, 50))
        await nextTick()

        // 重新获取最新的 DOM 节点引用！
        const newWatermarkDiv = wrapper.find('.absolute')
        const newEl = newWatermarkDiv.element as HTMLElement
        const style = newEl.getAttribute('style') || ''
        expect(style).not.toContain('display: none')
        expect(style).toContain('background-image')

        wrapper.unmount()
    })

    it('re-creates watermark node when deleted from DOM', async () => {
        const wrapper = mount(Watermark, {
            props: { content: 'TEST_MARK' },
            attachTo: document.body
        })

        await nextTick()
        const parent = wrapper.element as HTMLElement
        const watermarkDiv = parent.querySelector('.absolute') as HTMLElement
        expect(watermarkDiv).not.toBeNull()

        // 模拟恶意删除
        watermarkDiv.remove()

        await new Promise((resolve) => setTimeout(resolve, 50))
        await nextTick()

        // 确认水印已自动重新挂载
        const recreatedDiv = parent.querySelector('.absolute')
        expect(recreatedDiv).not.toBeNull()

        wrapper.unmount()
    })

    it('re-creates watermark when the wrapping node is deleted', async () => {
        const wrapper = mount(Watermark, {
            props: { content: 'TEST_MARK' },
            attachTo: document.body
        })

        await nextTick()
        const parent = wrapper.element as HTMLElement
        const watermarkDiv = parent.querySelector('.absolute') as HTMLElement
        expect(watermarkDiv).not.toBeNull()

        // 删除包裹层（display:contents 的 wrapper，即水印的父节点）而非水印自身
        watermarkDiv.parentElement?.remove()

        await new Promise((resolve) => setTimeout(resolve, 50))
        await nextTick()

        const recreatedDiv = parent.querySelector('.absolute')
        expect(recreatedDiv).not.toBeNull()

        wrapper.unmount()
    })

    it('re-creates watermark when the wrapping node style is tampered with', async () => {
        const wrapper = mount(Watermark, {
            props: { content: 'TEST_MARK' },
            attachTo: document.body
        })

        await nextTick()
        const watermarkDiv = wrapper.find('.absolute').element as HTMLElement

        // 把包裹层改为 display:none（包裹层而非水印自身的 style 变更）
        watermarkDiv.parentElement?.setAttribute('style', 'display: none')

        await new Promise((resolve) => setTimeout(resolve, 50))
        await nextTick()

        const newWatermark = wrapper.find('.absolute')
        expect(newWatermark.exists()).toBe(true)
        const style = (newWatermark.element as HTMLElement).getAttribute('style') || ''
        expect(style).toContain('background-image')

        wrapper.unmount()
    })

    it('re-creates watermark when moved outside the container', async () => {
        const wrapper = mount(Watermark, {
            props: { content: 'TEST_MARK' },
            attachTo: document.body
        })

        await nextTick()
        const parent = wrapper.element as HTMLElement
        const watermarkDiv = parent.querySelector('.absolute') as HTMLElement
        expect(watermarkDiv).not.toBeNull()

        // 把包裹层（含水印）整体移到容器外部
        document.body.appendChild(watermarkDiv.parentElement!)

        await new Promise((resolve) => setTimeout(resolve, 50))
        await nextTick()

        // 容器内应重建出水印
        const recreatedDiv = parent.querySelector('.absolute')
        expect(recreatedDiv).not.toBeNull()

        wrapper.unmount()
    })

    it('renders watermark with very large content without RangeError (SVG fallback)', async () => {
        const getContextSpy = vi
            .spyOn(HTMLCanvasElement.prototype, 'getContext')
            .mockReturnValue(null)

        const largeContent = 'A'.repeat(1000000)

        const wrapper = mount(Watermark, {
            props: { content: largeContent },
            attachTo: document.body
        })

        await nextTick()

        const watermarkDiv = wrapper.find('.absolute')
        expect(watermarkDiv.exists()).toBe(true)

        const style = watermarkDiv.element.getAttribute('style') || ''
        expect(style).toContain('background-image')
        expect(style).toContain('data:image/svg+xml;base64,')

        wrapper.unmount()
        getContextSpy.mockRestore()
    })

    it('renders watermark without MutationObserver support', async () => {
        vi.stubGlobal('MutationObserver', undefined)

        const wrapper = mount(Watermark, {
            props: { content: 'TEST_MARK' },
            attachTo: document.body
        })

        await nextTick()

        expect(wrapper.find('.absolute').exists()).toBe(true)

        wrapper.unmount()
    })

    it('falls back to SVG when canvas creation throws', async () => {
        const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string, options?: ElementCreationOptions) => {
            if (tagName === 'canvas') {
                throw new Error('canvas disabled')
            }
            return Document.prototype.createElement.call(document, tagName, options)
        })

        const wrapper = mount(Watermark, {
            props: { content: 'TEST_MARK' },
            attachTo: document.body
        })

        await nextTick()

        const watermarkDiv = wrapper.find('.absolute')
        expect(watermarkDiv.exists()).toBe(true)
        expect(watermarkDiv.element.getAttribute('style') || '').toContain('data:image/svg+xml;base64,')

        wrapper.unmount()
        createElementSpy.mockRestore()
    })

    it('handles incomplete offset or gap arrays safely', async () => {
        const wrapper = mount(Watermark, {
            props: {
                content: 'SAFE_OFFSET',
                offset: [10] as unknown as [number, number],
                gap: [] as unknown as [number, number],
            },
            attachTo: document.body
        })

        await nextTick()

        const watermarkDiv = wrapper.find('.absolute')
        expect(watermarkDiv.exists()).toBe(true)
        const style = watermarkDiv.element.getAttribute('style') || ''
        expect(style).not.toContain('undefined')
        expect(style).toContain('left: 10px')
        expect(style).toContain('top: 0px')

        wrapper.unmount()
    })

    it('safely parses string fontSize units and escapes special SVG attributes', async () => {
        const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)

        const wrapper = mount(Watermark, {
            props: {
                content: '<script>alert("xss")</script>',
                font: {
                    fontSize: '18px',
                    fontFamily: 'Arial" onmouseover="alert(1)',
                    color: 'rgba(0,0,0,0.2)" onload="',
                },
            },
            attachTo: document.body
        })

        await nextTick()

        const watermarkDiv = wrapper.find('.absolute')
        expect(watermarkDiv.exists()).toBe(true)
        const style = watermarkDiv.element.getAttribute('style') || ''
        expect(style).toContain('data:image/svg+xml;base64,')

        wrapper.unmount()
        getContextSpy.mockRestore()
    })

    it('falls back to SVG when canvas.toDataURL throws SecurityError', async () => {
        const toDataURLSpy = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(() => {
            throw new Error('SecurityError: The operation is insecure.')
        })

        const wrapper = mount(Watermark, {
            props: { content: 'TEST_TAINT' },
            attachTo: document.body
        })

        await nextTick()

        const watermarkDiv = wrapper.find('.absolute')
        expect(watermarkDiv.exists()).toBe(true)
        const style = watermarkDiv.element.getAttribute('style') || ''
        expect(style).toContain('data:image/svg+xml;base64,')

        wrapper.unmount()
        toDataURLSpy.mockRestore()
    })
})

