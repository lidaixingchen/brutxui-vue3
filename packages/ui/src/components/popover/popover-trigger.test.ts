import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { PopoverRoot } from 'reka-ui'
import PopoverTrigger from './PopoverTrigger.vue'
import PopoverContent from './PopoverContent.vue'
it('保持已打开弹层与动态触发器 ID 的名称引用同步', async () => {
    const id = ref('first-trigger')
    const TriggerHost = defineComponent({ setup: () => () => h(PopoverTrigger, { id: id.value }, () => '触发器') })
    const wrapper = mount({ render: () => h(PopoverRoot, { open: true }, () => [
        h(TriggerHost), h(PopoverContent, {}, () => '内容'),
    ]) }, { attachTo: document.body })
    try {
        await flushPromises()
        const dialog = document.body.querySelector('[role="dialog"]')!
        expect(dialog.getAttribute('aria-labelledby')).toBe('first-trigger')
        id.value = 'second-trigger'
        await flushPromises()
        expect(document.getElementById('first-trigger')).toBeNull()
        expect(dialog.getAttribute('aria-labelledby')).toBe('second-trigger')
        expect(document.getElementById(dialog.getAttribute('aria-labelledby')!)).not.toBeNull()
    } finally {
        wrapper.unmount()
    }
})
