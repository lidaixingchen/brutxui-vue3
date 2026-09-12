import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import Button from './Button.vue'

describe('Button native interaction contract', () => {
    it('submits a form through the native submit button behavior', () => {
        const submitted = vi.fn()
        const FormHarness = defineComponent({
            components: { ResourceButton: Button },
            setup() {
                return { submitted }
            },
            template: '<form @submit.prevent="submitted"><ResourceButton type="submit">Save</ResourceButton></form>',
        })
        const wrapper = mount(FormHarness, { attachTo: document.body })
        const button = wrapper.get('button')

        expect(button.attributes('type')).toBe('submit')
        button.element.click()
        expect(submitted).toHaveBeenCalledTimes(1)
        wrapper.unmount()
    })

    it('passes click, focus, and keyboard events through an asChild root', async () => {
        const clicked = vi.fn()
        const wrapper = mount(Button, {
            props: { asChild: true },
            attrs: { onClick: clicked },
            slots: { default: () => h('a', { href: '/next' }, 'Next') },
            attachTo: document.body,
        })
        const link = wrapper.get('a')

        link.element.focus()
        expect(document.activeElement).toBe(link.element)
        const keydown = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
        link.element.dispatchEvent(keydown)
        expect(keydown.defaultPrevented).toBe(false)
        await link.trigger('click')
        expect(clicked).toHaveBeenCalledTimes(1)
        wrapper.unmount()
    })
})
