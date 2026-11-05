import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { h, nextTick } from 'vue'
import { mount } from '@/test/browser-mount'
import '../../dist/styles.css'
import Cascader from '../components/cascader/Cascader.vue'
import TreeSelect from '../components/tree-select/TreeSelect.vue'

const HOST_STYLE = { margin: '3rem', width: '20rem' }
const OPTIONS = [{ value: 'root', label: '根节点' }]
const NODES = [{ id: 'root', label: '根节点' }]
let wrapper: ReturnType<typeof mount> | undefined

async function settleMovement() {
    await Promise.all(wrapper!.element.getAnimations({ subtree: true }).map(animation => animation.finished))
}

afterEach(() => { wrapper?.unmount(); wrapper = undefined })

describe('选择器清除按钮位置', () => {
    it.each(['cascader', 'tree-select'] as const)('%s 通过键盘可以到达并执行清除动作', async (kind) => {
        wrapper = mount({ render: () => h('div', { style: HOST_STYLE }, [
            kind === 'cascader'
                ? h(Cascader, { options: OPTIONS, modelValue: ['root'], clearable: true })
                : h(TreeSelect, { nodes: NODES, modelValue: 'root', clearable: true }),
        ]) })
        const trigger = wrapper.element.querySelector<HTMLButtonElement>('[role="combobox"]')!
        trigger.focus()
        await nextTick()
        const clear = wrapper.element.querySelector<HTMLButtonElement>('button[aria-label="清除"]')!
        expect(clear).not.toBeNull()
        await userEvent.keyboard('{Tab}')
        expect(document.activeElement).toBe(clear)
        await userEvent.keyboard('{Enter}')
        expect(document.activeElement).toBe(trigger)
    })

    it.each(['cascader', 'tree-select'] as const)('%s 指针在触发器与清除动作之间移动时保持相对位置', async (kind) => {
        wrapper = mount({ render: () => h('div', { style: HOST_STYLE }, [
            kind === 'cascader'
                ? h(Cascader, { options: OPTIONS, modelValue: ['root'], clearable: true })
                : h(TreeSelect, { nodes: NODES, modelValue: 'root', clearable: true }),
        ]) })
        const trigger = wrapper.element.querySelector<HTMLButtonElement>('[role="combobox"]')!
        await userEvent.hover(trigger)
        await nextTick()
        await settleMovement()
        const clear = wrapper.element.querySelector<HTMLButtonElement>('button[aria-label="清除"]')!
        expect(clear).not.toBeNull()
        const beforeTrigger = trigger.getBoundingClientRect()
        const beforeClear = clear.getBoundingClientRect()

        await userEvent.hover(clear)
        await settleMovement()
        const afterTrigger = trigger.getBoundingClientRect()
        const afterClear = clear.getBoundingClientRect()
        expect(afterClear.x - afterTrigger.x).toBeCloseTo(beforeClear.x - beforeTrigger.x)
        expect(afterClear.y - afterTrigger.y).toBeCloseTo(beforeClear.y - beforeTrigger.y)
    })
})
