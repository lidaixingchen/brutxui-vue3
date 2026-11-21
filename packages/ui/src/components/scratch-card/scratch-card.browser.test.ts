import { afterEach, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { mount } from '@/test/browser-mount'
import '../../../dist/styles.css'
import ScratchCard from './ScratchCard.vue'

let wrapper: ReturnType<typeof mount> | undefined

afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
})

it('repaints from the local theme while retaining the scratched area', async () => {
    wrapper = mount(defineComponent(() => () => h('section', { class: 'theme-pastel' }, [
        h(ScratchCard, { style: { width: '180px', height: '96px' } }, () => 'Scratch to reveal'),
    ])))

    const scope = wrapper.element as HTMLElement
    const canvas = scope.querySelector('canvas')!
    const ctx = canvas.getContext('2d')!
    const edge = () => Array.from(ctx.getImageData(4, 4, 1, 1).data)
    const centerAlpha = () => ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data[3]

    await expect.poll(() => centerAlpha()).toBe(255)
    const oldColor = edge()
    await userEvent.click(canvas)
    await expect.poll(() => centerAlpha()).toBe(0)

    scope.classList.add('dark')
    await expect.poll(edge).not.toEqual(oldColor)
    expect(centerAlpha()).toBe(0)
})
