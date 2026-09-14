import { mount } from '@vue/test-utils'
import { describe, expect, it, afterEach } from 'vitest'
import { nextTick, ref } from 'vue'
import Popconfirm from './Popconfirm.vue'

describe('Popconfirm', () => {
    afterEach(() => {
        document.body.innerHTML = ''
    })

    it('renders slot trigger and opens popover content on click', async () => {
        const wrapper = mount(Popconfirm, {
            props: {
                title: '确定要删除吗？',
            },
            slots: {
                default: '<button id="trigger-btn">删除</button>',
            },
            attachTo: document.body,
        })

        const trigger = wrapper.find('#trigger-btn')
        expect(trigger.exists()).toBe(true)

        await trigger.trigger('click')
        await nextTick()

        expect(document.body.textContent).toContain('确定要删除吗？')
    })

    it('emits confirm when confirm button is clicked', async () => {
        const wrapper = mount(Popconfirm, {
            props: {
                title: '确认提交？',
                confirmButtonText: '确定提交',
            },
            slots: {
                default: '<button id="trigger-btn">提交</button>',
            },
            attachTo: document.body,
        })

        await wrapper.find('#trigger-btn').trigger('click')
        await nextTick()

        const buttons = Array.from(document.body.querySelectorAll('button'))
        const confirmBtn = buttons.find((btn) => btn.textContent?.includes('确定提交'))
        expect(confirmBtn).toBeDefined()

        confirmBtn?.click()
        await nextTick()

        expect(wrapper.emitted('confirm')).toBeTruthy()
    })

    it('emits cancel when cancel button is clicked', async () => {
        const wrapper = mount(Popconfirm, {
            props: {
                title: '确认提交？',
                cancelButtonText: '放弃',
            },
            slots: {
                default: '<button id="trigger-btn">提交</button>',
            },
            attachTo: document.body,
        })

        await wrapper.find('#trigger-btn').trigger('click')
        await nextTick()

        const buttons = Array.from(document.body.querySelectorAll('button'))
        const cancelBtn = buttons.find((btn) => btn.textContent?.includes('放弃'))
        expect(cancelBtn).toBeDefined()

        cancelBtn?.click()
        await nextTick()

        expect(wrapper.emitted('cancel')).toBeTruthy()
    })

    it('does not render cancel button when cancelable is false', async () => {
        const wrapper = mount(Popconfirm, {
            props: {
                title: '重要提示',
                cancelable: false,
                confirmButtonText: '我知道了',
            },
            slots: {
                default: '<button id="trigger-btn">查看</button>',
            },
            attachTo: document.body,
        })

        await wrapper.find('#trigger-btn').trigger('click')
        await nextTick()

        const buttons = Array.from(document.body.querySelectorAll('button'))
        const cancelBtn = buttons.find((btn) => btn.textContent?.includes('取消'))
        expect(cancelBtn).toBeUndefined()
    })

    it('supports v-model:open external controlled state', async () => {
        const openState = ref(false)
        const wrapper = mount(Popconfirm, {
            props: {
                title: '受控测试',
                open: openState.value,
                'onUpdate:open': (val: boolean) => {
                    openState.value = val
                },
            },
            slots: {
                default: '<button id="trigger-btn">受控按钮</button>',
            },
            attachTo: document.body,
        })

        expect(document.body.textContent).not.toContain('受控测试')

        await wrapper.setProps({ open: true })
        await nextTick()
        expect(document.body.textContent).toContain('受控测试')
    })

    it('renders content with role=alertdialog and connects aria labels', async () => {
        const wrapper = mount(Popconfirm, {
            props: {
                title: '删除确认',
            },
            slots: {
                default: '<button id="btn">打开</button>',
                description: '<span id="desc-text">此操作不可逆</span>',
            },
            attachTo: document.body,
        })
        const trigger = wrapper.find('#btn')
        await trigger.trigger('click')
        await nextTick()

        const dialog = document.body.querySelector('[role="alertdialog"]')
        expect(dialog).not.toBeNull()
        const labelledBy = dialog?.getAttribute('aria-labelledby')
        const describedBy = dialog?.getAttribute('aria-describedby')
        expect(labelledBy).toBeDefined()
        expect(describedBy).toBeDefined()

        const titleEl = document.getElementById(labelledBy!)
        const descEl = document.getElementById(describedBy!)
        expect(titleEl?.textContent?.trim()).toBe('删除确认')
        expect(descEl?.textContent?.trim()).toBe('此操作不可逆')
    })
})
