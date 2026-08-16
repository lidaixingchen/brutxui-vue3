import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useMessage, messageStore, removeMessage, destroyMessageSystem } from './useMessage'
import MessageContainer from '../components/message/MessageContainer.vue'

const TEST_CUSTOM_DURATION_MS = 1500
const ADVANCE_STEP_MS = 100

describe('useMessage', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        destroyMessageSystem()
    })

    afterEach(() => {
        destroyMessageSystem()
        vi.useRealTimers()
    })

    it('调用 info/success/warning/error 方法正确添加消息到 messageStore', () => {
        const msg = useMessage()

        msg.info('提示标题', '提示描述')
        expect(messageStore.value).toHaveLength(1)
        expect(messageStore.value[0].type).toBe('info')
        expect(messageStore.value[0].title).toBe('提示标题')
        expect(messageStore.value[0].description).toBe('提示描述')

        msg.success('成功标题')
        expect(messageStore.value).toHaveLength(2)
        expect(messageStore.value[1].type).toBe('success')

        msg.warning('警告标题')
        expect(messageStore.value).toHaveLength(3)
        expect(messageStore.value[2].type).toBe('warning')

        msg.error('错误标题')
        expect(messageStore.value).toHaveLength(4)
        expect(messageStore.value[3].type).toBe('error')
    })

    it('调用 show 方法支持自定义 duration 与 closable 选项', () => {
        const msg = useMessage()
        msg.show({
            type: 'success',
            title: '自定义消息',
            duration: TEST_CUSTOM_DURATION_MS,
            closable: false,
        })

        expect(messageStore.value).toHaveLength(1)
        expect(messageStore.value[0].duration).toBe(TEST_CUSTOM_DURATION_MS)
        expect(messageStore.value[0].closable).toBe(false)
    })

    it('duration 到期后自动从 messageStore 中移除消息', async () => {
        const msg = useMessage()
        msg.info('自动关闭消息', undefined)
        expect(messageStore.value).toHaveLength(1)

        const duration = messageStore.value[0].duration
        await vi.advanceTimersByTimeAsync(duration + ADVANCE_STEP_MS)
        expect(messageStore.value).toHaveLength(0)
    })

    it('通过返回的 close 闭包函数可提前手动移除消息', () => {
        const msg = useMessage()
        const close = msg.info('可关闭消息')
        expect(messageStore.value).toHaveLength(1)

        close()
        expect(messageStore.value).toHaveLength(0)
    })

    it('调用 removeMessage 根据 id 移除特定消息', () => {
        const msg = useMessage()
        msg.info('消息 1')
        msg.success('消息 2')
        expect(messageStore.value).toHaveLength(2)

        const firstId = messageStore.value[0].id
        removeMessage(firstId)
        expect(messageStore.value).toHaveLength(1)
        expect(messageStore.value[0].title).toBe('消息 2')
    })

    it('destroyMessageSystem 清空所有消息与定时器', () => {
        const msg = useMessage()
        msg.info('消息 1')
        msg.info('消息 2')
        expect(messageStore.value).toHaveLength(2)

        destroyMessageSystem()
        expect(messageStore.value).toHaveLength(0)
    })
})

describe('MessageContainer', () => {
    beforeEach(() => {
        destroyMessageSystem()
    })

    afterEach(() => {
        destroyMessageSystem()
    })

    it('正确为 error 消息设置 alert/assertive，为普通消息设置 status/polite', async () => {
        const msg = useMessage()
        msg.info('普通消息')
        msg.error('错误消息')

        const wrapper = mount(MessageContainer)
        const messages = wrapper.findAll('[role]')
        expect(messages).toHaveLength(2)

        expect(messages[0].attributes('role')).toBe('status')
        expect(messages[0].attributes('aria-live')).toBe('polite')

        expect(messages[1].attributes('role')).toBe('alert')
        expect(messages[1].attributes('aria-live')).toBe('assertive')
    })
})
