import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import MessageBox from './MessageBox.vue'
import {
    showMessageBox,
    showConfirm,
    showAlert,
    showPrompt,
} from './functional'
import * as envModule from '@/lib/env'

describe('MessageBox Component & Functional API', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        document.body.innerHTML = ''
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.useRealTimers()
        document.body.innerHTML = ''
    })

    describe('MessageBox.vue', () => {
        it('renders title, message, and action buttons properly', async () => {
            const wrapper = mount(MessageBox, {
                props: {
                    open: true,
                    title: '系统通知',
                    message: '您有一条新的系统公告。',
                    confirmButtonText: '收到',
                    cancelButtonText: '忽略',
                },
                attachTo: document.body,
            })

            await nextTick()
            expect(document.body.textContent).toContain('系统通知')
            expect(document.body.textContent).toContain('您有一条新的系统公告。')
            expect(document.body.textContent).toContain('收到')
            expect(document.body.textContent).toContain('忽略')

            wrapper.unmount()
        })

        it('emits confirm when confirm button is clicked', async () => {
            const wrapper = mount(MessageBox, {
                props: {
                    open: true,
                    title: '操作确认',
                },
                attachTo: document.body,
            })

            await nextTick()
            const confirmBtn = Array.from(document.body.querySelectorAll('button')).find((b) =>
                b.textContent?.includes('确认') || b.textContent?.includes('Confirm')
            )
            expect(confirmBtn).toBeDefined()

            confirmBtn!.click()
            await nextTick()
            expect(wrapper.emitted('confirm')).toBeTruthy()
            expect(wrapper.emitted('update:open')).toEqual([[false]])

            wrapper.unmount()
        })

        it('emits cancel when cancel button is clicked', async () => {
            const wrapper = mount(MessageBox, {
                props: {
                    open: true,
                    title: '操作确认',
                },
                attachTo: document.body,
            })

            await nextTick()
            const cancelBtn = Array.from(document.body.querySelectorAll('button')).find((b) =>
                b.textContent?.includes('取消') || b.textContent?.includes('Cancel')
            )
            expect(cancelBtn).toBeDefined()

            cancelBtn!.click()
            await nextTick()
            expect(wrapper.emitted('cancel')).toBeTruthy()
            expect(wrapper.emitted('update:open')).toEqual([[false]])

            wrapper.unmount()
        })

        it('validates input pattern in prompt mode and blocks submission on error', async () => {
            const wrapper = mount(MessageBox, {
                props: {
                    open: true,
                    title: '请输入邮箱',
                    showInput: true,
                    inputPattern: /^[\w.-]+@[\w.-]+\.\w+$/,
                    inputErrorMessage: '邮箱格式错误',
                },
                attachTo: document.body,
            })

            await nextTick()
            const input = document.body.querySelector('input')
            expect(input).not.toBeNull()

            // 输入不合规内容
            input!.value = 'invalid-email'
            input!.dispatchEvent(new Event('input'))
            await nextTick()

            const confirmBtn = Array.from(document.body.querySelectorAll('button')).find((b) =>
                b.textContent?.includes('确认') || b.textContent?.includes('Confirm')
            )

            confirmBtn!.click()
            await nextTick()
            // 验证未触发 confirm
            expect(wrapper.emitted('confirm')).toBeFalsy()
            expect(document.body.textContent).toContain('邮箱格式错误')

            // 修改为合规内容
            input!.value = 'user@example.com'
            input!.dispatchEvent(new Event('input'))
            await nextTick()

            confirmBtn!.click()
            await nextTick()
            expect(wrapper.emitted('confirm')?.[0]).toEqual(['user@example.com'])

            wrapper.unmount()
        })
    })

    describe('Functional APIs', () => {
        it('showMessageBox opens and resolves confirm action', async () => {
            const instance = showMessageBox({
                title: '命令式弹窗',
                message: '内容测试',
            })

            await nextTick()
            expect(document.body.textContent).toContain('命令式弹窗')
            expect(document.body.textContent).toContain('内容测试')

            const confirmBtn = Array.from(document.querySelectorAll('button')).find((b) =>
                b.textContent?.includes('确认') || b.textContent?.includes('Confirm')
            )
            expect(confirmBtn).toBeDefined()
            confirmBtn!.click()

            const result = await instance.promise
            expect(result).toEqual({ action: 'confirm', value: undefined })
        })

        it('showConfirm resolves boolean true on confirm and false on cancel', async () => {
            const confirmPromise = showConfirm('确定要删除吗？')
            await nextTick()

            const confirmBtn = Array.from(document.querySelectorAll('button')).find((b) =>
                b.textContent?.includes('确认') || b.textContent?.includes('Confirm')
            )
            confirmBtn!.click()

            const isConfirmed = await confirmPromise
            expect(isConfirmed).toBe(true)
        })

        it('showConfirm resolves false when cancel is clicked', async () => {
            const confirmPromise = showConfirm('确定要离开吗？')
            await nextTick()

            const cancelBtn = Array.from(document.querySelectorAll('button')).find((b) =>
                b.textContent?.includes('取消') || b.textContent?.includes('Cancel')
            )
            cancelBtn!.click()

            const isConfirmed = await confirmPromise
            expect(isConfirmed).toBe(false)
        })

        it('showAlert renders single button and resolves on click', async () => {
            const alertPromise = showAlert('密码重置成功')
            await nextTick()

            expect(document.body.textContent).toContain('密码重置成功')
            const buttons = Array.from(document.querySelectorAll('button')).filter((b) =>
                !b.querySelector('svg.lucide-x')
            )
            // 只有确定按钮（无取消按钮）
            expect(buttons.length).toBe(1)

            buttons[0].click()
            await expect(alertPromise).resolves.toBeUndefined()
        })

        it('showPrompt collects user input with pattern matching', async () => {
            const promptPromise = showPrompt('请输入新昵称', {
                inputValue: 'BrutalUser',
            })
            await nextTick()

            const input = document.querySelector('input')
            expect(input).not.toBeNull()
            expect(input!.value).toBe('BrutalUser')

            const confirmBtn = Array.from(document.querySelectorAll('button')).find((b) =>
                b.textContent?.includes('确认') || b.textContent?.includes('Confirm')
            )
            confirmBtn!.click()

            const res = await promptPromise
            expect(res).toEqual({ action: 'confirm', value: 'BrutalUser' })
        })

        it('handles SSR environment gracefully', async () => {
            vi.spyOn(envModule, 'canUseDocumentBody').mockReturnValue(false)

            const confirmed = await showConfirm('SSR Test')
            expect(confirmed).toBe(false)

            const promptRes = await showPrompt('SSR Prompt')
            expect(promptRes).toEqual({ action: 'cancel' })

            await expect(showAlert('SSR Alert')).resolves.toBeUndefined()
        })
    })
})
