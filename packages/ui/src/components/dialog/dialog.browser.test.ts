import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import DialogTestFixture from './DialogTestFixture.vue'
import NestedDialogTestFixture from './NestedDialogTestFixture.vue'
import { mount } from '@/test/browser-mount'

describe('Dialog Browser Integration (Chromium)', () => {
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
        document.body.style.overflow = ''
        document.body.style.pointerEvents = ''
    })

    it('manages initial focus, focus trap, and returns focus on close', async () => {
        const wrapper = mount(DialogTestFixture, { attachTo: host! })
        const vm = wrapper.vm as unknown as { open: boolean }

        const trigger = document.getElementById('trigger-btn') as HTMLButtonElement
        expect(trigger).not.toBeNull()

        trigger.focus()
        expect(document.activeElement).toBe(trigger)

        // 打开弹窗
        vm.open = true
        await nextTick()
        await new Promise(r => setTimeout(r, 100))

        // 验证初始焦点进入弹窗内
        const activeEl = document.activeElement
        const dialogContent = document.getElementById('dialog-content')
        expect(dialogContent).not.toBeNull()
        expect(dialogContent!.contains(activeEl)).toBe(true)

        // 关闭弹窗
        vm.open = false
        await nextTick()
        await new Promise(r => setTimeout(r, 100))

        // 验证关闭后焦点自动返回到触发按钮
        expect(document.activeElement).toBe(trigger)

        wrapper.unmount()
    })

    it('handles nested dialog escape sequence and restores scroll state', async () => {
        const wrapper = mount(NestedDialogTestFixture, { attachTo: host! })
        const vm = wrapper.vm as unknown as { outerOpen: boolean; innerOpen: boolean }

        // 1. 打开外层弹窗
        vm.outerOpen = true
        await nextTick()
        await new Promise(r => setTimeout(r, 100))
        expect(document.getElementById('outer-content')).not.toBeNull()

        // 2. 打开内层嵌套弹窗
        vm.innerOpen = true
        await nextTick()
        await new Promise(r => setTimeout(r, 100))
        expect(document.getElementById('inner-content')).not.toBeNull()

        // 3. 模拟在内层弹窗按 Escape
        const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true })
        document.activeElement?.dispatchEvent(escapeEvent)
        await nextTick()
        await new Promise(r => setTimeout(r, 100))

        // 验证内层弹窗由于 Escape 自动关闭，外层弹窗依然保持开启
        expect(vm.innerOpen).toBe(false)
        expect(document.getElementById('inner-content')).toBeNull()
        expect(document.getElementById('outer-content')).not.toBeNull()

        // 4. 关闭外层弹窗
        vm.outerOpen = false
        await nextTick()
        await new Promise(r => setTimeout(r, 100))

        // 5. 验证弹窗彻底卸载后滚动与交互状态复原
        wrapper.unmount()
        expect(document.body.style.pointerEvents).not.toBe('none')
    })
})
