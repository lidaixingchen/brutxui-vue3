import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, it, expect, vi } from 'vitest'
import Watermark from './Watermark.vue'

describe('Watermark.vue', () => {
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
})
