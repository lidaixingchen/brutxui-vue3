import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import SelectTestFixture from './SelectTestFixture.vue'
import { mount } from '@/test/browser-mount'

describe('Select Browser Integration (Chromium)', () => {
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

    it('expands with keyboard, verifies ARIA state and disabled item, and closes via Escape with focus restoration', async () => {
        const wrapper = mount(SelectTestFixture, { attachTo: host! })

        const trigger = host!.querySelector('button') as HTMLButtonElement
        expect(trigger).not.toBeNull()
        expect(trigger.getAttribute('aria-haspopup')).toBe('listbox')
        expect(trigger.getAttribute('aria-expanded')).toBe('false')

        // 1. 键盘聚焦并按下 ArrowDown 展开下拉菜单
        trigger.focus()
        expect(document.activeElement).toBe(trigger)

        const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', bubbles: true, cancelable: true })
        trigger.dispatchEvent(arrowDownEvent)
        await nextTick()
        await new Promise(r => setTimeout(r, 150))

        // 2. 验证展开后 ARIA 状态与 Teleport 下的 Listbox 存在
        expect(trigger.getAttribute('aria-expanded')).toBe('true')
        const listbox = document.querySelector('[role="listbox"]')
        expect(listbox).not.toBeNull()

        // 3. 验证选项存在且包含禁用状态
        const items = document.querySelectorAll('[role="option"]')
        expect(items.length).toBe(3)
        expect(items[1].getAttribute('aria-disabled') || items[1].getAttribute('data-disabled')).not.toBeNull()

        // 4. 按下 Escape 关闭下拉菜单
        const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true })
        document.activeElement?.dispatchEvent(escapeEvent)
        await nextTick()
        await new Promise(r => setTimeout(r, 150))

        // 验证已收起并保持触发器获得焦点
        expect(trigger.getAttribute('aria-expanded')).toBe('false')
        expect(document.activeElement).toBe(trigger)

        wrapper.unmount()
    })
})
