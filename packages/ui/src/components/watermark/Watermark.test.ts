import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, it, expect } from 'vitest'
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
})
