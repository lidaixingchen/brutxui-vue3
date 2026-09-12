import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import VirtualScrollTestFixture from './VirtualScrollTestFixture.vue'
import { mount } from '@/test/browser-mount'

describe('VirtualScroll Browser Integration (Chromium)', () => {
    let host: HTMLDivElement | null = null

    beforeEach(() => {
        host = document.createElement('div')
        document.body.appendChild(host)
    })

    afterEach(() => {
        if (host && host.parentNode) {
            host.parentNode.removeChild(host)
            host = null
        }
    })

    it('renders bounded DOM nodes for 500 items and recycles invisible items on scroll', async () => {
        const wrapper = mount(VirtualScrollTestFixture, { attachTo: host! })

        // 等待动态导入 @tanstack/vue-virtual 与 virtualizer mount
        await nextTick()
        await new Promise(r => setTimeout(r, 200))

        const scrollContainer = host!.querySelector('[role="list"]') as HTMLElement
        expect(scrollContainer).not.toBeNull()

        // 1. 初始挂载时，500 个数据项中实际挂载的 DOM 节点数量必须远小于 500（不可见区回收）
        const initialNodes = scrollContainer.querySelectorAll('[data-index]')
        expect(initialNodes.length).toBeGreaterThan(0)
        expect(initialNodes.length).toBeLessThan(50)

        // 验证首项可见
        const firstItem = scrollContainer.querySelector('[data-index="0"]')
        expect(firstItem).not.toBeNull()

        // 2. 模拟真实滚动操作（向下滚动 2000px）
        scrollContainer.scrollTop = 2000
        scrollContainer.dispatchEvent(new Event('scroll'))
        await nextTick()
        await new Promise(r => setTimeout(r, 200))

        // 3. 验证滚动后 DOM 窗口推进与旧节点回收（保持有限节点数量，远小于 500）
        const scrolledNodes = scrollContainer.querySelectorAll('[data-index]')
        expect(scrolledNodes.length).toBeLessThan(50)

        // 顶部已离开可见区的项（索引 0）已被回收
        const recycledItem = scrollContainer.querySelector('[data-index="0"]')
        expect(recycledItem).toBeNull()

        // 当前滚动位置（2000px / 40px = index 50 附近）的项已被渲染
        const middleItem = scrollContainer.querySelector('[data-index="50"]')
        expect(middleItem).not.toBeNull()

        wrapper.unmount()
    })
})
